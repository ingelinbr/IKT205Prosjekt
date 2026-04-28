import { useCallback, useState } from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

type LeaderboardUser = {
  user_id: string;
  username: string;
  totalPoints: number;
};

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();

      const channel = supabase
        .channel('leaderboard-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'predictions',
          },
          () => {
            loadLeaderboard();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [])
  );

  async function loadLeaderboard() {
    const { data: predictions, error: predictionError } = await supabase
      .from('predictions')
      .select('user_id, points');

    if (predictionError) {
      console.log('Error loading leaderboard:', predictionError.message);
      setLoading(false);
      return;
    }

    const scores: Record<string, number> = {};

    predictions?.forEach((row: any) => {
      scores[row.user_id] = (scores[row.user_id] || 0) + (row.points ?? 0);
    });

    const userIds = Object.keys(scores);

    if (userIds.length === 0) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    if (profileError) {
      console.log('Error loading profiles:', profileError.message);
    }

    const profileMap: Record<string, string> = {};

    profiles?.forEach((profile: any) => {
      profileMap[profile.id] = profile.username;
    });

    const sorted = Object.entries(scores)
      .map(([user_id, totalPoints]) => ({
        user_id,
        username: profileMap[user_id] ?? `Bruker ${user_id.slice(0, 8)}`,
        totalPoints,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    setLeaderboard(sorted);
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
        <Text style={styles.title}>Global toppliste</Text>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Global toppliste</Text>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.user_id}
        ListEmptyComponent={
          <Text style={styles.empty}>Ingen poeng registrert enda.</Text>
        }
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <Text style={styles.rank}>{getMedal(index)}</Text>

            <View style={styles.userInfo}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.subtitle}>
                {index === 0 ? 'Leder tabellen' : 'Premier League predictor'}
              </Text>
            </View>

            <View style={styles.pointsBox}>
              <Text style={styles.points}>{item.totalPoints}</Text>
              <Text style={styles.pointsLabel}>poeng</Text>
            </View>
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
    fontSize: 30,
    fontWeight: 'bold',
    color: '#5A2A40',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFE4EC',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8B7C8',
  },
  rank: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#5A2A40',
    width: 54,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5A2A40',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#A06A85',
  },
  pointsBox: {
    backgroundColor: '#5A2A40',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 72,
  },
  points: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pointsLabel: {
    fontSize: 11,
    color: '#FFE4EC',
  },
  empty: {
    color: '#5A2A40',
    fontSize: 16,
  },
});