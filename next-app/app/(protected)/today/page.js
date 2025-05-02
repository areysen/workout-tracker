"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import {
  fetchWorkoutLogs,
  fetchWorkoutLogsForLastNDays,
  computeCurrentStreak,
  computeBestStreak,
} from "@/lib/supabaseClient";
import { getToday, getWeekday, formatDateWithOptions } from "@/lib/utils";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastContext";

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
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState(undefined);
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showConfirmSkip, setShowConfirmSkip] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [profileData, setProfileData] = useState(null);

  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      console.log("Auth User ID:", user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setHasProfile(false);
      } else {
        setHasProfile(!!data);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (hasProfile) {
      supabase
        .from("profiles")
        .select("first_name, full_name")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => setProfileData(data))
        .catch(console.error);
    }
  }, [hasProfile, user]);

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
      const { supabase } = await import("@/lib/supabaseClient");
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

  if (hasProfile === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
        <div className="bg-[#343E44] p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            Let’s finish setting up your account
          </h2>
          <button
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-700 rounded-2xl text-white font-bold"
            onClick={() => router.push("/setup")}
          >
            Go to Setup
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#242B2F] p-4 max-w-3xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-1">
        👋 Welcome Back,{" "}
        {profileData?.first_name ||
          profileData?.full_name ||
          user?.user_metadata?.full_name ||
          user?.email ||
          "there"}
        !
      </h1>
      <p className="text-md text-gray-300 mb-6">📅 Today is {formattedDate}</p>

      {loading ? (
        <div className="bg-[#2E353A] p-6 rounded-2xl mb-8 border border-pink-400 flex justify-center items-center h-40 shadow-glow">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-400"></div>
        </div>
      ) : (
        todayLog && (
          <div className="bg-[#2E353A] p-6 rounded-2xl mb-8 border border-pink-400 shadow-glow hover:shadow-glow-hover transition duration-300 text-center">
            <h2 className="text-2xl font-extrabold mb-2 text-pink-400">
              {todayLog.skipped ? "🏖️ Recovery Day" : "🎯 Today's Mission"}
            </h2>
            <p className="text-lg mb-4 font-semibold">
              {todayLog.skipped
                ? `Workout Skipped: ${todayLog.muscle_group || "Workout"}`
                : todayLog.forecast
                ? `Planned Workout: ${todayLog.workout_name || "Workout"}`
                : `Completed Workout: ${todayLog.muscle_group || "Workout"}`}
            </p>
            <p className="text-sm text-gray-400 italic">
              {getRandomCoachBotTip(todayLog?.muscle_group)}
            </p>
          </div>
        )
      )}

      <div className="flex flex-col gap-4 mb-6">
        {todayLog?.skipped ? (
          <button
            disabled
            className="bg-[#4A5568] text-white py-3 px-6 rounded-2xl font-semibold shadow-glow hover:shadow-glow-hover transition duration-300 text-center"
          >
            Skipped
          </button>
        ) : todayLog?.forecast ? (
          <>
            <button
              className="bg-gradient-to-r from-pink-500 to-pink-700 text-white py-3 px-6 rounded-2xl font-bold text-lg shadow-glow hover:shadow-glow-hover transition duration-300"
              onClick={() =>
                router.push("/log", { state: { fromTodayView: true } })
              }
            >
              Start Workout
            </button>
            <button
              className="bg-gradient-to-r from-pink-600 to-red-600 text-white py-3 px-6 rounded-2xl font-bold text-lg shadow-glow hover:shadow-glow-hover transition duration-300"
              onClick={() => setShowConfirmSkip(true)}
            >
              Skip Today
            </button>
          </>
        ) : (
          <>
            <button
              className="bg-gradient-to-r from-pink-500 to-pink-700 text-white py-3 px-6 rounded-2xl font-bold text-lg shadow-glow hover:shadow-glow-hover transition duration-300"
              onClick={() =>
                router.push(`/summary/${today}`, {
                  state: { fromTodayView: true },
                })
              }
            >
              View Summary
            </button>
          </>
        )}
        <button
          className="flex items-center justify-center bg-gradient-to-r from-indigo-500 to-indigo-700 text-white py-3 px-6 rounded-2xl font-semibold shadow-glow hover:shadow-glow-hover transition duration-300"
          onClick={() => router.push("/calendar")}
        >
          📅 View Calendar
        </button>
      </div>

      <div className="bg-[#2E353A] p-6 rounded-2xl mb-6 border border-pink-400 shadow-glow hover:shadow-glow-hover transition duration-300 text-center">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-gray-700 rounded-2xl w-1/2 mx-auto" />
            <div className="h-4 bg-gray-700 rounded-2xl w-2/3 mx-auto" />
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-2 text-gray-300">
              📈 Your Progress
            </h2>
            <p className="text-gray-200">
              🔥 Current Streak:{" "}
              <span className="font-bold">{currentStreak} days</span>
            </p>
            {bestStreak > 0 && (
              <p className="text-gray-200 mt-1">
                🏆 Best Streak:{" "}
                <span className="font-bold">{bestStreak} days</span>
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-6 p-6 bg-[#2E353A] rounded-2xl border border-pink-400 shadow-glow hover:shadow-glow-hover transition duration-300 text-center">
        <h2 className="text-lg font-bold mb-2 text-pink-400">⚡ Shortcuts</h2>
        <div className="flex flex-col gap-3">
          <button
            className="flex items-center justify-center bg-gradient-to-r from-pink-500 to-pink-700 text-white py-3 px-6 rounded-2xl font-semibold shadow-glow hover:shadow-glow-hover transition duration-300"
            onClick={() => setShowBarcodeModal(true)}
          >
            <Image
              src="/assets/CrunchIcon.png"
              alt="Crunch"
              width={20}
              height={20}
              className="h-5 w-5 mr-2"
            />
            <span>Crunch Barcode</span>
          </button>
          <button
            onClick={() =>
              (window.location.href =
                "shortcuts://run-shortcut?name=Open%20MacroFactor")
            }
            className="flex items-center justify-center bg-gradient-to-r from-indigo-500 to-indigo-700 text-white py-3 px-6 rounded-2xl font-semibold shadow-glow hover:shadow-glow-hover transition duration-300"
          >
            <Image
              src="/assets/MacroFactorIcon.png"
              alt="MacroFactor"
              width={20}
              height={20}
              className="h-5 w-5 mr-2"
            />
            <span>Open MacroFactor</span>
          </button>
          <button
            className="bg-[#4A5568] text-white py-3 px-6 rounded-2xl font-semibold shadow-glow hover:shadow-glow-hover transition duration-300 text-center"
            onClick={() => router.push("/templates")}
          >
            🗂 Templates
          </button>
        </div>
      </div>

      <div className="mt-6 p-6 bg-[#2E353A] rounded-2xl border border-pink-400 shadow-glow hover:shadow-glow-hover transition duration-300 text-center">
        <h2 className="text-lg font-bold mb-2 text-pink-400">
          🤖 CoachBot Tip
        </h2>
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-700 rounded-2xl w-3/4" />
            <div className="h-4 bg-gray-700 rounded-2xl w-2/3" />
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
          const { supabase } = await import("@/lib/supabaseClient");
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
            router.replace("/mission-complete", {
              state: { type: "skipped" },
            });
          }
        }}
      />
      {showBarcodeModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
          onClick={() => setShowBarcodeModal(false)}
        >
          <div className="bg-white px-2 py-4 rounded-lg overflow-hidden w-[95vw] max-w-none">
            <Image
              src="/assets/CrunchBarcode.png"
              alt="Crunch Membership Barcode"
              width={800}
              height={400}
              className="w-full h-auto cursor-pointer"
              onClick={() => setShowBarcodeModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
