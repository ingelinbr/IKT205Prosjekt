import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabase';

type PublicStats = {
  totalPoints: number;
  totalPredictions: number;
  correctPredictions: number;
  rank: number | null;
};

export default function PublicProfileScreen({ route }: any) {
  const { userId } = route.params;

  const [username, setUsername] = useState('Bruker');
  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<PublicStats>({
    totalPoints: 0,
    totalPredictions: 0,
    correctPredictions: 0,
    rank: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicProfile();
  }, []);

  async function loadPublicProfile() {
    setLoading(true);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, favorite_team, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.log('Error loading public profile:', profileError.message);
    }

    setUsername(profile?.username ?? 'Bruker');
    setFavoriteTeam(profile?.favorite_team ?? null);
    setAvatarUrl(profile?.avatar_url ?? null);

    const { data: predictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('user_id, points');

    if (predictionsError) {
      console.log('Error loading public stats:', predictionsError.message);
      setLoading(false);
      return;
    }

    const scores: Record<string, number> = {};
    let totalPredictions = 0;
    let correctPredictions = 0;
    let totalPoints = 0;

    predictions?.forEach((prediction: any) => {
      const predictionUserId = prediction.user_id;
      const predictionPoints = prediction.points ?? 0;

      scores[predictionUserId] =
        (scores[predictionUserId] || 0) + predictionPoints;

      if (predictionUserId === userId) {
        totalPredictions += 1;
        totalPoints += predictionPoints;

        if (predictionPoints > 0) {
          correctPredictions += 1;
        }
      }
    });

    const sortedUserIds = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    const rankIndex = sortedUserIds.indexOf(userId);

    setStats({
      totalPoints,
      totalPredictions,
      correctPredictions,
      rank: rankIndex !== -1 ? rankIndex + 1 : null,
    });

    setLoading(false);
  }

  function getInitials() {
    const name = username.trim();

    if (!name) return 'B';

    const parts = name.split(' ');

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>Profil</Text>
          <Text style={styles.title}>Spillerprofil</Text>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Profil</Text>
        <Text style={styles.title}>Spillerprofil</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials()}</Text>
            )}
          </View>

          <Text style={styles.username}>{username}</Text>
          <Text style={styles.favoriteTeam}>
            Favorittlag: {favoriteTeam || 'Ikke valgt enda'}
          </Text>
        </View>

        <View style={styles.pointsCard}>
          <Text style={styles.cardLabel}>Total poeng</Text>
          <Text style={styles.bigNumber}>{stats.totalPoints}</Text>
          <Text style={styles.cardText}>
            {stats.rank
              ? `Global plassering: #${stats.rank}`
              : 'Ingen global plassering enda'}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalPredictions}</Text>
            <Text style={styles.statLabel}>Prediksjoner</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.correctPredictions}</Text>
            <Text style={styles.statLabel}>Riktige tips</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Offentlig info</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Brukernavn</Text>
            <Text style={styles.infoValue}>{username}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Favorittlag</Text>
            <Text style={styles.infoValue}>
              {favoriteTeam || 'Ikke valgt enda'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Profilbilde</Text>
            <Text style={styles.infoValue}>
              {avatarUrl ? 'Lastet opp' : 'Initialer'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const colors = {
  background: '#FFF0F5',
  card: '#FFE4EC',
  softCard: '#FFF7FA',
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 28,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 18,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
  },
  username: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  },
  favoriteTeam: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '700',
  },
  pointsCard: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
  },
  cardLabel: {
    color: colors.card,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  bigNumber: {
    color: colors.white,
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 46,
  },
  cardText: {
    color: colors.card,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.softCard,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 12,
  },
  infoRow: {
    backgroundColor: colors.softCard,
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '700',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '800',
  },
});