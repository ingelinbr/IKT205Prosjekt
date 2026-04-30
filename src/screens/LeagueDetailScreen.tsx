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
import { updateUserPredictionPoints } from '../services/predictionScoring';

type UserScore = {
  user_id: string;
  username: string;
  totalPoints: number;
};

export default function LeagueDetailScreen({ route }: any) {
  const { leagueId, leagueName, joinCode } = route.params;

  const [leaderboard, setLeaderboard] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadLeagueLeaderboard();

      const channel = supabase
        .channel(`league-leaderboard-${leagueId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'predictions',
          },
          () => {
            loadLeagueLeaderboard();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [leagueId])
  );

  async function loadLeagueLeaderboard() {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData.user;

    if (currentUser) {
      await updateUserPredictionPoints(currentUser.id);
    }

    const { data: members, error: memberError } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', leagueId);

    if (memberError) {
      console.log('Error loading members:', memberError.message);
      setLoading(false);
      return;
    }

    const userIds = members?.map((m: any) => m.user_id) ?? [];

    if (userIds.length === 0) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    const { data: predictions, error: predictionError } = await supabase
      .from('predictions')
      .select('user_id, points')
      .in('user_id', userIds);

    if (predictionError) {
      console.log('Error loading predictions:', predictionError.message);
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

    const scores: Record<string, number> = {};

    userIds.forEach((id: string) => {
      scores[id] = 0;
    });

    predictions?.forEach((row: any) => {
      scores[row.user_id] = (scores[row.user_id] || 0) + (row.points ?? 0);
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
        <Text style={styles.title}>{leagueName}</Text>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{leagueName}</Text>
      <Text style={styles.code}>Kode: {joinCode}</Text>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.user_id}
        ListEmptyComponent={
          <Text style={styles.empty}>Ingen medlemmer eller poeng enda.</Text>
        }
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <Text style={styles.rank}>{getMedal(index)}</Text>

            <View style={styles.userInfo}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.subtitle}>League member</Text>
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
    marginBottom: 6,
  },
  code: {
    color: '#A06A85',
    fontWeight: 'bold',
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