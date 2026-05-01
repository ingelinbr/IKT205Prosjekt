import { useCallback, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }: any) {
  const [username, setUsername] = useState('Bruker');
  const [points, setPoints] = useState(0);
  const [rank, setRank] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  async function loadUserData() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return;

    const userId = userData.user.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    if (profile?.username) {
      setUsername(profile.username.split(' ')[0]);
    }

    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('user_id, points');

    if (error) {
      return;
    }

    const scores: Record<string, number> = {};

    predictions?.forEach((p: any) => {
      scores[p.user_id] = (scores[p.user_id] || 0) + (p.points ?? 0);
    });

    setPoints(scores[userId] ?? 0);

    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    const position = sorted.indexOf(userId);
    setRank(position !== -1 ? position + 1 : null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hei, {username}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dine poeng</Text>
        <Text style={styles.bigNumber}>{points}</Text>

        {rank && (
          <Text style={styles.subText}>Global plassering: #{rank}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hva vil du gjøre?</Text>

        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('MatchesTab')}
        >
          <Text style={styles.buttonText}>Se kamper</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.buttonText}>Toppliste</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate('LeaguesTab')}
        >
          <Text style={styles.buttonText}>Ligaer</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Om appen</Text>
        <Text style={styles.text}>
          Prediker Premier League-kamper, få poeng og konkurrer med venner.
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
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFE4EC',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5A2A40',
    marginBottom: 10,
  },
  bigNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#5A2A40',
  },
  text: {
    fontSize: 15,
    color: '#A06A85',
  },
  subText: {
    fontSize: 14,
    color: '#A06A85',
    marginTop: 6,
  },
  button: {
    backgroundColor: '#5A2A40',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});