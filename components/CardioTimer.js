"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useState } from "react";

export default function CardioTimer({ work, rest, sets, onComplete }) {
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState("work");
  const [timeLeft, setTimeLeft] = useState(work);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Phase complete, switch
        if (phase === "work") {
          setPhase("rest");
          return rest;
        } else {
          // End of rest
          if (currentSet < sets) {
            setCurrentSet((prevSet) => prevSet + 1);
            setPhase("work");
            return work;
          } else {
            clearInterval(timer);
            setRunning(false);
            onComplete?.();
            return 0;
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, phase, currentSet]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-4 p-4 rounded-lg bg-[#343E44] border border-yellow-400 text-center text-white">
      <div className="text-lg font-semibold">
        Set {currentSet} of {sets} — <span className="capitalize">{phase}</span>
      </div>
      <div className="text-4xl text-yellow-300 font-bold my-2">
        {formatTime(timeLeft)}
      </div>
      {!running && (
        <button
          onClick={() => setRunning(true)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-full transition"
        >
          Start Timer
        </button>
      )}
    </div>
  );
}
