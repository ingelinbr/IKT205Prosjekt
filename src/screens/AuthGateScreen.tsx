import { useState } from 'react';
import { SafeAreaView, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { validatePin } from '../services/pinService';

type Props = NativeStackScreenProps<RootStackParamList, 'PinLogin'>;

export default function PinLoginScreen({ navigation }: Props) {
  const [pin, setPin] = useState('');

  async function handlePinLogin() {
    const isValid = await validatePin(pin);

    if (!isValid) {
      Alert.alert('Feil PIN', 'PIN-koden er ikke riktig.');
      setPin('');
      return;
    }

    navigation.replace('Main', { username: 'Bruker' });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Logg inn med PIN</Text>

      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        placeholder="PIN"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
      />

      <Pressable style={styles.button} onPress={handlePinLogin}>
        <Text style={styles.buttonText}>Logg inn</Text>
      </Pressable>

      <Pressable onPress={() => navigation.replace('Login')}>
        <Text style={styles.link}>Logg inn med e-post i stedet</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5A2A40',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6FA5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  link: {
    marginTop: 18,
    color: '#5A2A40',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});