import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { getToday, formatDateWithOptions, getWeekday } from "./utils";
import BackButton from "./components/BackButton";
import { motion } from "framer-motion";
import { useToast } from "./components/ToastContext";

export default function LogWorkoutView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState([]);
  const { showToast } = useToast();
  const today = getToday();
  const logDate = today;
  const templateId = searchParams.get("templateId");

  useEffect(() => {
    if (templateId) return;
    async function fetchWorkout() {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("date", today)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching workout:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setLog(data);
        const flatExercises = [
          ...(data.exercises?.warmup || []),
          ...(data.exercises?.main || []),
          ...(data.exercises?.cooldown || []),
        ];
        setFormData(
          flatExercises.map((exercise) => {
            const isWeighted =
              exercise.weighted !== undefined
                ? exercise.weighted
                : exercise.weight > 0;
            const isTimed =
              exercise.timed !== undefined
                ? exercise.timed
                : !!exercise.duration;
            const isCardio =
              exercise.cardio !== undefined
                ? exercise.cardio
                : !!(
                    exercise.rounds ||
                    exercise.work ||
                    exercise.rest ||
                    exercise.subtype === "hiit"
                  );
            const subtype =
              exercise.subtype ||
              (isCardio && exercise.work && exercise.rest ? "hiit" : "");

            return {
              name: exercise.name,
              sets: exercise.sets || "",
              reps: exercise.reps || "",
              weight: exercise.weight || "",
              rpe: exercise.rpe || "",
              duration: exercise.duration || "",
              rounds: exercise.rounds || "",
              rest: exercise.rest || "",
              work: exercise.work || "",
              note: exercise.note || "",
              section: exercise.section || "main",
              weighted: isWeighted,
              timed: isTimed,
              cardio: isCardio,
              subtype: subtype,
              completed:
                exercise.completed !== undefined ? exercise.completed : true,
            };
          })
        );
      } else {
        // No existing log — forecast from template
        const weekday = getWeekday(today).toLowerCase();
        const { data: template, error: templateError } = await supabase
          .from("workout_templates")
          .select("*")
          .eq("day_of_week", weekday);

        if (template && template.length > 0) {
          const firstTemplate = template[0];
          const sections = ["warmup", "main", "cooldown"];
          // Build structuredData, preserving all flags and including rounds/rest/work/duration for all
          const structuredData = sections.flatMap((section) =>
            (firstTemplate.exercises?.[section] || []).map((exercise) => ({
              name: exercise.name,
              sets: exercise.sets || "",
              reps: exercise.reps || "",
              weight: exercise.weight || "",
              rpe: exercise.rpe || "",
              duration: exercise.duration || "",
              rounds: exercise.rounds || "",
              rest: exercise.rest || "",
              work: exercise.work || "",
              note: exercise.note || "",
              section,
              weighted: exercise.weighted || false,
              timed: exercise.timed || false,
              cardio: exercise.cardio || false,
              completed: section === "main" ? true : false,
            }))
          );
          setFormData(structuredData);

          setLog({
            date: today,
            muscle_group: firstTemplate.workout_name,
            day: getWeekday(today),
          });
        } else {
          console.warn("No template found for this day.");
        }
      }

      setLoading(false);
    }
    fetchWorkout();
  }, [today, templateId]);

  // Template loading effect
  useEffect(() => {
    if (!templateId) return;
    setLoading(true);
    (async () => {
      const { data: template, error } = await supabase
        .from("workout_templates")
        .select("*")
        .eq("id", templateId)
        .maybeSingle();
      if (error) {
        console.error("Error loading template:", error);
      } else if (template) {
        let exercises = template.exercises;
        if (typeof exercises === "string") {
          try {
            exercises = JSON.parse(exercises);
          } catch {
            exercises = {};
          }
        }
        const flat = [];
        ["warmup", "main", "cooldown"].forEach((section) => {
          (exercises[section] || []).forEach((ex) => {
            flat.push({ ...ex, section });
          });
        });
        setFormData(flat);
        setLog({
          id: null,
          date: today,
          muscle_group: template.workout_name,
          day: getWeekday(today),
        });
      }
      setLoading(false);
    })();
  }, [templateId]);

  const handleChange = (index, field, value) => {
    const updated = [...formData];
    updated[index][field] = value;
    setFormData(updated);
  };

  const handleSubmit = async () => {
    const updatedExercises = {
      warmup: formData
        .filter((e) => e.section === "warmup")
        .map((exercise) => ({
          ...exercise,
          sets: Number(exercise.sets),
          reps: Number(exercise.reps),
          weight: Number(exercise.weight),
          rpe: Number(exercise.rpe),
        })),
      main: formData
        .filter((e) => e.section === "main")
        .map((exercise) => ({
          ...exercise,
          sets: Number(exercise.sets),
          reps: Number(exercise.reps),
          weight: Number(exercise.weight),
          rpe: Number(exercise.rpe),
        })),
      cooldown: formData
        .filter((e) => e.section === "cooldown")
        .map((exercise) => ({
          ...exercise,
          sets: Number(exercise.sets),
          reps: Number(exercise.reps),
          weight: Number(exercise.weight),
          rpe: Number(exercise.rpe),
        })),
    };

    const shouldInsert = !log?.id;
    if (!shouldInsert) {
      // Update today's existing workout
      const { error } = await supabase
        .from("workout_logs")
        .update({ exercises: updatedExercises, forecast: false })
        .eq("id", log.id);
      if (error) {
        console.error("Error updating workout:", error);
      } else {
        showToast("Workout updated successfully! 🎉", "success");
        navigate(`/summary/${logDate}`, { replace: true });
      }
    } else {
      // Insert as today's workout, or update if already exists
      const { error: insertError } = await supabase
        .from("workout_logs")
        .insert([
          {
            date: logDate,
            exercises: updatedExercises,
            forecast: false,
            muscle_group: log?.muscle_group || "",
            day: getWeekday(logDate),
          },
        ]);

      if (insertError) {
        if (insertError.code === "23505") {
          // Duplicate date, so update existing record
          const { error: updateError } = await supabase
            .from("workout_logs")
            .update({
              exercises: updatedExercises,
              forecast: false,
              skipped: false,
            })
            .eq("date", logDate);
          if (updateError) {
            console.error("Error updating existing workout:", updateError);
          } else {
            showToast("Workout updated successfully! 🎉", "success");
            navigate(`/summary/${logDate}`, { replace: true });
          }
        } else {
          console.error("Error inserting workout:", insertError);
        }
      } else {
        showToast("Workout logged successfully! 🚀");
        navigate(`/summary/${logDate}`, { replace: true });
      }
    }
  };

  if (loading) return <div className="text-white p-4">Loading...</div>;
  if (!log)
    return (
      <div className="text-white p-4">No workout found for this date.</div>
    );

  return (
    <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
      <div className="sticky top-0 z-10 bg-[#242B2F] pt-[env(safe-area-inset-top)] pb-2">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <BackButton />
          <h1 className="text-xl font-bold">
            Log Workout for {formatDateWithOptions(logDate)}
          </h1>
        </div>
      </div>
      {!log?.forecast && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center bg-gradient-to-r from-pink-500 to-pink-700 text-white py-3 px-4 rounded-md mb-6 shadow-md"
        >
          🚀 Mission Started! Crush today's workout!
        </motion.div>
      )}

      <h2 className="text-lg font-semibold text-[#C63663] mt-4">
        {getWeekday(logDate)} — {log.muscle_group}
      </h2>

      <div className="pb-20">
        <form className="space-y-6 mt-4">
          {["warmup", "main", "cooldown"].map((section) => {
            const exercises = formData.filter((ex) => ex.section === section);
            if (exercises.length === 0) return null;
            return (
              <div key={section}>
                <h3 className="text-pink-400 text-xl font-bold capitalize mb-4">
                  {section}
                </h3>
                <div className="space-y-6">
                  {exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-[#2E353A] to-[#343E44] p-6 rounded-lg shadow-md border border-[#C63663] space-y-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-semibold text-white">
                            {exercise.name}
                          </p>
                          {(section === "warmup" || section === "cooldown") &&
                            exercise.duration && (
                              <p className="text-sm text-gray-300">
                                {exercise.duration}
                              </p>
                            )}
                        </div>
                        {(section === "warmup" || section === "cooldown") && (
                          <label className="text-sm flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={exercise.completed || false}
                              onChange={(e) =>
                                handleChange(
                                  formData.indexOf(exercise),
                                  "completed",
                                  e.target.checked
                                )
                              }
                            />
                            <span className="text-white">Done</span>
                          </label>
                        )}
                      </div>
                      {section === "main" && (
                        <div className="flex flex-wrap gap-4 text-sm">
                          {/* Show Sets input if exercise expects sets (for weighted or rep-based) */}
                          {(exercise.weighted || exercise.reps !== "") && (
                            <div className="flex-1 min-w-[100px] flex flex-col">
                              <label className="text-xs text-gray-400 mb-1">
                                Sets
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="p-2 rounded bg-transparent border border-[#818C91] text-white text-base"
                                value={exercise.sets}
                                onChange={(e) =>
                                  handleChange(
                                    formData.indexOf(exercise),
                                    "sets",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          )}

                          {/* Show Reps input if exercise expects reps */}
                          {(exercise.weighted || exercise.reps !== "") && (
                            <div className="flex-1 min-w-[100px] flex flex-col">
                              <label className="text-xs text-gray-400 mb-1">
                                Reps
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="p-2 rounded bg-transparent border border-[#818C91] text-white text-base"
                                value={exercise.reps}
                                onChange={(e) =>
                                  handleChange(
                                    formData.indexOf(exercise),
                                    "reps",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          )}

                          {/* Show Weight input if exercise is weighted */}
                          {section === "main" && exercise.weighted && (
                            <div className="flex-1 min-w-[100px] flex flex-col">
                              <label className="text-xs text-gray-400 mb-1">
                                Weight
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="p-2 rounded bg-transparent border border-[#818C91] text-white text-base"
                                value={exercise.weight}
                                onChange={(e) =>
                                  handleChange(
                                    formData.indexOf(exercise),
                                    "weight",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          )}

                          {/* Show Duration input if exercise is timed */}
                          {section === "main" && exercise.timed && (
                            <div className="flex-1 min-w-[100px] flex flex-col">
                              <label className="text-xs text-gray-400 mb-1">
                                Duration
                              </label>
                              <input
                                type="text"
                                className="p-2 rounded bg-transparent border border-[#818C91] text-white text-base"
                                value={exercise.duration}
                                onChange={(e) =>
                                  handleChange(
                                    formData.indexOf(exercise),
                                    "duration",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          )}

                          {/* Show Rounds/Work/Rest if exercise is cardio or HIIT */}
                          {section === "main" &&
                            (exercise.cardio ||
                              exercise.subtype === "hiit") && (
                              <>
                                <div className="flex-1 min-w-[100px] flex flex-col">
                                  <label className="text-xs text-gray-400 mb-1">
                                    Rounds
                                  </label>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="p-2 rounded bg-transparent border border-[#818C91] text-white text-base"
                                    value={exercise.rounds}
                                    onChange={(e) =>
                                      handleChange(
                                        formData.indexOf(exercise),
                                        "rounds",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex-1 min-w-[100px] flex flex-col">
                                  <label className="text-xs text-gray-400 mb-1">
                                    Work
                                  </label>
                                  <input
                                    type="text"
                                    className="p-2 rounded bg-transparent border border-[#818C91] text-white text-base"
                                    value={exercise.work}
                                    onChange={(e) =>
                                      handleChange(
                                        formData.indexOf(exercise),
                                        "work",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex-1 min-w-[100px] flex flex-col">
                                  <label className="text-xs text-gray-400 mb-1">
                                    Rest
                                  </label>
                                  <input
                                    type="text"
                                    className="p-2 rounded bg-transparent border border-[#818C91] text-white text-base"
                                    value={exercise.rest}
                                    onChange={(e) =>
                                      handleChange(
                                        formData.indexOf(exercise),
                                        "rest",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              </>
                            )}
                        </div>
                      )}
                      {section === "main" && exercise.weighted && (
                        <div className="flex flex-col">
                          <label className="text-xs text-gray-400 mb-1">
                            RPE
                          </label>
                          <select
                            className="p-2 rounded bg-transparent border border-[#818C91] text-white text-base"
                            value={exercise.rpe}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onChange={(e) =>
                              handleChange(
                                formData.indexOf(exercise),
                                "rpe",
                                e.target.value
                              )
                            }
                          >
                            <option value="">Select</option>
                            {[
                              "Very Easy",
                              "Easy",
                              "Light",
                              "Moderate Light",
                              "Moderate",
                              "Some Effort",
                              "Challenging",
                              "Hard",
                              "Very Hard",
                              "Max Effort",
                            ].map((label, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1} – {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <textarea
                        placeholder="Notes"
                        className="w-full p-2 rounded bg-transparent border border-[#818C91] text-white text-base"
                        value={exercise.note}
                        onChange={(e) =>
                          handleChange(
                            formData.indexOf(exercise),
                            "note",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#242B2F] p-4 shadow-md z-10">
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-700 text-white py-3 rounded font-bold text-lg hover:opacity-90 transition"
        >
          Save Workout
        </button>
      </div>
    </div>
  );
}
