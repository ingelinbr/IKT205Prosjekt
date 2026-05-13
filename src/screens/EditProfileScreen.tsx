import { useState } from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { PREMIER_LEAGUE_TEAMS } from '../services/premierLeagueTeams';

export default function EditProfileScreen({ navigation, route }: any) {
  const [username, setUsername] = useState(route.params?.currentUsername ?? '');
  const [favoriteTeam, setFavoriteTeam] = useState(
    route.params?.currentFavoriteTeam ?? ''
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    route.params?.currentAvatarUrl ?? null
  );
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    Alert.alert('Profilbilde', 'Velg hvordan du vil legge til bilde.', [
      {
        text: 'Ta bilde',
        onPress: takePhoto,
      },
      {
        text: 'Velg fra bibliotek',
        onPress: chooseFromLibrary,
      },
      {
        text: 'Avbryt',
        style: 'cancel',
      },
    ]);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Tillatelse mangler', 'Du må gi tilgang til kamera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (!result.canceled) {
      setLocalImageUri(result.assets[0].uri);
    }
  }

  async function chooseFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Tillatelse mangler', 'Du må gi tilgang til bilder.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (!result.canceled) {
      setLocalImageUri(result.assets[0].uri);
    }
  }

  async function uploadAvatar(userId: string) {
    if (!localImageUri) {
      return avatarUrl;
    }

    const response = await fetch(localImageUri);
    const arrayBuffer = await response.arrayBuffer();

    const fileExt = localImageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = fileExt === 'png' ? 'png' : 'jpg';
    const contentType = cleanExt === 'png' ? 'image/png' : 'image/jpeg';

    const filePath = `${userId}/avatar.${cleanExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    return `${data.publicUrl}?updated=${Date.now()}`;
  }

  async function saveProfile() {
    const trimmedUsername = username.trim();
    const trimmedFavoriteTeam = favoriteTeam.trim();

    if (!trimmedUsername) {
      Alert.alert('Feil', 'Brukernavn kan ikke være tomt.');
      return;
    }

    setSaving(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw new Error('Du må være logget inn.');
      }

      const userId = userData.user.id;
      const uploadedAvatarUrl = await uploadAvatar(userId);

      const { error } = await supabase.from('profiles').upsert(
        {
          id: userId,
          username: trimmedUsername,
          favorite_team: trimmedFavoriteTeam || null,
          avatar_url: uploadedAvatarUrl,
        },
        {
          onConflict: 'id',
        }
      );

      if (error) {
        throw error;
      }

      setAvatarUrl(uploadedAvatarUrl);
      Alert.alert('Lagret', 'Profilen din er oppdatert.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Feil', error.message);
    } finally {
      setSaving(false);
    }
  }

  function getInitials() {
    const name = username.trim();

    if (!name) return 'B';

    const parts = name.split(' ');

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  const previewImage = localImageUri || avatarUrl;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Profil</Text>
        <Text style={styles.title}>Rediger profil</Text>

        <View style={styles.card}>
          <Pressable style={styles.avatarPreview} onPress={pickImage}>
            {previewImage ? (
              <Image source={{ uri: previewImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials()}</Text>
            )}
          </Pressable>

          <Text style={styles.avatarHint}>
            Trykk for å ta bilde eller velge fra bibliotek
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Brukernavn</Text>

          <TextInput
            style={styles.input}
            placeholder="Brukernavn"
            placeholderTextColor={colors.muted}
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Favorittlag</Text>

          <Pressable
            style={styles.dropdownButton}
            onPress={() => setTeamPickerOpen(true)}
          >
            <Text
              style={[
                styles.dropdownText,
                !favoriteTeam && styles.dropdownPlaceholder,
              ]}
            >
              {favoriteTeam || 'Velg favorittlag'}
            </Text>

            <Text style={styles.dropdownArrow}>⌄</Text>
          </Pressable>

          <Pressable
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Lagre profil</Text>
            )}
          </Pressable>
        </View>

        <Modal
          visible={teamPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setTeamPickerOpen(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setTeamPickerOpen(false)}
          >
            <Pressable style={styles.modalCard}>
              <Text style={styles.modalTitle}>Velg favorittlag</Text>

              <FlatList
                data={PREMIER_LEAGUE_TEAMS}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.teamOption,
                      favoriteTeam === item && styles.selectedTeamOption,
                    ]}
                    onPress={() => {
                      setFavoriteTeam(item);
                      setTeamPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.teamOptionText,
                        favoriteTeam === item && styles.selectedTeamOptionText,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )}
              />

              <Pressable
                style={styles.clearTeamButton}
                onPress={() => {
                  setFavoriteTeam('');
                  setTeamPickerOpen(false);
                }}
              >
                <Text style={styles.clearTeamText}>Fjern favorittlag</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#FFF0F5',
  card: '#FFE4EC',
  primary: '#5A2A40',
  muted: '#A06A85',
  border: '#F3BDD1',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 28,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  avatarPreview: {
    width: 104,
    height: 104,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900',
  },
  avatarHint: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '900',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
    color: colors.primary,
  },
  dropdownButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: colors.muted,
    fontWeight: '600',
  },
  dropdownArrow: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(90, 42, 64, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 18,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 12,
  },
  teamOption: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTeamOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  teamOptionText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  selectedTeamOptionText: {
    color: colors.white,
  },
  clearTeamButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearTeamText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
});