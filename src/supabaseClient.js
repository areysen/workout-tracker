import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yfnbnytutxdbmyvfsyba.supabase.co"; // paste your Project URL
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmbmJueXR1dHhkYm15dmZzeWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjAwNTksImV4cCI6MjA2MDQ5NjA1OX0.HJhDpx79rDzl5DZIh3qJZbBrSwudG95htPXOs2IGD30"; // paste your anon public key

export const supabase = createClient(supabaseUrl, supabaseKey);
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
