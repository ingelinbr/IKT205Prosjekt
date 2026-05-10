import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { supabase } from '../lib/supabase';

type TeamLeagueUser = {
  user_id: string;
  username: string;
  favoriteTeam: string | null;
  avatarUrl: string | null;
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
      .select('id, username, favorite_team, avatar_url')
      .eq('favorite_team', teamName);

    if (profileError) {
      console.log('Error loading team profiles:', profileError.message);
      setLoading(false);
      return;
    }

    const userIds = profiles?.map((profile: any) => profile.id) ?? [];

    if (userIds.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const { data: predictions, error: predictionError } = await supabase
      .from('predictions')
      .select('user_id, points')
      .in('user_id', userIds);

    if (predictionError) {
      console.log('Error loading team league points:', predictionError.message);
      setLoading(false);
      return;
    }

    const scores: Record<string, number> = {};

    userIds.forEach((id: string) => {
      scores[id] = 0;
    });

    predictions?.forEach((row: any) => {
      scores[row.user_id] = (scores[row.user_id] || 0) + (row.points ?? 0);
    });

    const sorted =
      profiles
        ?.map((profile: any) => ({
          user_id: profile.id,
          username: profile.username ?? `Bruker ${profile.id.slice(0, 8)}`,
          favoriteTeam: profile.favorite_team ?? null,
          avatarUrl: profile.avatar_url ?? null,
          totalPoints: scores[profile.id] ?? 0,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints) ?? [];

    setUsers(sorted);
    setLoading(false);
  }

  function getRank(index: number) {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  }

  function getInitials(name: string) {
    const trimmed = name.trim();

    if (!trimmed) return 'B';

    const parts = trimmed.split(' ');

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  function renderUser({ item, index }: { item: TeamLeagueUser; index: number }) {
    const topThree = index < 3;

    return (
      <Pressable
        style={[styles.userRow, topThree && styles.topUserRow]}
        onPress={() =>
          navigation.navigate('PublicProfile', {
            userId: item.user_id,
          })
        }
      >
        <View style={styles.rankBox}>
          <Text style={styles.rankText}>{getRank(index)}</Text>
        </View>

        <View style={styles.avatar}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(item.username)}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.userMeta}>{teamName}-fan</Text>
        </View>

        <View style={styles.pointsPill}>
          <Text style={styles.points}>{item.totalPoints}</Text>
          <Text style={styles.pointsLabel}>poeng</Text>
        </View>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContent}>
          <Text style={styles.eyebrow}>Favorittlag-liga</Text>
          <Text style={styles.title}>{teamName}</Text>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Laster liga...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.user_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>Favorittlag-liga</Text>
            <Text style={styles.title}>{teamName}</Text>

            <View style={styles.heroCard}>
              <Text style={styles.heroIcon}>⭐</Text>

              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>{teamName}-fans</Text>
                <Text style={styles.heroSubtitle}>
                  Intern toppliste for alle som har valgt {teamName} som
                  favorittlag.
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>{users.length}</Text>
                <Text style={styles.countLabel}>fans</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Rangering</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Ingen fans enda</Text>
            <Text style={styles.emptyText}>
              Når brukere velger {teamName} som favorittlag, vises de her.
            </Text>
          </View>
        }
        renderItem={renderUser}
      />
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
  listContent: {
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
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 16,
  },
  loadingText: {
    color: colors.muted,
    marginTop: 12,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 30,
    marginRight: 12,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 3,
  },
  heroSubtitle: {
    color: colors.card,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  countBadge: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    minWidth: 62,
  },
  countText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  countLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 10,
  },
  userRow: {
    backgroundColor: colors.softCard,
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  topUserRow: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
  },
  rankBox: {
    width: 34,
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '900',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 11,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  userMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  pointsPill: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    minWidth: 62,
  },
  points: {
    color: colors.white,
    fontSize: 19,
    fontWeight: '900',
  },
  pointsLabel: {
    color: colors.card,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});