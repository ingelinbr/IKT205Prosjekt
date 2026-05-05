import { useCallback, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
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
      console.log('Error loading home points:', error.message);
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Premier League Predictor</Text>

        <Text style={styles.title}>Hei, {username}</Text>

        <Text style={styles.subtitle}>
          Tipp kampresultater, samle poeng og klatre på topplisten.
        </Text>

        <View style={styles.pointsCard}>
          <View>
            <Text style={styles.cardTitle}>Dine poeng</Text>
            <Text style={styles.subText}>Poeng fra riktige prediksjoner</Text>
          </View>

          <View style={styles.pointsBadge}>
            <Text style={styles.bigNumber}>{points}</Text>
            <Text style={styles.pointsLabel}>poeng</Text>
          </View>

          {rank && (
            <Text style={styles.rankText}>Global plassering: #{rank}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Klar til å tippe?</Text>

          <Text style={styles.text}>
            Se kommende kamper og legg inn dine prediksjoner.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => navigation.navigate('MatchesTab')}
          >
            <Text style={styles.primaryButtonText}>Tipp kommende kamper</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Text style={styles.secondaryButtonText}>Se topplisten</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('LeaguesTab')}
          >
            <Text style={styles.secondaryButtonText}>Mine ligaer</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Om appen</Text>

          <Text style={styles.text}>
            Prediker resultatet på Premier League-kamper, få poeng for riktige
            tips og konkurrer med venner i egne ligaer.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = {
  background: '#FFF0F5',
  card: '#FFE4EC',
  primary: '#5A2A40',
  muted: '#A06A85',
  border: '#F3BDD1',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 22,
  },
  pointsCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
  },
  pointsBadge: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 18,
  },
  bigNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.white,
    lineHeight: 46,
  },
  pointsLabel: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
  },
  rankText: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 14,
    fontWeight: '600',
  },
  text: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 21,
    marginBottom: 14,
  },
  subText: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
});