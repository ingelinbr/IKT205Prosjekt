import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  TextInput,
  Pressable,
} from 'react-native';
import { fetchAllSeasonMatches } from '../services/footballApi';

const PAGE_SIZE = 20;

export default function AllMatchesScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  const [teamSearch, setTeamSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>(
    'ALL'
  );

  useEffect(() => {
    loadAllMatches();
  }, []);

  async function loadAllMatches() {
    setLoading(true);

    const data = await fetchAllSeasonMatches();

    const sorted = data.sort(
      (a: any, b: any) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );

    setMatches(sorted);
    setLoading(false);
  }

  const filteredMatches = matches.filter((match: any) => {
    const search = teamSearch.trim().toLowerCase();

    const home = match.teams.home.name.toLowerCase();
    const away = match.teams.away.name.toLowerCase();

    const matchesTeam =
      !search || home.includes(search) || away.includes(search);

    const status = match.fixture.status?.short;

    const matchesTime =
      timeFilter === 'ALL' ||
      (timeFilter === 'UPCOMING' && status === 'NS') ||
      (timeFilter === 'FINISHED' &&
        (status === 'FT' || status === 'AET' || status === 'PEN'));

    return matchesTeam && matchesTime;
  });

  const visibleMatches = filteredMatches.slice(0, visibleCount);

  function loadMore() {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Alle kamper</Text>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Alle kamper</Text>

      <TextInput
        style={styles.input}
        placeholder="Søk etter lag..."
        placeholderTextColor="#A06A85"
        value={teamSearch}
        onChangeText={(text) => {
          setTeamSearch(text);
          setVisibleCount(PAGE_SIZE);
        }}
      />

      <View style={styles.filterRow}>
        <Pressable
          style={[
            styles.filterButton,
            timeFilter === 'ALL' && styles.selectedFilter,
          ]}
          onPress={() => {
            setTimeFilter('ALL');
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <Text
            style={[
              styles.filterText,
              timeFilter === 'ALL' && styles.selectedFilterText,
            ]}
          >
            Alle
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterButton,
            timeFilter === 'UPCOMING' && styles.selectedFilter,
          ]}
          onPress={() => {
            setTimeFilter('UPCOMING');
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <Text
            style={[
              styles.filterText,
              timeFilter === 'UPCOMING' && styles.selectedFilterText,
            ]}
          >
            Kommende
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterButton,
            timeFilter === 'FINISHED' && styles.selectedFilter,
          ]}
          onPress={() => {
            setTimeFilter('FINISHED');
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <Text
            style={[
              styles.filterText,
              timeFilter === 'FINISHED' && styles.selectedFilterText,
            ]}
          >
            Ferdige
          </Text>
        </Pressable>
      </View>

      <Text style={styles.countText}>
        Viser {visibleMatches.length} av {filteredMatches.length} kamper
      </Text>

      <FlatList
        data={visibleMatches}
        keyExtractor={(item) => item.fixture.id.toString()}
        ListEmptyComponent={
          <Text style={styles.empty}>Ingen kamper funnet.</Text>
        }
        renderItem={({ item }) => {
          const homeGoals = item.goals?.home;
          const awayGoals = item.goals?.away;
          const hasResult = homeGoals !== null && awayGoals !== null;

          return (
            <View style={styles.card}>
              <Text style={styles.round}>{item.league.round}</Text>

              <Text style={styles.teams}>
                {item.teams.home.name} vs {item.teams.away.name}
              </Text>

              <Text style={styles.date}>
                {new Date(item.fixture.date).toLocaleString()}
              </Text>

              <Text style={styles.status}>
                Status: {item.fixture.status?.long ?? 'Ukjent'}
              </Text>

              <Text style={styles.score}>
                {hasResult ? `${homeGoals} - ${awayGoals}` : 'Ikke spilt'}
              </Text>
            </View>
          );
        }}
        ListFooterComponent={
          visibleCount < filteredMatches.length ? (
            <Pressable style={styles.nextButton} onPress={loadMore}>
              <Text style={styles.nextButtonText}>Neste</Text>
            </Pressable>
          ) : (
            <Text style={styles.endText}>Ingen flere kamper</Text>
          )
        }
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
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F8C8DC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#5A2A40',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#FFE4EC',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8B7C8',
  },
  selectedFilter: {
    backgroundColor: '#5A2A40',
    borderColor: '#5A2A40',
  },
  filterText: {
    color: '#5A2A40',
    fontWeight: 'bold',
  },
  selectedFilterText: {
    color: '#FFFFFF',
  },
  countText: {
    color: '#A06A85',
    fontWeight: '600',
    marginBottom: 12,
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
  date: {
    marginTop: 6,
    color: '#A06A85',
  },
  status: {
    marginTop: 6,
    color: '#A06A85',
    fontWeight: '600',
  },
  score: {
    marginTop: 8,
    fontSize: 22,
    color: '#5A2A40',
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#5A2A40',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 30,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  endText: {
    textAlign: 'center',
    color: '#A06A85',
    fontWeight: '600',
    marginVertical: 20,
  },
  empty: {
    color: '#5A2A40',
    fontSize: 16,
  },
});