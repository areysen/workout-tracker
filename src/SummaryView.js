import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { getToday, formatDateWithOptions } from "./utils";
import BackButton from "./components/BackButton";
import ConfirmModal from "./components/ConfirmModal";
import { useToast } from "./components/ToastContext";
import { motion } from "framer-motion";

export default function SummaryView() {
  const { date } = useParams();
  const today = getToday();
  const formattedDate = formatDateWithOptions(date);
  const isToday = date === today;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [logEntry, setLogEntry] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const undoTimer = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("date", date);

      if (error) {
        console.error("Error loading workout summary:", error);
      } else {
        setLogEntry(data[0]);
      }
    };

    fetchData();
  }, [date]);

  const undoDelete = () => {
    clearTimeout(undoTimer.current);
  };

  const handleDelete = async () => {
    showToast("Workout deleted! ✨", {
      showUndo: true,
      onUndo: undoDelete,
    });

    // Navigate immediately
    navigate("/calendar", {
      state: { refreshAfterUndoTimer: true },
    });

    // Set up delayed deletion after 5 seconds
    undoTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("workout_logs")
        .delete()
        .eq("date", date);

      if (error) {
        console.error("Error deleting workout:", error);
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
      <div className="sticky top-0 z-10 bg-[#242B2F] pt-4 pb-2">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <BackButton />
          <h1 className="text-xl font-bold">
            Summary for {formatDateWithOptions(date)}
          </h1>
        </div>
      </div>

      {/* Motivational banner */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center bg-gradient-to-r from-pink-500 to-pink-700 text-white py-3 px-4 rounded-md mb-6 shadow-md"
      >
        🏆 Workout Summary — Great Job Reviewing Your Progress!
      </motion.div>

      {!logEntry ? (
        <p className="text-gray-400 text-sm">
          No workout was logged for this day.
        </p>
      ) : logEntry.skipped ? (
        <p className="text-gray-400 text-sm">
          Workout was skipped for this day.
        </p>
      ) : (
        <div className="pb-32">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-pink-400 mb-4">
              {logEntry.day} — {logEntry.muscle_group}
            </h2>
            {["warmup", "main", "cooldown"].map(
              (section) =>
                logEntry.exercises[section]?.length > 0 && (
                  <div key={section} className="mt-6">
                    <h2 className="text-lg font-semibold text-white capitalize mb-2">
                      {section}
                    </h2>
                    <ul className="text-sm space-y-2">
                      {logEntry.exercises[section].map((ex, i) => (
                        <li
                          key={`${section}-${i}`}
                          className="bg-gradient-to-br from-[#2E353A] to-[#343E44] border border-[#C63663] p-3 rounded"
                        >
                          <p className="font-semibold text-white">{ex.name}</p>
                          <p className="text-gray-300 text-xs">
                            {ex.sets && ex.reps
                              ? `${ex.sets} sets × ${ex.reps} reps`
                              : ""}
                            {ex.duration
                              ? `${ex.sets && ex.reps ? " – " : ""}${
                                  ex.duration
                                }`
                              : ""}
                            {ex.weight ? ` @ ${ex.weight} lbs` : ""}
                            {ex.rpe ? ` (RPE ${ex.rpe})` : ""}
                          </p>
                          {ex.notes && (
                            <p className="text-xs text-gray-400 mt-1">
                              Note: {ex.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )}
          </div>
        </div>
      )}
      {logEntry && !logEntry.skipped && (
        <>
          <div className="pb-32" />
          <div className="fixed bottom-0 left-0 w-full bg-[#242B2F] p-4 space-y-3 z-10 max-w-3xl mx-auto">
            <button
              onClick={() => navigate(`/log/${date}`)}
              className="w-full bg-white text-[#242B2F] font-bold py-2 px-4 rounded hover:brightness-110"
            >
              Edit Workout
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full bg-gradient-to-br from-pink-600 to-red-600 text-white font-bold py-2 px-4 rounded hover:brightness-110 transition"
            >
              Delete Workout
            </button>
          </div>
        </>
      )}
      <ConfirmModal
        isOpen={confirmOpen}
        message="Are you sure you want to delete this workout?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          handleDelete();
        }}
      />
    </div>
  );
}
