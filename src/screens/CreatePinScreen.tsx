import { useState } from 'react';
import { SafeAreaView, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { savePin } from '../services/pinService';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePin'>;

export default function CreatePinScreen({ navigation, route }: Props) {
  const [pin, setPin] = useState('');

  async function handleSavePin() {
    if (pin.length !== 4) {
      Alert.alert('Feil', 'PIN må være 4 tall.');
      return;
    }

    await savePin(pin);

    navigation.replace('Main', {
      username: route.params?.username ?? 'Bruker',
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Lag PIN-kode</Text>

      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        placeholder="4-sifret PIN"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
      />

      <Pressable style={styles.button} onPress={handleSavePin}>
        <Text style={styles.buttonText}>Lagre PIN</Text>
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
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF6FA5',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});