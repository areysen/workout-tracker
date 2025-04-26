import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { getWeekday, formatDateWithOptions } from "./utils";
import BackButton from "./components/BackButton";
import { motion } from "framer-motion";

function PreviewView() {
  const { date } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [logForDate, setLogForDate] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchWorkoutLog() {
      setLoading(true);
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("date", date)
        .maybeSingle();

      if (error) {
        console.error("Error fetching log:", error);
      }

      if (data) {
        if (typeof data.exercises === "string") {
          try {
            data.exercises = JSON.parse(data.exercises);
          } catch (error) {
            console.error("❌ Failed to parse exercises", error);
            data.exercises = { warmup: [], main: [], cooldown: [] };
          }
        }
        if (!data.exercises?.main) {
          data.exercises = {
            warmup: [],
            main: Array.isArray(data.exercises) ? data.exercises : [],
            cooldown: [],
          };
        }

        setLogForDate(data);
      } else {
        // Forecast fallback
        const weekday = getWeekday(date).toLowerCase();
        const { data: templates, error: templateError } = await supabase
          .from("workout_templates")
          .select("*")
          .eq("day_of_week", weekday);

        if (templates && templates.length > 0) {
          const template = templates[0];
          let exercises = template.exercises;

          // Parse if stored as JSON string
          if (typeof exercises === "string") {
            try {
              exercises = JSON.parse(exercises);
            } catch (e) {
              console.error("❌ Failed to parse template exercises", e);
              exercises = {};
            }
          }

          const sections = ["warmup", "main", "cooldown"];
          const structured = {
            warmup: exercises?.warmup || [],
            main: exercises?.main || [],
            cooldown: exercises?.cooldown || [],
          };

          setLogForDate({
            date,
            exercises: structured,
            muscle_group: template.workout_name,
            hasLoggedWorkout: false,
          });
        } else {
          setLogForDate(null);
        }
      }

      setLoading(false);
    }

    fetchWorkoutLog();
  }, [date]);

  const dayName = logForDate?.date
    ? formatDateWithOptions(logForDate.date, { weekday: "long" })
    : "";
  return (
    <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
      <div className="sticky top-0 z-10 bg-[#242B2F] pt-[env(safe-area-inset-top)] pb-2">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <BackButton />
          <h1 className="text-xl font-bold">
            Preview for {formatDateWithOptions(date)}
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
        ⚡ Ready to Crush Your Workout? Preview Your Plan!
      </motion.div>
      <div className="pb-32">
        <div className="space-y-3">
          {logForDate && (
            <h2 className="text-xl font-semibold text-pink-400 mb-4">
              {getWeekday(date)}
              {logForDate.muscle_group ? ` — ${logForDate.muscle_group}` : ""}
            </h2>
          )}

          {logForDate?.exercises &&
            ["warmup", "main", "cooldown"].map(
              (section) =>
                logForDate.exercises?.[section]?.length > 0 && (
                  <div key={section}>
                    <h2 className="text-lg font-semibold text-white capitalize mb-2">
                      {section}
                    </h2>
                    <ul className="text-sm space-y-2">
                      {logForDate.exercises[section].map((ex, i) => (
                        <li
                          key={`${section}-${i}`}
                          className="bg-gradient-to-br from-[#2E353A] to-[#343E44] border border-[#C63663] p-3 rounded"
                        >
                          <p className="font-semibold text-white">{ex.name}</p>
                          <p className="text-gray-300 text-xs">
                            {ex.sets && `Sets: ${ex.sets} `}
                            {ex.reps && `Reps: ${ex.reps} `}
                            {ex.weighted &&
                              ex.weight &&
                              `Weight: ${ex.weight} lbs `}
                            {ex.rpe && `RPE: ${ex.rpe} `}
                            {ex.rounds && `Rounds: ${ex.rounds} `}
                            {ex.work && `Work: ${ex.work} `}
                            {ex.rest && `Rest: ${ex.rest} `}
                            {ex.timed &&
                              ex.duration &&
                              `Duration: ${ex.duration} `}
                            {/* Cardio tag */}
                            {ex.cardio && (
                              <span className="ml-1 text-[#6EE7B7]">
                                Cardio
                              </span>
                            )}
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
      {!logForDate?.hasLoggedWorkout && (
        <>
          <div className="pb-32" />
          <div className="fixed bottom-0 left-0 w-full bg-[#242B2F] p-4 space-y-3 z-10 max-w-3xl mx-auto">
            <button
              onClick={() =>
                navigate(`/log/${date}`, {
                  replace: true,
                  state: { fromPreview: true, previousSelectedDate: date },
                })
              }
              className="w-full bg-white text-[#242B2F] font-bold py-2 px-4 rounded hover:brightness-110 text-center"
            >
              Start Workout
            </button>
            <button
              onClick={async () => {
                if (
                  window.confirm("Are you sure you want to skip this workout?")
                ) {
                  const { error } = await supabase.from("workout_logs").insert([
                    {
                      date,
                      forecast: false,
                      skipped: true,
                      muscle_group: logForDate?.muscle_group || "",
                      day: getWeekday(date),
                    },
                  ]);

                  if (error) {
                    console.error("Error skipping workout:", error);
                  } else {
                    navigate(`/summary/${date}`);
                  }
                }
              }}
              className="w-full bg-gradient-to-br from-pink-600 to-red-600 text-white font-bold py-2 px-4 rounded hover:brightness-110 transition"
            >
              Skip Workout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default PreviewView;
