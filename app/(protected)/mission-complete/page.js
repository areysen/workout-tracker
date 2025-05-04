"use client";
export const dynamic = "force-dynamic";
import { Suspense, useState, useEffect } from "react";
import SearchParamHandler from "@/components/SearchParamHandler";
import { useRouter } from "next/navigation";
import {
  fetchWorkoutLogsForLastNDays,
  computeCurrentStreak,
} from "@/lib/supabaseClient";
import Confetti from "react-confetti";
function useWindowSize() {
  const [size, setSize] = useState([0, 0]);

  useEffect(() => {
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight]);
    };

    handleResize(); // Set size on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}
const motivationalMessages = [
  "Every rep counts. Keep showing up! 💪",
  "Consistency beats perfection. Stay strong! 🚀",
  "Small steps every day = big results. 🌟",
  "You're closer than you think. Keep pushing! 🔥",
  "Today’s effort builds tomorrow’s strength! 🏆",
  "Believe in your momentum! 🎯",
];
export default function MissionCompleteView() {
  const router = useRouter();
  const [type, setType] = useState("completed");
  const isCompleted = type === "completed";
  const [motivation, setMotivation] = useState("");

  const [showConfetti, setShowConfetti] = useState(isCompleted);
  const [confettiPieces, setConfettiPieces] = useState(isCompleted ? 500 : 0);
  const [width, height] = useWindowSize(); // ✅ Use responsive window size

  useEffect(() => {
    if (showConfetti) {
      const delayBeforeFade = setTimeout(() => {
        const interval = setInterval(() => {
          setConfettiPieces((prev) => {
            if (prev > 0) return prev - 5;
            clearInterval(interval);
            setShowConfetti(false);
            return 0;
          });
        }, 100);
      }, 1000); // ⏳ wait 500ms before starting to fade
      return () => {
        clearTimeout(delayBeforeFade);
      };
    }
  }, [showConfetti]);
  const [currentStreak, setCurrentStreak] = useState(0);

  const [animatedStreak, setAnimatedStreak] = useState(0);

  useEffect(() => {
    if (currentStreak > 0) {
      let counter = 0;
      let delay = 100; // Start slow (100ms)

      function countUp() {
        counter += 1;
        setAnimatedStreak(counter);

        if (counter < currentStreak) {
          // Decrease delay as counter increases, but cap it
          delay = Math.max(20, delay - 2);
          setTimeout(countUp, delay);
        }
      }

      countUp();
    }
  }, [currentStreak]);

  useEffect(() => {
    async function loadStreak() {
      try {
        const logs = await fetchWorkoutLogsForLastNDays(30);
        const streak = computeCurrentStreak(logs);
        setCurrentStreak(streak);
      } catch (error) {
        console.error("Error fetching streak:", error);
      }
    }
    loadStreak();
    setMotivation(
      motivationalMessages[
        Math.floor(Math.random() * motivationalMessages.length)
      ]
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#242B2F] flex flex-col items-center justify-center text-white p-6 text-center relative overflow-hidden">
      <Suspense fallback={null}>
        <SearchParamHandler
          param="type"
          fallback="completed"
          onResult={setType}
        />
      </Suspense>
      {confettiPieces > 0 && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={confettiPieces}
          gravity={0.5}
          initialVelocityY={10}
          recycle={false}
        />
      )}
      <h1
        className={`text-5xl font-extrabold mb-4 ${
          isCompleted ? "text-green-400" : "text-blue-400"
        }`}
      >
        {isCompleted ? "🎯 Mission Complete!" : "🌱 Recovery Day!"}
      </h1>
      <p className="text-md text-green-300 mb-4">
        🔥 Current Streak: {animatedStreak} Day{animatedStreak !== 1 ? "s" : ""}
      </p>
      <p className="text-lg text-gray-300 mb-8">{motivation}</p>
      <div className="flex flex-col gap-4">
        <button
          className="bg-gradient-to-r from-pink-500 to-pink-700 text-white py-3 px-6 rounded-2xl font-bold text-lg shadow-glow hover:shadow-glow-hover transition duration-300"
          onClick={() => router.push("/")}
        >
          🏡 Return Home
        </button>
        <button
          className="bg-gradient-to-r from-pink-600 to-red-600 text-white py-3 px-6 rounded-2xl font-bold text-lg shadow-glow hover:shadow-glow-hover transition duration-300"
          onClick={() => router.push("/calendar")}
        >
          📅 View Calendar
        </button>
      </div>
    </div>
  );
}
