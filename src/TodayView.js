import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchWorkoutLogs,
  fetchWorkoutLogsForLastNDays,
  computeCurrentStreak,
  computeBestStreak,
} from "./supabaseClient";
import { getToday, getWeekday, formatDateWithOptions } from "./utils";
import ConfirmModal from "./components/ConfirmModal";
import { useToast } from "./components/ToastContext";
import CrunchBarcode from "./assets/CrunchBarcode.png";
import CrunchIcon from "./assets/CrunchIcon.png";
import MacroFactorIcon from "./assets/MacroFactorIcon.png";

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
  const [showConfirmSkip, setShowConfirmSkip] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const today = getToday();
  const formattedDate = formatDateWithOptions(today, { weekday: "long" });

  // Function to open MacroFactor app or fallback to App Store
  const openMacroFactor = () => {
    // Try to open the MacroFactor app; if it fails, redirect to App Store
    const fallback = setTimeout(() => {
      window.location.href =
        "https://apps.apple.com/us/app/macrofactor-macro-tracker/id1553503471";
    }, 700);
    window.location.href = "macrofactor://";
    // Optional: clear the fallback if the app opens (not always detectable in web)
  };

  // Load today's workout log or forecast
  const loadToday = async () => {
    setLoading(true);
    const logs = await fetchWorkoutLogs();
    let todayMatch = logs.find((log) => log.date === today);

    if (!todayMatch) {
      const localDate = new Date();
      const weekday = localDate
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();
      const { supabase } = await import("./supabaseClient");
      const { data: templates, error: tplError } = await supabase
        .from("workout_templates")
        .select("workout_name, exercises, muscle_group")
        .eq("day_of_week", weekday);

      if (!tplError && templates && templates.length > 0) {
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
  };

  useEffect(() => {
    loadToday();
  }, [today]);

  useEffect(() => {
    async function loadStreak() {
      const logs = await fetchWorkoutLogsForLastNDays(30);
      const streak = computeCurrentStreak(logs);
      setCurrentStreak(streak);
      // Fetch all logs and compute best streak
      const allLogs = await fetchWorkoutLogs();
      const best = computeBestStreak(allLogs);
      setBestStreak(best);
    }
    loadStreak();
  }, []);

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
              {todayLog.skipped ? "🏖️ Recovery Day" : "🎯 Mission of the Day"}
            </h2>
            <p className="text-lg">
              {todayLog.skipped
                ? `Workout Skipped: ${todayLog.muscle_group || "Workout"}`
                : todayLog.forecast
                ? `Planned Workout: ${todayLog.workout_name || "Workout"}`
                : `Completed Workout: ${todayLog.muscle_group || "Workout"}`}
            </p>
          </div>
        )
      )}

      <div className="flex flex-col gap-4 mb-6">
        {todayLog?.skipped ? (
          <button
            disabled
            className="bg-gray-600 text-white py-3 px-6 rounded font-bold text-lg cursor-not-allowed text-center"
          >
            Skipped
          </button>
        ) : todayLog?.forecast ? (
          <>
            <button
              className="bg-gradient-to-r from-pink-500 to-pink-700 text-white py-3 px-6 rounded font-bold text-lg hover:opacity-90 transition"
              onClick={() =>
                navigate("/log", { state: { fromTodayView: true } })
              }
            >
              Start Workout
            </button>
            <button
              className="bg-gradient-to-r from-pink-600 to-red-600 text-white py-3 px-6 rounded font-bold text-lg hover:opacity-90 transition"
              onClick={() => setShowConfirmSkip(true)}
            >
              Skip Day
            </button>
          </>
        ) : (
          <>
            <button
              className="bg-gradient-to-r from-pink-500 to-pink-700 text-white py-3 px-6 rounded font-bold text-lg hover:opacity-90 transition"
              onClick={() =>
                navigate(`/summary/${today}`, {
                  state: { fromTodayView: true },
                })
              }
            >
              View Summary
            </button>
          </>
        )}
        <button
          className="bg-[#343E44] text-white py-2 px-4 rounded font-semibold hover:bg-gray-700 transition"
          onClick={() => navigate("/calendar")}
        >
          📅 View Calendar
        </button>
      </div>

      <div className="bg-[#2E353A] p-4 rounded-lg mb-6 border border-gray-600">
        <h2 className="text-lg font-semibold mb-2 text-gray-300">
          📈 Your Progress
        </h2>
        <p className="text-gray-200">
          🔥 Current Streak:{" "}
          <span className="font-bold">{currentStreak} days</span>
        </p>
        {bestStreak > 0 && (
          <p className="text-gray-200 mt-1">
            🏆 Best Streak: <span className="font-bold">{bestStreak} days</span>
          </p>
        )}
      </div>

      <div className="mt-6 p-4 bg-[#2E353A] rounded-lg border border-[#C63663]">
        <h2 className="text-lg font-bold mb-2 text-pink-400">⚡ Shortcuts</h2>
        <div className="flex flex-col gap-3">
          <button
            className="flex items-center justify-center bg-gradient-to-r from-pink-500 to-pink-700 text-white py-2 px-4 rounded font-semibold hover:opacity-90 transition"
            onClick={() => setShowBarcodeModal(true)}
          >
            <img src={CrunchIcon} alt="Crunch" className="h-5 w-5 mr-2" />
            <span>Crunch Barcode</span>
          </button>
          <button
            onClick={() =>
              (window.location.href =
                "shortcuts://run-shortcut?name=Open%20MacroFactor")
            }
            className="flex items-center justify-center bg-[#343E44] text-white py-2 px-4 rounded font-semibold hover:bg-gray-700 transition"
          >
            <img
              src={MacroFactorIcon}
              alt="MacroFactor"
              className="h-5 w-5 mr-2"
            />
            <span>Open MacroFactor</span>
          </button>
          <button
            onClick={() => navigate("/templates")}
            className="bg-[#4A5568] text-white py-2 px-4 rounded font-semibold hover:bg-gray-700 transition text-center"
          >
            🗂 Templates
          </button>
        </div>
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

      <ConfirmModal
        isOpen={showConfirmSkip}
        message="Are you sure you want to skip today's workout?"
        onCancel={() => setShowConfirmSkip(false)}
        onConfirm={async () => {
          setShowConfirmSkip(false);
          const { supabase } = await import("./supabaseClient");
          const { error } = await supabase.from("workout_logs").insert([
            {
              date: today,
              forecast: false,
              skipped: true,
              muscle_group: todayLog?.workout_name || "",
              day: getWeekday(today),
            },
          ]);

          if (error) {
            console.error("Error skipping workout:", error);
            showToast("Failed to skip workout. Please try again.", "error");
          } else {
            showToast("Workout skipped!", "error");
            const logs = await fetchWorkoutLogs();
            let todayMatch = logs.find((log) => log.date === today);
            setTodayLog(todayMatch || null);
          }
        }}
      />
      {showBarcodeModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
          onClick={() => setShowBarcodeModal(false)}
        >
          <div className="bg-white px-2 py-4 rounded-lg overflow-hidden w-[95vw] max-w-none">
            <img
              src={CrunchBarcode}
              alt="Crunch Membership Barcode"
              className="w-full h-auto cursor-pointer"
              onClick={() => setShowBarcodeModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
