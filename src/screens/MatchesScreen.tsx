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
import { fetchMatches } from "../services/footballApi";
import { supabase } from "../lib/supabase";

type Prediction = "HOME" | "DRAW" | "AWAY";

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

  function getResult(match: any): Prediction | null {
    const homeGoals = match.goals?.home;
    const awayGoals = match.goals?.away;

    if (homeGoals === null || awayGoals === null) return null;
    if (homeGoals === undefined || awayGoals === undefined) return null;

    if (homeGoals > awayGoals) return "HOME";
    if (homeGoals < awayGoals) return "AWAY";
    return "DRAW";
  }

  function calculatePoints(prediction: Prediction, result: Prediction | null) {
    if (!result) return 0;
    return prediction === result ? 3 : 0;
  }

  function isPredictableMatch(match: any) {
    const status = match.fixture?.status?.short;
    const result = getResult(match);

    return !result && (status === "NS" || status === "TBD");
  }

  async function updateFinishedMatchPoints(
    userId: string,
    matchId: number,
    prediction: Prediction,
    match: any
  ) {
    const result = getResult(match);
    if (!result) return 0;

    const calculatedPoints = calculatePoints(prediction, result);

    const { error } = await supabase
      .from("predictions")
      .update({ points: calculatedPoints })
      .eq("user_id", userId)
      .eq("match_id", matchId);

    if (error) {
      console.log("Error updating points:", error.message);
    }

    return calculatedPoints;
  }

  async function loadMatchesAndPredictions() {
    setLoading(true);

    const data = await fetchMatches();

    console.log("MATCHES FROM fetchMatches:", data.length);
    console.log(
      "STATUSES:",
      data.map((m: any) => m.fixture?.status?.short)
    );

    const upcomingMatches = data.filter(isPredictableMatch);
    setMatches(upcomingMatches);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.log("No logged in user:", userError?.message);
      setLoading(false);
      return;
    }

    const matchIds = upcomingMatches.map((match: any) => match.fixture.id);

    if (matchIds.length > 0) {
      const { data: predictionRows, error } = await supabase
        .from("predictions")
        .select("match_id, prediction, points")
        .eq("user_id", userData.user.id)
        .in("match_id", matchIds);

      if (error) {
        console.log("Error loading predictions:", error.message);
      } else if (predictionRows) {
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

    setLoading(false);
  }

  function isLocked(match: any) {
    const matchTime = new Date(match.fixture.date).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    return now >= matchTime - oneHour;
  }

  function getPredictionLabel(prediction: Prediction) {
    if (prediction === "HOME") return "Hjemmeseier";
    if (prediction === "DRAW") return "Uavgjort";
    return "Borteseier";
  }

  async function choosePrediction(
    matchId: number,
    prediction: Prediction,
    match: any
  ) {
    if (isLocked(match)) {
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

    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: userData.user.id,
        match_id: matchId,
        prediction,
        points: 0,
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

      console.log("Error saving prediction:", error.message);
      Alert.alert("Feil", `Kunne ikke lagre prediction: ${error.message}`);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContent}>
          <Text style={styles.eyebrow}>Kamper</Text>
          <Text style={styles.title}>Tipp kamper</Text>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Laster kommende kamper...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.fixture.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>Kamper</Text>
            <Text style={styles.title}>Tipp kamper</Text>
            <Text style={styles.subtitle}>
              Velg hvem du tror vinner. Riktig prediksjon gir 3 poeng.
            </Text>

            <View style={styles.navCard}>
              <Text style={styles.cardTitle}>Utforsk kamper</Text>

              <Pressable
                style={styles.primaryButton}
                onPress={() => navigation.navigate("PreviousMatches")}
              >
                <Text style={styles.primaryButtonText}>
                  Se tidligere kamper
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => navigation.navigate("AllMatches")}
              >
                <Text style={styles.secondaryButtonText}>Se alle kamper</Text>
              </Pressable>
            </View>

            {matches.length > 0 && (
              <Text style={styles.sectionTitle}>Kommende kamper</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>⚽</Text>
            <Text style={styles.emptyTitle}>Ingen kamper å tippe på nå</Text>
            <Text style={styles.emptyText}>
              Kom tilbake senere for å predikere kommende Premier
              League-kamper.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const matchId = item.fixture.id;
          const selected = predictions[matchId];
          const isSaving = savingMatchId === matchId;
          const locked = isLocked(item);
          const matchPoints = points[matchId] ?? 0;

          return (
            <View style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.round}>{item.league.round}</Text>

                {locked ? (
                  <View style={styles.lockedBadge}>
                    <Text style={styles.lockedBadgeText}>Låst</Text>
                  </View>
                ) : (
                  <View style={styles.openBadge}>
                    <Text style={styles.openBadgeText}>Åpen for tipping</Text>
                  </View>
                )}
              </View>

              <View style={styles.teamsBlock}>
                <Text style={styles.teamName}>{item.teams.home.name}</Text>
                <Text style={styles.vsText}>mot</Text>
                <Text style={styles.teamName}>{item.teams.away.name}</Text>
              </View>

              <Text style={styles.date}>
                {new Date(item.fixture.date).toLocaleString()}
              </Text>

              {locked && (
                <Text style={styles.lockedText}>
                  Tipping stenger 1 time før kampstart.
                </Text>
              )}

              <Text style={styles.predictLabel}>Din prediksjon</Text>

              <View style={styles.buttonRow}>
                <Pressable
                  style={[
                    styles.predictionButton,
                    selected === "HOME" && styles.selectedButton,
                    (isSaving || locked) && styles.disabledButton,
                  ]}
                  disabled={isSaving || locked}
                  onPress={() => choosePrediction(matchId, "HOME", item)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      selected === "HOME" && styles.selectedText,
                    ]}
                  >
                    Hjemme
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.predictionButton,
                    selected === "DRAW" && styles.selectedButton,
                    (isSaving || locked) && styles.disabledButton,
                  ]}
                  disabled={isSaving || locked}
                  onPress={() => choosePrediction(matchId, "DRAW", item)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      selected === "DRAW" && styles.selectedText,
                    ]}
                  >
                    Uavgjort
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.predictionButton,
                    selected === "AWAY" && styles.selectedButton,
                    (isSaving || locked) && styles.disabledButton,
                  ]}
                  disabled={isSaving || locked}
                  onPress={() => choosePrediction(matchId, "AWAY", item)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      selected === "AWAY" && styles.selectedText,
                    ]}
                  >
                    Borte
                  </Text>
                </Pressable>
              </View>

              {selected && (
                <View style={styles.selectedInfoBox}>
                  <Text style={styles.selectedInfo}>
                    {isSaving
                      ? "Lagrer prediksjon..."
                      : `Ditt valg: ${getPredictionLabel(selected)}`}
                  </Text>

                  {!isSaving && (
                    <Text style={styles.pointsText}>
                      Nåværende poeng: {matchPoints}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const colors = {
  background: "#FFF0F5",
  card: "#FFE4EC",
  primary: "#5A2A40",
  muted: "#A06A85",
  border: "#F3BDD1",
  white: "#FFFFFF",
  danger: "#B00020",
  successBg: "#F7DCE8",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },
  loadingContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 22,
  },
  loadingText: {
    color: colors.muted,
    marginTop: 14,
    fontWeight: "600",
  },
  navCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 22,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 21,
  },
  matchCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  round: {
    flex: 1,
    fontSize: 13,
    color: colors.muted,
    fontWeight: "700",
  },
  openBadge: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  openBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  lockedBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  lockedBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  teamsBlock: {
    marginBottom: 10,
  },
  teamName: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
    lineHeight: 28,
  },
  vsText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "700",
    marginVertical: 2,
  },
  date: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  lockedText: {
    marginTop: 2,
    marginBottom: 8,
    color: colors.danger,
    fontWeight: "700",
    fontSize: 13,
  },
  predictLabel: {
    marginTop: 8,
    marginBottom: 10,
    color: colors.primary,
    fontWeight: "800",
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  predictionButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.45,
  },
  buttonText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },
  selectedText: {
    color: colors.white,
  },
  selectedInfoBox: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedInfo: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 14,
  },
  pointsText: {
    color: colors.muted,
    fontWeight: "600",
    marginTop: 4,
    fontSize: 13,
  },
});