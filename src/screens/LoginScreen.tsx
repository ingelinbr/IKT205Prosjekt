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
import { signIn, signUp } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Feil', 'Fyll inn både e-post og passord.');
      return;
    }

    const { data, error } = await signIn(trimmedEmail, trimmedPassword);

    if (error) {
      Alert.alert('Innlogging feilet', error.message);
      return;
    }

    const displayName = data.user?.user_metadata?.username || 'Bruker';
    navigation.replace('Home', { username: displayName });
  };

  const handleSignUp = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedEmail || !trimmedPassword) {
      Alert.alert('Feil', 'Fyll inn navn, e-post og passord.');
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert('Feil', 'Passord må være minst 6 tegn.');
      return;
    }

    const { error } = await signUp(trimmedEmail, trimmedPassword, trimmedUsername);

    if (error) {
      Alert.alert('Registrering feilet', error.message);
      return;
    }

    Alert.alert(
      'Bruker opprettet',
      'Sjekk e-posten din og bekreft kontoen før du logger inn.'
    );

    setUsername('');
    setEmail('');
    setPassword('');
    setIsRegisterMode(false);
  };

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
            placeholder="Navn"
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
            ? 'Fyll inn navn, e-post og passord for å opprette bruker.'
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