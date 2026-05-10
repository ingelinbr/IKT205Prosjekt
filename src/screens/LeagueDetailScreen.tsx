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
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';

type UserScore = {
  user_id: string;
  username: string;
  favoriteTeam: string | null;
  avatarUrl: string | null;
  totalPoints: number;
};

export default function LeagueDetailScreen({ navigation, route }: any) {
  const { leagueId, leagueName, joinCode } = route.params;

  const [leaderboard, setLeaderboard] = useState<UserScore[]>([]);
  const [leagueTitle, setLeagueTitle] = useState(leagueName);
  const [leagueJoinCode, setLeagueJoinCode] = useState(joinCode);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState(leagueName);
  const [manageOpen, setManageOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOwner = currentUserId && ownerId && currentUserId === ownerId;

  useEffect(() => {
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          loadLeagueLeaderboard();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'league_members',
        },
        () => {
          loadLeagueLeaderboard();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leagues',
        },
        () => {
          loadLeagueLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadLeagueLeaderboard() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (userData.user) {
      setCurrentUserId(userData.user.id);
    }

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name, join_code, owner_id')
      .eq('id', leagueId)
      .maybeSingle();

    if (leagueError) {
      console.log('Error loading league:', leagueError.message);
    }

    if (league) {
      setLeagueTitle(league.name);
      setEditName(league.name);
      setLeagueJoinCode(league.join_code);
      setOwnerId(league.owner_id);
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
      .select('id, username, favorite_team, avatar_url')
      .in('id', userIds);

    if (profileError) {
      console.log('Error loading profiles:', profileError.message);
    }

    const profileMap: Record<
      string,
      {
        username: string;
        favoriteTeam: string | null;
        avatarUrl: string | null;
      }
    > = {};

    profiles?.forEach((profile: any) => {
      profileMap[profile.id] = {
        username: profile.username,
        favoriteTeam: profile.favorite_team ?? null,
        avatarUrl: profile.avatar_url ?? null,
      };
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
        username:
          profileMap[user_id]?.username ?? `Bruker ${user_id.slice(0, 8)}`,
        favoriteTeam: profileMap[user_id]?.favoriteTeam ?? null,
        avatarUrl: profileMap[user_id]?.avatarUrl ?? null,
        totalPoints,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    setLeaderboard(sorted);
    setLoading(false);
  }

  async function updateLeagueName() {
    const name = editName.trim();

    if (!name) {
      Alert.alert('Feil', 'Liga-navn kan ikke være tomt.');
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from('leagues')
      .update({ name })
      .eq('id', leagueId);

    setSaving(false);

    if (error) {
      Alert.alert('Feil', error.message);
      return;
    }

    setLeagueTitle(name);
    Alert.alert('Lagret', 'Liga-navnet er oppdatert.');
  }

  async function removeMember(member: UserScore) {
    if (member.user_id === ownerId) {
      Alert.alert('Kan ikke fjerne eier', 'Eieren av ligaen kan ikke fjernes.');
      return;
    }

    Alert.alert(
      'Fjern medlem',
      `Vil du fjerne ${member.username} fra ligaen?`,
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Fjern',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('league_members')
              .delete()
              .eq('league_id', leagueId)
              .eq('user_id', member.user_id);

            if (error) {
              Alert.alert('Feil', error.message);
              return;
            }

            loadLeagueLeaderboard();
          },
        },
      ]
    );
  }

  async function deleteLeague() {
    Alert.alert(
      'Slett liga',
      'Er du sikker? Dette fjerner ligaen for alle medlemmer.',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);

            const { error: memberError } = await supabase
              .from('league_members')
              .delete()
              .eq('league_id', leagueId);

            if (memberError) {
              setSaving(false);
              Alert.alert('Feil', memberError.message);
              return;
            }

            const { error: leagueError } = await supabase
              .from('leagues')
              .delete()
              .eq('id', leagueId);

            setSaving(false);

            if (leagueError) {
              Alert.alert('Feil', leagueError.message);
              return;
            }

            setManageOpen(false);
            navigation.goBack();
          },
        },
      ]
    );
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

  function renderUser({ item, index }: { item: UserScore; index: number }) {
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
          <Text style={styles.userMeta}>
            {item.favoriteTeam
              ? `${item.favoriteTeam}-fan`
              : item.user_id === ownerId
                ? 'Eier'
                : 'League member'}
          </Text>
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
          <Text style={styles.eyebrow}>Privat liga</Text>
          <Text style={styles.title}>{leagueTitle}</Text>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Laster liga...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.user_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>Privat liga</Text>
            <Text style={styles.title}>{leagueTitle}</Text>

            <View style={styles.heroCard}>
              <Text style={styles.heroIcon}>🏆</Text>

              <View style={styles.heroText}>
                <Text style={styles.heroTitle}>Privat toppliste</Text>
                <Text style={styles.heroSubtitle}>
                  Konkurrer med medlemmene i denne ligaen.
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>{leaderboard.length}</Text>
                <Text style={styles.countLabel}>medl.</Text>
              </View>
            </View>

            <View style={styles.codeCard}>
              <View>
                <Text style={styles.codeLabel}>Invite-kode</Text>
                <Text style={styles.codeValue}>{leagueJoinCode}</Text>
              </View>

              {isOwner && (
                <Pressable
                  style={styles.manageButton}
                  onPress={() => setManageOpen(true)}
                >
                  <Text style={styles.manageButtonText}>Endre liga</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.sectionTitle}>Rangering</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Ingen medlemmer enda</Text>
            <Text style={styles.emptyText}>
              Del invite-koden for å invitere venner til ligaen.
            </Text>
          </View>
        }
        renderItem={renderUser}
      />

      <Modal
        visible={manageOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setManageOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Eierverktøy</Text>
                <Text style={styles.modalTitle}>Endre liga</Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() => setManageOpen(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Liga-navn</Text>

            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Liga-navn"
              placeholderTextColor={colors.muted}
            />

            <Pressable
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={updateLeagueName}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>Lagre navn</Text>
            </Pressable>

            <Text style={styles.manageSectionTitle}>Medlemmer</Text>

            <FlatList
              data={leaderboard}
              keyExtractor={(item) => item.user_id}
              style={styles.memberList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.memberRow}>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.username}</Text>
                    <Text style={styles.memberMeta}>
                      {item.user_id === ownerId ? 'Eier' : 'Medlem'}
                    </Text>
                  </View>

                  {item.user_id !== ownerId && (
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => removeMember(item)}
                    >
                      <Text style={styles.removeButtonText}>Fjern</Text>
                    </Pressable>
                  )}
                </View>
              )}
            />

            <Pressable
              style={[styles.deleteButton, saving && styles.disabledButton]}
              onPress={deleteLeague}
              disabled={saving}
            >
              <Text style={styles.deleteButtonText}>Slett liga</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    marginBottom: 10,
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
  codeCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  manageButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  manageButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(90, 42, 64, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 18,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalEyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  label: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
    color: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 14,
  },
  manageSectionTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  memberList: {
    maxHeight: 230,
    marginBottom: 12,
  },
  memberRow: {
    backgroundColor: colors.softCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  memberMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  removeButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
  },
  deleteButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
  },
});