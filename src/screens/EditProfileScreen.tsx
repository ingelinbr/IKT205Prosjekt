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
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function EditProfileScreen({ navigation, route }: any) {
  const [username, setUsername] = useState(route.params?.currentUsername ?? '');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    const trimmedUsername = username.trim();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Profil</Text>
        <Text style={styles.title}>Rediger profil</Text>

        <View style={styles.card}>
          <View style={styles.avatarPreview}>
            <Text style={styles.avatarText}>
              {username ? username.slice(0, 2).toUpperCase() : 'B'}
            </Text>
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
          <TextInput
            style={styles.input}
            placeholder="F.eks. Arsenal"
            placeholderTextColor={colors.muted}
            value={favoriteTeam}
            onChangeText={setFavoriteTeam}
          />

          <Text style={styles.helperText}>
            Favorittlag og profilbilde kan kobles til Supabase senere.
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
});