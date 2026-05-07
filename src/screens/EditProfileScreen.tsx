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
} from 'react-native';
import { supabase } from '../lib/supabase';
import { PREMIER_LEAGUE_TEAMS } from '../services/premierLeagueTeams';
import TeamLeagueScreen from '../screens/TeamLeagueScreen';

export default function EditProfileScreen({ navigation, route }: any) {
  const [username, setUsername] = useState(route.params?.currentUsername ?? '');
  const [favoriteTeam, setFavoriteTeam] = useState(
    route.params?.currentFavoriteTeam ?? ''
  );
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    const trimmedUsername = username.trim();
    const trimmedFavoriteTeam = favoriteTeam.trim();

    if (!trimmedUsername) {
      Alert.alert('Feil', 'Brukernavn kan ikke være tomt.');
      return;
    }

    setSaving(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setSaving(false);
      Alert.alert('Feil', 'Du må være logget inn.');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userData.user.id,
          username: trimmedUsername,
          favorite_team: trimmedFavoriteTeam || null,
        },
        {
          onConflict: 'id',
        }
      );

    setSaving(false);

    if (error) {
      Alert.alert('Feil', error.message);
      return;
    }

    Alert.alert('Lagret', 'Profilen din er oppdatert.');
    navigation.goBack();
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Profil</Text>
        <Text style={styles.title}>Rediger profil</Text>

        <View style={styles.card}>
          <View style={styles.avatarPreview}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>

          <Text style={styles.avatarHint}>
            Profilbilde kommer når Supabase Storage er klart.
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

          <Text style={styles.helperText}>
            Senere kan favorittlaget brukes til å plassere deg automatisk i en
            lag-liga.
          </Text>

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
                        favoriteTeam === item &&
                          styles.selectedTeamOptionText,
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
      </View>
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
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 32,
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
  helperText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginBottom: 14,
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