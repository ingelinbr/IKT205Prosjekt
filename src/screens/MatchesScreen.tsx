import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { fetchMatches } from '../services/footballApi';
import { supabase } from '../lib/supabase';

type Prediction = 'HOME' | 'DRAW' | 'AWAY';

type PredictionRow = {
  match_id: number;
  prediction: Prediction;
  points?: number;
};

export default function MatchesScreen({ navigation }: any) {
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({});
  const [points, setPoints] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null);

  useEffect(() => {
    loadMatchesAndPredictions();
  }, []);

  async function loadMatchesAndPredictions() {
    setLoading(true);

    const data = await fetchMatches();
    setMatches(data);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.log('No logged in user:', userError?.message);
      setLoading(false);
      return;
    }

    const matchIds = data.map((match: any) => match.fixture.id);

    if (matchIds.length > 0) {
      const { data: predictionRows, error } = await supabase
        .from('predictions')
        .select('match_id, prediction, points')
        .eq('user_id', userData.user.id)
        .in('match_id', matchIds);

      if (error) {
        console.log('Error loading predictions:', error.message);
      } else if (predictionRows) {
        const predictionMap: Record<number, Prediction> = {};
        const pointsMap: Record<number, number> = {};

        predictionRows.forEach((row: PredictionRow) => {
          predictionMap[row.match_id] = row.prediction;
          pointsMap[row.match_id] = row.points ?? 0;
        });

        setPredictions(predictionMap);
        setPoints(pointsMap);
      }
    }

    setLoading(false);
  }

  function isLocked(match: any) {
    const matchTime = new Date(match.fixture.date).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    return now >= matchTime - oneHour;
  }

  function getResult(match: any): Prediction | null {
    const homeGoals = match.goals?.home;
    const awayGoals = match.goals?.away;

    if (homeGoals === null || awayGoals === null) return null;
    if (homeGoals === undefined || awayGoals === undefined) return null;

    if (homeGoals > awayGoals) return 'HOME';
    if (homeGoals < awayGoals) return 'AWAY';
    return 'DRAW';
  }

  function calculatePoints(prediction: Prediction, result: Prediction | null) {
    if (!result) return 0;
    return prediction === result ? 3 : 0;
  }

  async function choosePrediction(
    matchId: number,
    prediction: Prediction,
    match: any
  ) {
    if (isLocked(match)) {
      Alert.alert(
        'For sent',
        'Du kan ikke tippe mindre enn 1 time før kampstart.'
      );
      return;
    }

    const oldPrediction = predictions[matchId];
    const oldPoints = points[matchId];

    const result = getResult(match);
    const calculatedPoints = calculatePoints(prediction, result);

    setPredictions((prev) => ({
      ...prev,
      [matchId]: prediction,
    }));

    setPoints((prev) => ({
      ...prev,
      [matchId]: calculatedPoints,
    }));

    setSavingMatchId(matchId);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setPredictions((prev) => ({
        ...prev,
        [matchId]: oldPrediction,
      }));

      setPoints((prev) => ({
        ...prev,
        [matchId]: oldPoints ?? 0,
      }));

      setSavingMatchId(null);
      Alert.alert('Feil', 'Du må være logget inn for å lagre prediction.');
      return;
    }

    const { error } = await supabase.from('predictions').upsert(
      {
        user_id: userData.user.id,
        match_id: matchId,
        prediction,
        points: calculatedPoints,
      },
      {
        onConflict: 'user_id,match_id',
      }
    );

    setSavingMatchId(null);

    if (error) {
      setPredictions((prev) => ({
        ...prev,
        [matchId]: oldPrediction,
      }));

      setPoints((prev) => ({
        ...prev,
        [matchId]: oldPoints ?? 0,
      }));

      console.log('Error saving prediction:', error.message);
      Alert.alert('Feil', `Kunne ikke lagre prediction: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Kamper</Text>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Kamper</Text>

      <Pressable
        style={styles.navButton}
        onPress={() => navigation.navigate('PreviousMatches')}
      >
        <Text style={styles.navButtonText}>Se tidligere kamper</Text>
      </Pressable>

      <Pressable
        style={styles.navButton}
        onPress={() => navigation.navigate('AllMatches')}
      >
        <Text style={styles.navButtonText}>Se alle kamper</Text>
      </Pressable>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.fixture.id.toString()}
        renderItem={({ item }) => {
          const matchId = item.fixture.id;
          const selected = predictions[matchId];
          const isSaving = savingMatchId === matchId;
          const locked = isLocked(item);
          const result = getResult(item);
          const matchPoints = points[matchId] ?? 0;

          return (
            <View style={styles.card}>
              <Text style={styles.round}>{item.league.round}</Text>

              <Text style={styles.teams}>
                {item.teams.home.name} vs {item.teams.away.name}
              </Text>

              <Text style={styles.date}>
                {new Date(item.fixture.date).toLocaleString()}
              </Text>

              {locked && (
                <Text style={styles.lockedText}>
                  Låst: tipping stenger 1 time før kampstart
                </Text>
              )}

              <Text style={styles.score}>
                Resultat:{' '}
                {item.goals?.home === null || item.goals?.away === null
                  ? 'Ikke spilt'
                  : `${item.goals.home} - ${item.goals.away}`}
              </Text>

              <View style={styles.buttonRow}>
                <Pressable
                  style={[
                    styles.predictionButton,
                    selected === 'HOME' && styles.selectedButton,
                    (isSaving || locked) && styles.disabledButton,
                  ]}
                  disabled={isSaving || locked}
                  onPress={() => choosePrediction(matchId, 'HOME', item)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      selected === 'HOME' && styles.selectedText,
                    ]}
                  >
                    Hjemme
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.predictionButton,
                    selected === 'DRAW' && styles.selectedButton,
                    (isSaving || locked) && styles.disabledButton,
                  ]}
                  disabled={isSaving || locked}
                  onPress={() => choosePrediction(matchId, 'DRAW', item)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      selected === 'DRAW' && styles.selectedText,
                    ]}
                  >
                    Uavgjort
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.predictionButton,
                    selected === 'AWAY' && styles.selectedButton,
                    (isSaving || locked) && styles.disabledButton,
                  ]}
                  disabled={isSaving || locked}
                  onPress={() => choosePrediction(matchId, 'AWAY', item)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      selected === 'AWAY' && styles.selectedText,
                    ]}
                  >
                    Borte
                  </Text>
                </Pressable>
              </View>

              {selected && (
                <Text style={styles.selectedInfo}>
                  {isSaving
                    ? 'Lagrer...'
                    : `Ditt valg: ${selected} | Poeng: ${matchPoints}`}
                </Text>
              )}

              {result && (
                <Text style={styles.resultInfo}>Riktig resultat: {result}</Text>
              )}
            </View>
          );
        }}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5A2A40',
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#5A2A40',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#FFE4EC',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  round: {
    fontSize: 13,
    color: '#A06A85',
    marginBottom: 6,
  },
  teams: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5A2A40',
  },
  date: {
    marginTop: 6,
    color: '#A06A85',
  },
  lockedText: {
    marginTop: 8,
    color: '#B00020',
    fontWeight: 'bold',
  },
  score: {
    marginTop: 6,
    color: '#5A2A40',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  predictionButton: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8B7C8',
  },
  selectedButton: {
    backgroundColor: '#5A2A40',
    borderColor: '#5A2A40',
  },
  disabledButton: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#5A2A40',
    fontWeight: '600',
    fontSize: 13,
  },
  selectedText: {
    color: '#FFFFFF',
  },
  selectedInfo: {
    marginTop: 12,
    color: '#5A2A40',
    fontWeight: 'bold',
  },
  resultInfo: {
    marginTop: 6,
    color: '#A06A85',
    fontWeight: '600',
  },
});