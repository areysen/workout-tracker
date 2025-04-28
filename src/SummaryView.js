import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { getToday, formatDateWithOptions, getWeekday } from "./utils";
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
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("date", date);

      if (error) {
        console.error("Error loading workout summary:", error);
      } else {
        setLogEntry(data[0]);
      }
      setTimeout(() => {
        setLoading(false);
      }, 250);
    };

    fetchData();
  }, [date]);

  const undoDelete = () => {
    clearTimeout(undoTimer.current);
  };

  const handleDelete = async () => {
    showToast("Workout deleted! ✨", "error", {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#242B2F] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
      <div className="sticky top-0 z-10 bg-[#242B2F] pb-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <BackButton />
          <h1 className="text-3xl font-bold mb-1">
            Summary for {formattedDate}
          </h1>
        </div>

        {/* Motivational banner moved inside sticky */}
        {!logEntry?.skipped && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center bg-gradient-to-r from-pink-500 to-pink-700 text-white py-4 px-6 rounded-2xl mt-2 shadow-glow border border-pink-400 hover:shadow-glow-hover"
          >
            🏆 Workout Summary — Great Job Reviewing Your Progress!
          </motion.div>
        )}
      </div>

      {/* Main content and bottom action bar logic */}
      {!logEntry ? (
        <>
          <div className="flex flex-col space-y-4">
            <p className="text-gray-400 text-sm">
              No workout was logged for this day.
            </p>
          </div>
          {/* Bottom bar for Mark As Skipped */}
          <div className="pb-52" />
          <div className="fixed bottom-0 left-0 w-full bg-[#242B2F] p-4 space-y-3 z-10 max-w-3xl mx-auto">
            {date !== today && (
              <button
                onClick={async () => {
                  const { error } = await supabase.from("workout_logs").insert([
                    {
                      date,
                      forecast: false,
                      skipped: true,
                      muscle_group: "",
                      day: getWeekday(date),
                    },
                  ]);
                  if (error) {
                    console.error("Error marking as skipped:", error);
                    showToast(
                      "Failed to mark as skipped. Please try again.",
                      "error"
                    );
                  } else {
                    showToast("Workout marked as skipped!", "success");
                    navigate(0); // reload
                  }
                }}
                className="w-full bg-gradient-to-br from-pink-600 to-red-600 text-white font-bold py-2 px-4 rounded-2xl shadow-glow hover:shadow-glow-hover transition duration-300"
              >
                Mark As Skipped
              </button>
            )}
          </div>
        </>
      ) : logEntry.skipped ? (
        <>
          <div className="flex flex-col space-y-4">
            <p className="text-gray-400 text-sm">
              Workout was skipped for this day.
            </p>
          </div>
          {/* Bottom bar for Skipped status */}
          <div className="pb-52" />
          <div className="fixed bottom-0 left-0 w-full bg-[#242B2F] p-4 space-y-3 z-10 max-w-3xl mx-auto">
            <button
              disabled
              className="w-full bg-gradient-to-br from-gray-700 to-gray-600 text-white font-bold py-2 px-4 rounded-2xl border border-pink-400 shadow-glow cursor-not-allowed"
            >
              Skipped
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="pb-52">
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
                            <p className="font-semibold text-white">
                              {ex.name}
                            </p>
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
          {/* Bottom bar for Edit/Delete */}
          <div className="fixed bottom-0 left-0 w-full bg-[#242B2F] p-4 space-y-3 z-10 max-w-3xl mx-auto">
            {date === today && (
              <button className="w-full bg-gradient-to-r from-pink-500 to-pink-700 text-white font-bold py-2 px-4 rounded-2xl shadow-glow hover:shadow-glow-hover transition duration-300">
                ✏️ Edit Workout
              </button>
            )}
            <button
              onClick={() => navigate("/calendar")}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold py-2 px-4 rounded-2xl shadow-glow hover:shadow-glow-hover transition duration-300"
            >
              🗓 Return to Calendar
            </button>
            <button className="w-full bg-gradient-to-br from-pink-600 to-red-600 text-white font-bold py-2 px-4 rounded-2xl shadow-glow hover:shadow-glow-hover transition duration-300">
              🗑 Delete Workout
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
