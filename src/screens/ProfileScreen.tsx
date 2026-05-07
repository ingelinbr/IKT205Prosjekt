import { useCallback, useState } from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

type ProfileStats = {
  totalPoints: number;
  totalPredictions: number;
  correctPredictions: number;
  rank: number | null;
};

export default function ProfileScreen({ navigation }: any) {
  const [username, setUsername] = useState('Bruker');
  const [email, setEmail] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalPoints: 0,
    totalPredictions: 0,
    correctPredictions: 0,
    rank: null,
  });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.log('Error loading user:', userError?.message);
      setLoading(false);
      return;
    }

    const user = userData.user;
    setEmail(user.email ?? '');

    const fallbackUsername =
      user.user_metadata?.username || user.email?.split('@')[0] || 'Bruker';

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, favorite_team')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('Error loading profile:', profileError.message);
    }

    setUsername(profile?.username || fallbackUsername);
    setFavoriteTeam(profile?.favorite_team ?? null);

    const { data: predictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('user_id, points');

    if (predictionsError) {
      console.log('Error loading profile stats:', predictionsError.message);
      setLoading(false);
      return;
    }

    const scores: Record<string, number> = {};
    let totalPredictions = 0;
    let correctPredictions = 0;
    let totalPoints = 0;

    predictions?.forEach((prediction: any) => {
      const userId = prediction.user_id;
      const predictionPoints = prediction.points ?? 0;

      scores[userId] = (scores[userId] || 0) + predictionPoints;

      if (userId === user.id) {
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

    const rankIndex = sortedUserIds.indexOf(user.id);

    setStats({
      totalPoints,
      totalPredictions,
      correctPredictions,
      rank: rankIndex !== -1 ? rankIndex + 1 : null,
    });

    setLoading(false);
  }

  async function handleSignOut() {
    Alert.alert('Logg ut', 'Er du sikker på at du vil logge ut?', [
      {
        text: 'Avbryt',
        style: 'cancel',
      },
      {
        text: 'Logg ut',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut();

          if (error) {
            Alert.alert('Feil', error.message);
            return;
          }

          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
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
        <View style={styles.loadingContent}>
          <Text style={styles.eyebrow}>Profil</Text>
          <Text style={styles.title}>Min profil</Text>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Laster profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Profil</Text>
        <Text style={styles.title}>Min profil</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.teamText}>
              Favorittlag: {favoriteTeam || 'Ikke valgt enda'}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.editButton}
          onPress={() =>
            navigation.navigate('EditProfile', {
              currentUsername: username,
              currentFavoriteTeam: favoriteTeam,
            })
          }
        >
          <Text style={styles.editButtonText}>Rediger profil</Text>
        </Pressable>

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
          <Text style={styles.sectionTitle}>Konto</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Brukernavn</Text>
            <Text style={styles.infoValue}>{username}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>E-post</Text>
            <Text style={styles.infoValue}>{email || 'Ikke tilgjengelig'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Favorittlag</Text>
            <Text style={styles.infoValue}>
              {favoriteTeam || 'Ikke valgt enda'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Profilbilde</Text>
            <Text style={styles.infoValue}>Initialer nå, bilde senere</Text>
          </View>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Logg ut</Text>
        </Pressable>
      </ScrollView>
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
  danger: '#B00020',
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
  loadingContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 26,
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
  loadingText: {
    color: colors.muted,
    marginTop: 12,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
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
    marginBottom: 12,
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
  signOutButton: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '900',
  },
});