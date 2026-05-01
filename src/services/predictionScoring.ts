import { supabase } from '../lib/supabase';
import { fetchAllSeasonMatches } from './footballApi';
import {
  calculatePoints,
  getResult,
  Prediction,
} from '../utils/predictionUtils';

const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

type PredictionRow = {
  match_id: number;
  prediction: Prediction;
  points: number | null;
};

function isFinishedMatch(match: any) {
  const status = match.fixture?.status?.short;
  return FINISHED_STATUSES.includes(status);
}

function getMatchResult(match: any) {
  const homeGoals = match.goals?.home ?? null;
  const awayGoals = match.goals?.away ?? null;

  return getResult(homeGoals, awayGoals);
}

export async function updateUserPredictionPoints(userId: string) {
  try {
    const matches = await fetchAllSeasonMatches();
    return await updateFinishedMatchPointsForUser(userId, matches);
  } catch (error: any) {
    return { checked: 0, updated: 0 };
  }
}

export async function updateFinishedMatchPointsForUser(
  userId: string,
  matches: any[]
) {
  const finishedMatches = matches.filter(isFinishedMatch);

  if (finishedMatches.length === 0) {
    return { checked: 0, updated: 0 };
  }

  const matchById = new Map<number, any>();

  for (const match of finishedMatches) {
    const matchId = Number(match.fixture?.id);
    const result = getMatchResult(match);

    if (Number.isFinite(matchId) && result) {
      matchById.set(matchId, match);
    }
  }

  const matchIds = Array.from(matchById.keys());

  if (matchIds.length === 0) {
    return { checked: 0, updated: 0 };
  }

  const { data: predictionRows, error } = await supabase
    .from('predictions')
    .select('match_id, prediction, points')
    .eq('user_id', userId)
    .in('match_id', matchIds);

  if (error) {
    return { checked: 0, updated: 0 };
  }

  let updated = 0;

  for (const row of (predictionRows ?? []) as PredictionRow[]) {
    const match = matchById.get(Number(row.match_id));
    const result = match ? getMatchResult(match) : null;

    if (!result) continue;

    const newPoints = calculatePoints(row.prediction, result);

    if ((row.points ?? 0) === newPoints) continue;

    const { error: updateError } = await supabase
      .from('predictions')
      .update({ points: newPoints })
      .eq('user_id', userId)
      .eq('match_id', row.match_id);

    if (updateError) {
    } else {
      updated += 1;
    }
  }

  return { checked: predictionRows?.length ?? 0, updated };
}