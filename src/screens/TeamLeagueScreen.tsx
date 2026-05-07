import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { supabase } from '../lib/supabase';

type TeamLeagueUser = {
  user_id: string;
  username: string;
  totalPoints: number;
};

export default function TeamLeagueScreen({ navigation, route }: any) {
  const { teamName } = route.params;

  const [users, setUsers] = useState<TeamLeagueUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamLeague();
  }, []);

  async function loadTeamLeague() {
    setLoading(true);

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, favorite_team')
      .eq('favorite_team', teamName);

    if (profileError) {
      console.log('Error loading team profiles:', profileError.message);
      setLoading(false);
      return;
    }

    const { data: predictions, error: predictionError } = await supabase
      .from('predictions')
      .select('user_id, points');

    if (predictionError) {
      console.log('Error loading team league points:', predictionError.message);
      setLoading(false);
      return;
    }

    const scores: Record<string, number> = {};

    predictions?.forEach((row: any) => {
      scores[row.user_id] = (scores[row.user_id] || 0) + (row.points ?? 0);
    });

    const sorted =
      profiles
        ?.map((profile: any) => ({
          user_id: profile.id,
          username: profile.username ?? `Bruker ${profile.id.slice(0, 8)}`,
          totalPoints: scores[profile.id] ?? 0,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints) ?? [];

    setUsers(sorted);
    setLoading(false);
  }

  function getMedal(index: number) {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.eyebrow}>Favorittlag-liga</Text>
        <Text style={styles.title}>{teamName}</Text>
        <ActivityIndicator size="large" color="#5A2A40" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.eyebrow}>Favorittlag-liga</Text>
      <Text style={styles.title}>{teamName}</Text>
      <Text style={styles.subtitle}>
        Alle brukere som har valgt {teamName} som favorittlag.
      </Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.user_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Ingen fans enda</Text>
            <Text style={styles.emptyText}>
              Når brukere velger {teamName} som favorittlag, vises de her.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate('PublicProfile', {
                userId: item.user_id,
              })
            }
          >
            <Text style={styles.rank}>{getMedal(index)}</Text>

            <View style={styles.userInfo}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.userSubtitle}>{teamName}-fan</Text>
            </View>

            <View style={styles.pointsBox}>
              <Text style={styles.points}>{item.totalPoints}</Text>
              <Text style={styles.pointsLabel}>poeng</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 20,
    paddingTop: 26,
  },
  listContent: {
    paddingBottom: 28,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A06A85',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#5A2A40',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#A06A85',
    lineHeight: 20,
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#FFE4EC',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3BDD1',
  },
  rank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5A2A40',
    width: 52,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 17,
    fontWeight: '800',
    color: '#5A2A40',
  },
  userSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#A06A85',
    fontWeight: '600',
  },
  pointsBox: {
    backgroundColor: '#5A2A40',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 13,
    alignItems: 'center',
    minWidth: 68,
  },
  points: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pointsLabel: {
    fontSize: 11,
    color: '#FFE4EC',
  },
  emptyCard: {
    backgroundColor: '#FFE4EC',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3BDD1',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#5A2A40',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#A06A85',
    lineHeight: 20,
  },
});