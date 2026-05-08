import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen({ navigation }: any) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingSession, setLoadingSession] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    handleInitialUrl();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleResetUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  async function handleInitialUrl() {
    const url = await Linking.getInitialURL();

    if (url) {
      await handleResetUrl(url);
    }

    setLoadingSession(false);
  }

  function getUrlParams(url: string) {
    const params: Record<string, string> = {};

    const queryString = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
    const hashString = url.includes('#') ? url.split('#')[1] : '';

    const combined = [queryString, hashString].filter(Boolean).join('&');

    combined.split('&').forEach((part) => {
      const [key, value] = part.split('=');

      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    });

    return params;
  }

  async function handleResetUrl(url: string) {
    const params = getUrlParams(url);

    const accessToken = params.access_token;
    const refreshToken = params.refresh_token;
    const type = params.type;

    if (type !== 'recovery' && !accessToken) {
      return;
    }

    if (!accessToken || !refreshToken) {
      Alert.alert(
        'Ugyldig lenke',
        'Reset-lenken mangler nødvendig informasjon. Prøv å sende ny e-post.'
      );
      return;
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      Alert.alert('Feil', error.message);
    }
  }

  async function handleUpdatePassword() {
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirmPassword) {
      Alert.alert('Feil', 'Fyll inn begge feltene.');
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert('Feil', 'Passord må være minst 6 tegn.');
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert('Feil', 'Passordene er ikke like.');
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password: trimmedPassword,
    });

    setSaving(false);

    if (error) {
      Alert.alert('Feil', error.message);
      return;
    }

    Alert.alert('Passord oppdatert', 'Du kan nå logge inn med nytt passord.', [
      {
        text: 'OK',
        onPress: () => navigation.replace('Login'),
      },
    ]);
  }

  if (loadingSession) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5A2A40" />
        <Text style={styles.loadingText}>Åpner reset-lenke...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Nytt passord</Text>
        <Text style={styles.subtitle}>
          Skriv inn nytt passord for brukeren din.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nytt passord"
          placeholderTextColor="#A06A85"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Gjenta nytt passord"
          placeholderTextColor="#A06A85"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, saving && styles.disabledButton]}
          onPress={handleUpdatePassword}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Oppdater passord</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.secondaryButtonText}>Tilbake til innlogging</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFE4EC',
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5A2A40',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#A06A85',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 21,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F8C8DC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
    color: '#5A2A40',
  },
  button: {
    backgroundColor: '#FF6FA5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledButton: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F8C8DC',
  },
  secondaryButtonText: {
    color: '#5A2A40',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#5A2A40',
    fontWeight: '700',
    textAlign: 'center',
  },
});