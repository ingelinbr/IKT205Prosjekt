import { useEffect, useState } from "react";
import {
  SafeAreaView,
  Text,
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { fetchMatches, fetchLiveMatches } from "../services/footballApi";
import { supabase } from "../lib/supabase";
import {
  calculatePoints,
  getResult,
  isLocked as isPredictionLocked,
  type Prediction,
} from "../utils/predictionUtils";

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadMatchesAndPredictions();

    const interval = setInterval(() => {
      refreshLiveMatches();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  function getMatchResult(match: any): Prediction | null {
    return getResult(match.goals?.home ?? null, match.goals?.away ?? null);
  }

  function isMatchLocked(match: any) {
    return isPredictionLocked(match.fixture.date);
  }

  function isLiveMatch(match: any) {
    const status = match.fixture?.status?.short;
    return ["1H", "2H", "HT", "2H", "ET", "BT", "P"].includes(status);
  }

  function hasMatchStarted(match: any) {
    const status = match.fixture?.status?.short;
    return status !== "NS" && status !== "TBD";
  }

  function isUpcomingOrLiveMatch(match: any) {
    const status = match.fixture?.status?.short;
    return ["NS", "TBD", "1H", "HT", "2H", "ET", "BT", "P"].includes(status);
  }

  function getScoreText(match: any) {
    const homeGoals = match.goals?.home;
    const awayGoals = match.goals?.away;

    if (homeGoals === null || awayGoals === null) {
      return "Ikke spilt";
    }

    return `${homeGoals} - ${awayGoals}`;
  }

  async function loadMatchesAndPredictions() {
    setLoading(true);

    const data = await fetchMatches();
    const visibleMatches = data.filter(isUpcomingOrLiveMatch);

    setMatches(visibleMatches);
    setLastUpdated(new Date());

    await loadPredictions(visibleMatches);

    setLoading(false);
  }

  async function loadPredictions(matchList: any[]) {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return;
    }

    const matchIds = matchList.map((match: any) => match.fixture.id);

    if (matchIds.length === 0) {
      return;
    }

    const { data: predictionRows, error } = await supabase
      .from("predictions")
      .select("match_id, prediction, points")
      .eq("user_id", userData.user.id)
      .in("match_id", matchIds);

    if (!error && predictionRows) {
      const predictionMap: Record<number, Prediction> = {};
      const pointsMap: Record<number, number> = {};

      for (const row of predictionRows as PredictionRow[]) {
        const matchId = Number(row.match_id);
        predictionMap[matchId] = row.prediction;
        pointsMap[matchId] = row.points ?? 0;
      }

      setPredictions(predictionMap);
      setPoints(pointsMap);
    }
  }

  async function refreshLiveMatches() {
    const liveMatches = await fetchLiveMatches();

    if (liveMatches.length === 0) {
      return;
    }

    setMatches((prevMatches) => {
      const matchMap = new Map<number, any>();

      for (const match of prevMatches) {
        matchMap.set(match.fixture.id, match);
      }

      for (const liveMatch of liveMatches) {
        matchMap.set(liveMatch.fixture.id, liveMatch);
      }

      return Array.from(matchMap.values()).filter(isUpcomingOrLiveMatch);
    });

    setLastUpdated(new Date());
  }

  async function choosePrediction(
    matchId: number,
    prediction: Prediction,
    match: any
  ) {
    if (hasMatchStarted(match)) {
      Alert.alert("For sent", "Du kan ikke tippe etter at kampen har startet.");
      return;
    }

    if (isMatchLocked(match)) {
      Alert.alert(
        "For sent",
        "Du kan ikke tippe mindre enn 1 time før kampstart."
      );
      return;
    }

    const oldPrediction = predictions[matchId];
    const oldPoints = points[matchId];

    setPredictions((prev) => ({
      ...prev,
      [matchId]: prediction,
    }));

    setPoints((prev) => ({
      ...prev,
      [matchId]: 0,
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
      Alert.alert("Feil", "Du må være logget inn for å lagre prediction.");
      return;
    }

    const result = getMatchResult(match);
    const calculatedPoints = calculatePoints(prediction, result);

    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: userData.user.id,
        match_id: matchId,
        prediction,
        points: calculatedPoints,
      },
      {
        onConflict: "user_id,match_id",
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

      Alert.alert("Feil", `Kunne ikke lagre prediction: ${error.message}`);
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

      {lastUpdated && (
        <Text style={styles.updatedText}>
          Sist oppdatert: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}

      <Pressable
        style={styles.navButton}
        onPress={() => navigation.navigate("PreviousMatches")}
      >
        <Text style={styles.navButtonText}>Se tidligere kamper</Text>
      </Pressable>

      <Pressable
        style={styles.navButton}
        onPress={() => navigation.navigate("AllMatches")}
      >
        <Text style={styles.navButtonText}>Se alle kamper</Text>
      </Pressable>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.fixture.id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Ingen kommende eller live kamper akkurat nå.
          </Text>
        }
        renderItem={({ item }) => {
          const matchId = item.fixture.id;
          const selected = predictions[matchId];
          const isSaving = savingMatchId === matchId;
          const locked = isMatchLocked(item);
          const started = hasMatchStarted(item);
          const matchPoints = points[matchId] ?? 0;

          return (
            <View style={styles.card}>
              <Text style={styles.round}>{item.league.round}</Text>

              {isLiveMatch(item) && <Text style={styles.liveText}>LIVE</Text>}

              <Text style={styles.teams}>
                {item.teams.home.name} vs {item.teams.away.name}
              </Text>

              <Text style={styles.date}>
                {new Date(item.fixture.date).toLocaleString()}
              </Text>

              <Text style={styles.score}>Resultat: {getScoreText(item)}</Text>

              <Text style={styles.statusText}>
                Status: {item.fixture?.status?.long ?? "Ukjent"}
              </Text>

              {locked && !started && (
                <Text style={styles.lockedText}>
                  Låst: tipping stenger 1 time før kampstart
                </Text>
              )}

              {started && (
                <Text style={styles.lockedText}>
                  Tipping er stengt fordi kampen har startet
                </Text>
              )}

              <View style={styles.buttonRow}>
                {(["HOME", "DRAW", "AWAY"] as Prediction[]).map((value) => (
                  <Pressable
                    key={value}
                    style={[
                      styles.predictionButton,
                      selected === value && styles.selectedButton,
                      (isSaving || locked || started) && styles.disabledButton,
                    ]}
                    disabled={isSaving || locked || started}
                    onPress={() => choosePrediction(matchId, value, item)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        selected === value && styles.selectedText,
                      ]}
                    >
                      {value === "HOME"
                        ? "Hjemme"
                        : value === "DRAW"
                        ? "Uavgjort"
                        : "Borte"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {selected && (
                <Text style={styles.selectedInfo}>
                  {isSaving
                    ? "Lagrer..."
                    : `Ditt valg: ${selected} | Poeng: ${matchPoints}`}
                </Text>
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
    backgroundColor: "#FFF0F5",
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#5A2A40",
    marginBottom: 6,
  },
  updatedText: {
    color: "#A06A85",
    marginBottom: 14,
    fontWeight: "600",
  },
  navButton: {
    backgroundColor: "#5A2A40",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  navButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  emptyText: {
    color: "#5A2A40",
    textAlign: "center",
    marginTop: 24,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFE4EC",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  round: {
    fontSize: 13,
    color: "#A06A85",
    marginBottom: 6,
  },
  liveText: {
    color: "#B00020",
    fontWeight: "bold",
    marginBottom: 6,
  },
  teams: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5A2A40",
  },
  date: {
    marginTop: 6,
    color: "#A06A85",
  },
  lockedText: {
    marginTop: 8,
    color: "#B00020",
    fontWeight: "bold",
  },
  score: {
    marginTop: 6,
    color: "#5A2A40",
    fontWeight: "600",
  },
  statusText: {
    marginTop: 4,
    color: "#A06A85",
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  predictionButton: {
    flex: 1,
    backgroundColor: "#FFF0F5",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8B7C8",
  },
  selectedButton: {
    backgroundColor: "#5A2A40",
    borderColor: "#5A2A40",
  },
  disabledButton: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#5A2A40",
    fontWeight: "600",
    fontSize: 13,
  },
  selectedText: {
    color: "#FFFFFF",
  },
  selectedInfo: {
    marginTop: 12,
    color: "#5A2A40",
    fontWeight: "bold",
  },
});