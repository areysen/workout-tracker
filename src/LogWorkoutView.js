import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { getToday, formatDateWithOptions, getWeekday } from "./utils";

export default function LogWorkoutView() {
  const [searchParams] = useSearchParams();
  const { date: selectedDate } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState([]);

  useEffect(() => {
    async function fetchWorkout() {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("date", selectedDate)
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
        const weekday = getWeekday(selectedDate).toLowerCase();
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
            date: selectedDate,
            muscle_group: firstTemplate.workout_name,
            day: getWeekday(selectedDate),
          });
        } else {
          console.warn("No template found for this day.");
        }
      }

      setLoading(false);
    }
    fetchWorkout();
  }, [selectedDate]);

  const handleChange = (index, field, value) => {
    const updated = [...formData];
    updated[index][field] = value;
    setFormData(updated);
  };

  const handleSubmit = async () => {
    const updatedExercises = formData.map((exercise) => ({
      ...exercise,
      sets: Number(exercise.sets),
      reps: Number(exercise.reps),
      weight: Number(exercise.weight),
      rpe: Number(exercise.rpe),
    }));

    if (log?.id) {
      const { error } = await supabase
        .from("workout_logs")
        .update({ exercises: updatedExercises, forecast: false })
        .eq("id", log.id);

      if (error) {
        console.error("Error updating workout:", error);
      } else {
        if (selectedDate) {
          navigate(`/summary/${selectedDate}`);
        } else {
          navigate("/summary");
        }
      }
    } else {
      const { error } = await supabase.from("workout_logs").insert([
        {
          date: selectedDate,
          exercises: {
            warmup: updatedExercises.filter((e) => e.section === "warmup"),
            main: updatedExercises.filter((e) => e.section === "main"),
            cooldown: updatedExercises.filter((e) => e.section === "cooldown"),
          },
          forecast: false,
          muscle_group: log?.muscle_group || "",
          day: log?.day || getWeekday(selectedDate),
        },
      ]);

      if (error) {
        console.error("Error inserting workout:", error);
      } else {
        if (selectedDate) {
          navigate(`/summary/${selectedDate}`);
        } else {
          navigate("/summary");
        }
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
      <div className="sticky top-0 z-10 bg-[#242B2F] pt-4 pb-2">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm border border-white px-3 py-1 rounded hover:bg-white/10"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">
            Log Workout for {formatDateWithOptions(selectedDate)}
          </h1>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-[#C63663] mt-4">
        {log.day || getWeekday(selectedDate)} — {log.muscle_group}
      </h2>

      <div className="pb-20">
        <form className="space-y-6 mt-4">
          {["warmup", "main", "cooldown"].map((section) => {
            const exercises = formData.filter((ex) => ex.section === section);
            if (exercises.length === 0) return null;
            return (
              <div key={section}>
                <h3 className="text-white text-lg font-semibold capitalize mb-2">
                  {section}
                </h3>
                <div className="space-y-4">
                  {exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="bg-[#343E44] p-4 rounded space-y-2"
                    >
                      <div className="flex justify-between items-center">
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
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          {exercise.sets && (
                            <div className="flex flex-col">
                              <label className="text-xs text-gray-400 mb-1">
                                Sets
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="p-1 rounded bg-transparent border border-[#818C91] text-white text-sm text-base"
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

                          {exercise.reps && (
                            <div className="flex flex-col">
                              <label className="text-xs text-gray-400 mb-1">
                                Reps
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="p-1 rounded bg-transparent border border-[#818C91] text-white text-sm text-base"
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

                          {section === "main" && exercise.weighted && (
                            <>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-400 mb-1">
                                  Weight
                                </label>
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  className="p-1 rounded bg-transparent border border-[#818C91] text-white text-sm text-base"
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
                            </>
                          )}

                          {section === "main" && exercise.weighted && (
                            <>
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-400 mb-1">
                                  RPE
                                </label>
                                <select
                                  className="p-1 rounded bg-transparent border border-[#818C91] text-white text-sm text-base"
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
                            </>
                          )}

                          {section === "main" &&
                            exercise.timed &&
                            exercise.duration && (
                              <div className="flex flex-col">
                                <label className="text-xs text-gray-400 mb-1">
                                  Duration
                                </label>
                                <input
                                  type="text"
                                  className="p-1 rounded bg-transparent border border-[#818C91] text-white text-sm text-base"
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

                          {section === "main" &&
                            (exercise.cardio ||
                              exercise.subtype === "hiit") && (
                              <>
                                {exercise.rounds && (
                                  <div className="flex flex-col">
                                    <label className="text-xs text-gray-400 mb-1">
                                      Rounds
                                    </label>
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      className="p-1 rounded bg-transparent border border-[#818C91] text-white text-sm text-base"
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
                                )}
                                {exercise.work && (
                                  <div className="flex flex-col">
                                    <label className="text-xs text-gray-400 mb-1">
                                      Work
                                    </label>
                                    <input
                                      type="text"
                                      className="p-1 rounded bg-transparent border border-[#818C91] text-white text-sm text-base"
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
                                )}
                                {exercise.rest && (
                                  <div className="flex flex-col">
                                    <label className="text-xs text-gray-400 mb-1">
                                      Rest
                                    </label>
                                    <input
                                      type="text"
                                      className="p-1 rounded bg-transparent border border-[#818C91] text-white text-sm text-base"
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
                                )}
                              </>
                            )}
                        </div>
                      )}
                      <textarea
                        placeholder="Notes"
                        className="w-full p-1 rounded bg-transparent border border-[#818C91] text-white text-sm text-base"
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
          className="w-full bg-[#C63663] text-white py-2 rounded text-sm font-semibold"
        >
          Save Workout
        </button>
      </div>
    </div>
  );
}
