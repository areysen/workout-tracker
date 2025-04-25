import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWorkoutLogs } from "./supabaseClient";
import { getToday, formatDateWithOptions } from "./utils";

// --- CoachBot Tips utility ---
const coachBotTips = {
  chest: [
    "Drive through your chest, not your shoulders! 🏋️‍♂️",
    "Control the negative for more gains! 💥",
    "Keep your shoulder blades tucked for max power! 🔥",
  ],
  back: [
    "Pull with your elbows, not your hands! 💪",
    "Squeeze your back at the top of every rep! 🚀",
    "Focus on mind-muscle connection! 🎯",
  ],
  legs: [
    "Push through your heels for more power! 🦵",
    "Brace your core before every squat! 🛡️",
    "Own the bottom of every rep! 🧱",
  ],
  arms: [
    "Slow controlled curls > heavy swinging! 🏋️",
    "Stretch and squeeze on every rep! 🎯",
    "Lock in your elbows when curling! 💪",
  ],
  shoulders: [
    "Press overhead with control, not momentum! 🏋️‍♀️",
    "Lead lateral raises with your elbows! 🔥",
    "Stabilize your core during all pressing! 🛡️",
  ],
  core: [
    "Control the motion, don't rush it! 🧘‍♂️",
    "Exhale hard at the top of every crunch! 🌬️",
    "Focus on tension, not speed! ⚡",
  ],
  conditioning: [
    "Stay light on your feet! 🏃‍♂️",
    "Pace yourself — fast start means fast burnout! 🥵",
    "Breathe through your nose to stay calm! 😤",
  ],
  default: [
    "Attack today like a champion! 💥",
    "Every rep counts! Make them perfect! 🎯",
    "You vs. You — Win today! 🏆",
  ],
};

function getRandomCoachBotTip(muscleGroup = "") {
  const key = muscleGroup?.toLowerCase?.() || "";
  const tips = coachBotTips[key] || coachBotTips.default;
  return tips[Math.floor(Math.random() * tips.length)];
}

export default function TodayView() {
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();

  const today = getToday();
  const formattedDate = formatDateWithOptions(today, { weekday: "long" });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const logs = await fetchWorkoutLogs();
      let todayMatch = logs.find((log) => log.date === today);

      if (!todayMatch) {
        // No log found, fetch from workout_templates
        const localDate = new Date();
        const weekday = localDate
          .toLocaleDateString("en-US", { weekday: "long" })
          .toLowerCase();
        // Import supabase directly here
        const { supabase } = await import("./supabaseClient");
        const { data: templates, error } = await supabase
          .from("workout_templates")
          .select("workout_name, exercises, muscle_group")
          .eq("day_of_week", weekday);

        if (templates && templates.length > 0) {
          todayMatch = {
            date: today,
            forecast: true,
            muscle_group: templates[0].muscle_group,
            workout_name: templates[0].workout_name,
          };
        }
      }

      setTodayLog(todayMatch || null);
      setLoading(false);
    }
    load();
  }, [today]);

  return (
    <div className="min-h-screen bg-[#242B2F] p-4 max-w-3xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-1">👋 Welcome Back, Andrew!</h1>
      <p className="text-md text-gray-300 mb-6">📅 Today is {formattedDate}</p>

      {loading ? (
        <div className="bg-[#2E353A] p-4 rounded-lg mb-6 border border-[#C63663] flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
        </div>
      ) : (
        todayLog && (
          <div className="bg-[#2E353A] p-4 rounded-lg mb-6 border border-[#C63663]">
            <h2 className="text-xl font-bold mb-2 text-pink-400">
              🎯 Mission of the Day
            </h2>
            <p className="text-lg">
              {todayLog.skipped
                ? `Workout Skipped: ${todayLog.workout_name || "Workout"}`
                : todayLog.forecast
                ? `Planned Workout: ${todayLog.workout_name || "Workout"}`
                : `Completed Workout: ${todayLog.workout_name || "Workout"}`}
            </p>
          </div>
        )
      )}

      <div className="flex flex-col gap-4 mb-6">
        <button
          className="bg-gradient-to-r from-pink-500 to-pink-700 text-white py-3 px-6 rounded font-bold text-lg hover:opacity-90 transition"
          onClick={() =>
            navigate(
              todayLog?.skipped
                ? `/summary/${today}`
                : todayLog?.forecast
                ? `/log/${today}`
                : `/summary/${today}`,
              { state: { fromTodayView: true } }
            )
          }
        >
          {todayLog?.skipped
            ? "View Summary"
            : todayLog?.forecast
            ? "Start Workout"
            : "View Summary"}
        </button>
        <button
          className="bg-[#343E44] text-white py-2 px-4 rounded font-semibold hover:bg-gray-700 transition"
          onClick={() => navigate("/calendar")}
        >
          📅 View Calendar
        </button>
      </div>

      <div className="bg-[#2E353A] p-4 rounded-lg mb-6 border border-gray-600">
        <h2 className="text-lg font-semibold mb-2 text-gray-300">
          🔥 Your Progress
        </h2>
        <p className="text-gray-400 text-sm">
          ✅ Stay consistent and build your streak!
        </p>
      </div>

      <div className="mt-6 p-4 bg-[#2E353A] rounded-lg border border-[#C63663]">
        <h2 className="text-lg font-bold mb-2 text-pink-400">
          🤖 CoachBot Tip
        </h2>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-700 rounded w-2/3" />
          </div>
        ) : (
          <p className="text-sm text-gray-300">
            {getRandomCoachBotTip(todayLog?.muscle_group)}
          </p>
        )}
      </div>
    </div>
  );
}
