export type Prediction = "HOME" | "DRAW" | "AWAY";

export function getResult(homeGoals: number | null, awayGoals: number | null) {
  if (homeGoals === null || awayGoals === null) return null;

  if (homeGoals > awayGoals) return "HOME";
  if (homeGoals < awayGoals) return "AWAY";
  return "DRAW";
}

export function calculatePoints(prediction: Prediction, result: Prediction | null) {
  if (!result) return 0;
  return prediction === result ? 3 : 0;
}

export function isLocked(matchDate: string) {
  const matchTime = new Date(matchDate).getTime();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  return now >= matchTime - oneHour;
}