import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  SafeAreaView,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

type League = {
  id: string;
  name: string;
  join_code: string;
  owner_id: string;
};

export default function LeaguesScreen({ navigation }: any) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);

useFocusEffect(
  useCallback(() => {
    loadMyLeagues();
  }, [])
);

  function generateJoinCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function ensureProfileExists(user: any) {
    const fallbackUsername =
      user.user_metadata?.username || user.email?.split('@')[0] || 'Bruker';

    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, favorite_team')
      .eq('id', user.id)
      .maybeSingle();

    if (checkError) {
      console.log('Error checking profile:', checkError.message);
      return null;
    }

    if (!existingProfile) {
      const { data: createdProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: fallbackUsername,
          favorite_team: null,
        })
        .select('favorite_team')
        .single();

      if (insertError) {
        console.log('Error creating profile:', insertError.message);
        return null;
      }

      return createdProfile?.favorite_team ?? null;
    }

    return existingProfile.favorite_team ?? null;
  }

  async function loadMyLeagues() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setLoading(false);
      return;
    }

    const userFavoriteTeam = await ensureProfileExists(userData.user);
    setFavoriteTeam(userFavoriteTeam);

    const { data: memberships, error } = await supabase
      .from('league_members')
      .select('leagues(id, name, join_code, owner_id)')
      .eq('user_id', userData.user.id);

    if (error) {
      console.log('Error loading leagues:', error.message);
      setLoading(false);
      return;
    }

    const loadedLeagues =
      memberships?.map((m: any) => m.leagues).filter(Boolean) ?? [];

    setLeagues(loadedLeagues);
    setLoading(false);
  }

  async function createLeague() {
    const name = leagueName.trim();

    if (!name) {
      Alert.alert('Feil', 'Skriv inn navn på liga.');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      Alert.alert('Feil', 'Du må være logget inn.');
      return;
    }

    const code = generateJoinCode();

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name,
        join_code: code,
        owner_id: userData.user.id,
      })
      .select()
      .single();

    if (leagueError) {
      console.log('Error creating league:', leagueError.message);
      Alert.alert('Feil', leagueError.message);
      return;
    }

    const { error: memberError } = await supabase
      .from('league_members')
      .insert({
        league_id: league.id,
        user_id: userData.user.id,
      });

    if (memberError) {
      console.log('Error joining own league:', memberError.message);
      Alert.alert('Feil', memberError.message);
      return;
    }

    setLeagueName('');
    Alert.alert('Liga opprettet', `Invite-kode: ${code}`);
    loadMyLeagues();
  }

  async function joinLeague() {
    const code = joinCode.trim().toUpperCase();

    if (!code) {
      Alert.alert('Feil', 'Skriv inn invite-kode.');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      Alert.alert('Feil', 'Du må være logget inn.');
      return;
    }

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('join_code', code)
      .single();

    if (leagueError || !league) {
      Alert.alert('Feil', 'Fant ingen liga med den koden.');
      return;
    }

    const { error: memberError } = await supabase
      .from('league_members')
      .insert({
        league_id: league.id,
        user_id: userData.user.id,
      });

    if (memberError) {
      Alert.alert('Feil', 'Du er kanskje allerede medlem av denne ligaen.');
      return;
    }

    setJoinCode('');
    Alert.alert('Du er med!', `Du ble med i ${league.name}`);
    loadMyLeagues();
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContent}>
          <Text style={styles.eyebrow}>Ligaer</Text>
          <Text style={styles.title}>Ligaer</Text>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Laster ligaer...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={leagues}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>Ligaer</Text>
            <Text style={styles.title}>Ligaer & topplister</Text>
            <Text style={styles.subtitle}>
              Følg global toppliste og konkurrer med venner.
            </Text>

            <View style={styles.sectionBlock}>
              <View style={styles.sectionRow}>
                <View style={styles.sectionTextWrap}>
                  <Text style={styles.sectionTitle}>Global liga</Text>
                  <Text style={styles.sectionSubtitle}>
                    Alle spillere i én felles toppliste
                  </Text>
                </View>

                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>1</Text>
                </View>
              </View>

              <Pressable
                style={[styles.leagueRow, styles.globalRow]}
                onPress={() => navigation.getParent()?.navigate('Leaderboard')}
              >
                <View style={styles.globalLeagueIcon}>
                  <Text style={styles.leagueIconText}>🌍</Text>
                </View>

                <View style={styles.leagueInfo}>
                  <Text style={styles.leagueName}>Global toppliste</Text>
                  <Text style={styles.leagueMeta}>Alle spillere</Text>
                </View>

                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>Global</Text>
                </View>

                <Text style={styles.rowChevron}>›</Text>
              </Pressable>
            </View>

            {favoriteTeam && (
              <>
                <View style={styles.sectionDivider} />

                <View style={styles.sectionBlock}>
                  <View style={styles.sectionRow}>
                    <View style={styles.sectionTextWrap}>
                      <Text style={styles.sectionTitle}>Favorittlag-liga</Text>
                      <Text style={styles.sectionSubtitle}>
                        Din liga for {favoriteTeam}-fans
                      </Text>
                    </View>

                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>1</Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.leagueRow}
                    onPress={() =>
                      navigation.getParent()?.navigate('TeamLeague', {
                        teamName: favoriteTeam,
                      })
                    }
                  >
                    <View style={styles.teamLeagueIcon}>
                      <Text style={styles.leagueIconText}>⭐</Text>
                    </View>

                    <View style={styles.leagueInfo}>
                      <Text style={styles.leagueName}>{favoriteTeam}-liga</Text>
                      <Text style={styles.leagueMeta}>
                        Alle som heier på {favoriteTeam}
                      </Text>
                    </View>

                    <View style={styles.typeBadgeLight}>
                      <Text style={styles.typeBadgeLightText}>Lag</Text>
                    </View>

                    <Text style={styles.rowChevron}>›</Text>
                  </Pressable>
                </View>
              </>
            )}

            <View style={styles.sectionDivider} />

            <View style={styles.sectionBlock}>
              <View style={styles.sectionRow}>
                <View style={styles.sectionTextWrap}>
                  <Text style={styles.sectionTitle}>Private ligaer</Text>
                  <Text style={styles.sectionSubtitle}>
                    Ligaer du er medlem av
                  </Text>
                </View>

                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{leagues.length}</Text>
                </View>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>Ingen private ligaer enda</Text>
            <Text style={styles.emptyText}>
              Global liga er alltid tilgjengelig. Opprett eller bli med i en
              privat liga for å konkurrere med venner.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.leagueRow}
            onPress={() =>
              navigation.navigate('LeagueDetail', {
                leagueId: item.id,
                leagueName: item.name,
                joinCode: item.join_code,
              })
            }
          >
            <View style={styles.privateLeagueIcon}>
              <Text style={styles.leagueIconText}>⚽</Text>
            </View>

            <View style={styles.leagueInfo}>
              <Text style={styles.leagueName}>{item.name}</Text>
              <Text style={styles.leagueMeta}>Kode: {item.join_code}</Text>
            </View>

            <View style={styles.typeBadgeLight}>
              <Text style={styles.typeBadgeLightText}>Privat</Text>
            </View>

            <Text style={styles.rowChevron}>›</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.sectionDivider} />

            <Text style={styles.sectionTitle}>Administrer ligaer</Text>
            <Text style={styles.sectionSubtitle}>
              Opprett eller bli med med invite-kode
            </Text>

            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Opprett liga</Text>

              <TextInput
                style={styles.input}
                placeholder="Navn på liga"
                placeholderTextColor={colors.muted}
                value={leagueName}
                onChangeText={setLeagueName}
              />

              <Pressable style={styles.smallButton} onPress={createLeague}>
                <Text style={styles.smallButtonText}>Opprett</Text>
              </Pressable>
            </View>

            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Bli med i liga</Text>

              <TextInput
                style={styles.input}
                placeholder="Invite-kode"
                placeholderTextColor={colors.muted}
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
              />

              <Pressable style={styles.smallButton} onPress={joinLeague}>
                <Text style={styles.smallButtonText}>Bli med</Text>
              </Pressable>
            </View>
          </View>
        }
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
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 18,
  },
  loadingText: {
    color: colors.muted,
    marginTop: 12,
    fontWeight: '600',
  },
  sectionBlock: {
    marginBottom: 8,
  },
  sectionRow: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 16,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 4,
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  leagueRow: {
    backgroundColor: colors.softCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  globalRow: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderWidth: 1.3,
  },
  globalLeagueIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  privateLeagueIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teamLeagueIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leagueIconText: {
    fontSize: 18,
  },
  leagueInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  leagueMeta: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
  },
  typeBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  typeBadgeLight: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 6,
  },
  typeBadgeLightText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  rowChevron: {
    fontSize: 24,
    color: colors.muted,
    marginLeft: 6,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  emptyEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: 6,
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
    color: colors.primary,
  },
  smallButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    minWidth: 96,
    alignItems: 'center',
  },
  smallButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});