import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { fetchPreviousMatches } from '../services/footballApi';

export default function PreviousMatchesScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreviousMatches() {
      setLoading(true);

      const data = await fetchPreviousMatches();

      
      const finishedMatches = data.filter((match: any) => {
        const status = match.fixture?.status?.short;
        return status === 'FT' || status === 'AET' || status === 'PEN';
      });

      setMatches(finishedMatches);
      setLoading(false);
    }

    loadPreviousMatches();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Tidligere kamper</Text>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tidligere kamper</Text>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.fixture.id.toString()}
        ListEmptyComponent={
          <Text style={styles.empty}>Ingen tidligere kamper funnet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.round}>{item.league.round}</Text>

            <Text style={styles.teams}>
              {item.teams.home.name} vs {item.teams.away.name}
            </Text>

            <Text style={styles.score}>
              {item.goals.home} - {item.goals.away}
            </Text>

            <Text style={styles.date}>
              {new Date(item.fixture.date).toLocaleString()}
            </Text>
          </View>
        )}
      />
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFE4EC',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  round: {
    fontSize: 13,
    color: '#A06A85',
    marginBottom: 6,
  },
  teams: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5A2A40',
  },
  score: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5A2A40',
  },
  date: {
    marginTop: 6,
    color: '#A06A85',
  },
  empty: {
    color: '#5A2A40',
    fontSize: 16,
  },
});