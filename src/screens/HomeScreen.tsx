import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ route }: Props) {
  const username = route.params?.username?.trim() || 'Bruker';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hei, {username}</Text>

      <View style={styles.card}>
        <Text style={styles.text}>Velkommen til Premier League Predictor!</Text>
        <Text style={styles.text}>
          Her kan du tippe kamper og konkurrere med venner.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5A2A40',
    marginBottom: 24,
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
  text: {
    fontSize: 16,
    color: '#A06A85',
    marginBottom: 10,
    lineHeight: 22,
  },
});