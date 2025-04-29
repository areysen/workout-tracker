import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
export const fetchWorkoutLogs = async () => {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching workout logs:", error.message);
    return [];
  }

  return data;
};

/**
 * Fetch the most recent N workout logs (skipped or completed),
 * ordered descending by date.
 */
export const fetchWorkoutLogsForLastNDays = async (n = 30) => {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("date, skipped")
    .order("date", { ascending: false })
    .limit(n);

  if (error) {
    console.error(
      "Error fetching workout logs for last N days:",
      error.message
    );
    return [];
  }
  return data;
};

/**
 * Compute the current streak of non-skipped workouts from
 * a descending-ordered array of logs.
 */
export const computeCurrentStreak = (logs) => {
  let streak = 0;
  for (const log of logs) {
    if (log.skipped) break;
    streak++;
  }
  return streak;
};

/**
 * Compute the best (longest) streak of non-skipped workouts from
 * an array of logs ordered by date.
 */
export const computeBestStreak = (logs) => {
  let best = 0;
  let current = 0;
  for (const log of logs) {
    if (!log.skipped) {
      current++;
    } else {
      if (current > best) best = current;
      current = 0;
    }
  }
  if (current > best) best = current;
  return best;
};
