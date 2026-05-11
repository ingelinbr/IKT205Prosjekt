import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';
import * as Linking from 'expo-linking';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function ensureProfileExists(user: any) {
    const fallbackUsername =
      user.user_metadata?.username || user.email?.split('@')[0] || 'Bruker';

    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (checkError) {
      console.log('Error checking profile after login:', checkError.message);
      return;
    }

    if (existingProfile) {
      return;
    }

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      username: fallbackUsername,
      favorite_team: null,
      avatar_url: null,
    });

    if (insertError) {
      console.log('Error creating profile after login:', insertError.message);
    }
  }

  async function handleSignIn() {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Feil', 'Fyll inn både e-post og passord.');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    });

    if (error) {
      Alert.alert('Innlogging feilet', error.message);
      return;
    }

    if (!data.user) {
      Alert.alert('Innlogging feilet', 'Fant ikke bruker.');
      return;
    }

    await ensureProfileExists(data.user);

    const displayName =
      data.user.user_metadata?.username ||
      data.user.email?.split('@')[0] ||
      'Bruker';

    navigation.replace('CreatePin', { username: displayName });
  }

  async function handleSignUp() {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedEmail || !trimmedPassword) {
      Alert.alert('Feil', 'Fyll inn fornavn, e-post og passord.');
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert('Feil', 'Passord må være minst 6 tegn.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: trimmedPassword,
      options: {
        data: {
          username: trimmedUsername,
        },
      },
    });

    if (error) {
      Alert.alert('Registrering feilet', error.message);
      return;
    }

    if (data.session?.user) {
      await ensureProfileExists(data.session.user);

      Alert.alert(
        'Bruker opprettet',
        'Brukeren er opprettet. Nå kan du lage PIN.'
      );

      navigation.replace('CreatePin', { username: trimmedUsername });
      return;
    }

    Alert.alert(
      'Bruker opprettet',
      'Sjekk e-posten din og bekreft brukeren før du logger inn.'
    );

    setUsername('');
    setEmail('');
    setPassword('');
    setIsRegisterMode(false);
  }

async function handleForgotPassword() {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    Alert.alert('Feil', 'Skriv inn e-postadressen din først.');
    return;
  }

  const redirectUrl = 'exp://192.168.10.147:8081/--/reset-password';

  console.log('Password reset redirect URL:', redirectUrl);

  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
    redirectTo: redirectUrl,
  });

  if (error) {
    Alert.alert('Feil', error.message);
    return;
  }

  Alert.alert(
    'E-post sendt',
    'Hvis e-posten finnes, får du en lenke for å tilbakestille passordet.'
  );
}

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Premier League Predictor</Text>
        <Text style={styles.subtitle}>
          {isRegisterMode ? 'Opprett bruker' : 'Logg inn'}
        </Text>

        {isRegisterMode && (
          <TextInput
            style={styles.input}
            placeholder="Fornavn"
            placeholderTextColor="#A06A85"
            value={username}
            onChangeText={setUsername}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="E-post"
          placeholderTextColor="#A06A85"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Passord"
          placeholderTextColor="#A06A85"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!isRegisterMode && (
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotButtonText}>Glemt passord?</Text>
          </TouchableOpacity>
        )}

        {isRegisterMode ? (
          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Opprett bruker</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSignIn}>
            <Text style={styles.buttonText}>Logg inn</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setIsRegisterMode((prev) => !prev)}
        >
          <Text style={styles.secondaryButtonText}>
            {isRegisterMode
              ? 'Har du allerede bruker? Logg inn'
              : 'Har du ikke bruker? Opprett bruker'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          {isRegisterMode
            ? 'Etter registrering bekrefter du e-post før innlogging.'
            : 'Bruk e-post og passord for å logge inn.'}
        </Text>
      </View>
    </KeyboardAvoidingView>
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5A2A40',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A06A85',
    textAlign: 'center',
    marginBottom: 24,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 12,
  },
  forgotButtonText: {
    color: '#5A2A40',
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#FF6FA5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
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
  note: {
    marginTop: 18,
    textAlign: 'center',
    color: '#A06A85',
    fontSize: 13,
  },
});