import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { getWeekday, formatDateWithOptions, getToday } from "./utils";
import BackButton from "./components/BackButton";
import { motion } from "framer-motion";
import { useToast } from "./components/ToastContext";
import ConfirmModal from "./components/ConfirmModal";

function PreviewView() {
  const { date } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const today = getToday();
  const [logForDate, setLogForDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [showConfirmSkip, setShowConfirmSkip] = useState(false);
  const [todaySkipped, setTodaySkipped] = useState(false);
  const [todayHasLog, setTodayHasLog] = useState(false);
  const [forecastTemplateId, setForecastTemplateId] = useState(null);

  useEffect(() => {
    async function fetchWorkoutLog() {
      setLoading(true);
      setForecastTemplateId(null);
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
        setForecastTemplateId(null);
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
          setForecastTemplateId(template.id);
        } else {
          setLogForDate(null);
        }
      }
      setTimeout(() => {
        setLoading(false);
      }, 250);
    }

    fetchWorkoutLog();
  }, [date]);

  useEffect(() => {
    async function fetchTodayEntry() {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("skipped")
        .eq("date", today)
        .maybeSingle();
      if (!error && data) {
        setTodaySkipped(!!data.skipped);
        setTodayHasLog(true);
      } else {
        setTodaySkipped(false);
        setTodayHasLog(false);
      }
    }
    fetchTodayEntry();
  }, [today]);

  const [scrolled, setScrolled] = useState(false);

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

  const dayName = logForDate?.date
    ? formatDateWithOptions(logForDate.date, { weekday: "long" })
    : "";
  if (loading) {
    return (
      <div className="min-h-screen bg-[#242B2F] text-white flex items-center justify-center">
        <p className="text-pink-400 text-lg">Loading preview...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
      <div
        className="sticky top-0 z-10 bg-[#242B2F] pb-4"
        style={{
          paddingTop: scrolled ? "env(safe-area-inset-top)" : "0px",
        }}
      >
        <div className="flex justify-between items-center flex-wrap gap-3">
          <BackButton />
          <h1 className="text-xl font-bold">
            Preview for {formatDateWithOptions(date)}
          </h1>
        </div>
      </div>

      {/* Motivational banner */}
      {date === today && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center bg-gradient-to-r from-pink-500 to-pink-700 text-white py-3 px-4 rounded-md mb-6 shadow-md"
        >
          ⚡ Ready to Crush Your Workout? Preview Your Plan!
        </motion.div>
      )}
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
      <>
        <div className="pb-32" />
        <div className="fixed bottom-0 left-0 w-full bg-[#242B2F] p-4 space-y-3 z-10 max-w-3xl mx-auto">
          <button
            onClick={() => {
              if (logForDate.id) {
                // you’re editing an existing log for today
                navigate("/log", { state: { fromPreview: true } });
              } else if (forecastTemplateId) {
                // you’re starting a forecast, so hand off the template
                navigate(`/log?templateId=${forecastTemplateId}`, {
                  state: { fromPreview: true },
                });
              }
            }}
            className="w-full bg-white text-[#242B2F] font-bold py-2 px-4 rounded hover:brightness-110 text-center"
          >
            Start Workout
          </button>
          {/* Show Skip Day, Skipped, or Logged button based on today's status */}
          {!todaySkipped && !todayHasLog ? (
            <button
              onClick={() => setShowConfirmSkip(true)}
              className="w-full bg-gradient-to-br from-pink-600 to-red-600 text-white font-bold py-2 px-4 rounded hover:brightness-110 transition text-center"
            >
              Skip Today
            </button>
          ) : todaySkipped ? (
            <button
              disabled
              className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded cursor-not-allowed text-center"
            >
              Skipped
            </button>
          ) : todayHasLog ? (
            <button
              disabled
              className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded cursor-not-allowed text-center"
            >
              Logged
            </button>
          ) : null}
        </div>
      </>
      <ConfirmModal
        isOpen={showConfirmSkip}
        message="Are you sure you want to skip this workout?"
        onCancel={() => setShowConfirmSkip(false)}
        onConfirm={async () => {
          setShowConfirmSkip(false);
          const { error } = await supabase.from("workout_logs").insert([
            {
              date: today,
              forecast: false,
              skipped: true,
              muscle_group: logForDate?.muscle_group || "",
              day: getWeekday(today),
            },
          ]);

          if (error) {
            console.error("Error skipping workout:", error);
            showToast("Failed to skip workout. Please try again.", "error");
          } else {
            setTodaySkipped(true);
            navigate("/mission-complete", {
              replace: true,
              state: { type: "skipped" },
            });
          }
        }}
      />
    </div>
  );
}

export default PreviewView;
