import { useEffect, useState } from 'react';
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

export default function LeaguesScreen({ navigation }: any) {  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyLeagues();
  }, []);

  function generateJoinCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function loadMyLeagues() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setLoading(false);
      return;
    }

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
    Alert.alert('Liga opprettet', `Kode: ${code}`);
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
        <Text style={styles.title}>Ligaer</Text>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Ligaer</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Opprett liga</Text>

        <TextInput
          style={styles.input}
          placeholder="Navn på liga"
          placeholderTextColor="#A06A85"
          value={leagueName}
          onChangeText={setLeagueName}
        />

        <Pressable style={styles.button} onPress={createLeague}>
          <Text style={styles.buttonText}>Opprett liga</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bli med i liga</Text>

        <TextInput
          style={styles.input}
          placeholder="Invite-kode"
          placeholderTextColor="#A06A85"
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="characters"
        />

        <Pressable style={styles.button} onPress={joinLeague}>
          <Text style={styles.buttonText}>Bli med</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Mine ligaer</Text>

      <FlatList
        data={leagues}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Du er ikke med i noen ligaer enda.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.leagueCard}
            onPress={() =>
              navigation.navigate('LeagueDetail', {
                leagueId: item.id,
                leagueName: item.name,
                joinCode: item.join_code,
          })
    }
  >
    <Text style={styles.leagueName}>{item.name}</Text>
    <Text style={styles.code}>Kode: {item.join_code}</Text>
    <Text style={styles.openText}>Trykk for leaderboard</Text>
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8B7C8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5A2A40',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F8C8DC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#5A2A40',
  },
  button: {
    backgroundColor: '#5A2A40',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  leagueCard: {
    backgroundColor: '#FFE4EC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  leagueName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#5A2A40',
  },
  code: {
    marginTop: 6,
    color: '#A06A85',
    fontWeight: '600',
  },
  empty: {
    color: '#5A2A40',
    fontSize: 15,
  },
  openText: {
  marginTop: 8,
  color: '#5A2A40',
  fontWeight: 'bold',
},
});