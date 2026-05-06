import { useCallback, useState } from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

type LeaderboardUser = {
  user_id: string;
  username: string;
  totalPoints: number;
};

export default function LeaderboardScreen({ navigation }: any) {
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
    setLoading(true);

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
        <Text style={styles.eyebrow}>Global liga</Text>
        <Text style={styles.title}>Global toppliste</Text>
        <ActivityIndicator size="large" color="#5A2A40" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.eyebrow}>Global liga</Text>
      <Text style={styles.title}>Global toppliste</Text>
      <Text style={styles.subtitle}>
        Trykk på en spiller for å se offentlig profil.
      </Text>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.user_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>Ingen poeng registrert enda.</Text>
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
              <Text style={styles.userSubtitle}>
                {index === 0 ? 'Leder tabellen' : 'Premier League predictor'}
              </Text>
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
  empty: {
    color: '#5A2A40',
    fontSize: 15,
    fontWeight: '700',
  },
});