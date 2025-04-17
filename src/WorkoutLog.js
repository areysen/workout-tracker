// WorkoutLog.js with Searchable History View & All Features
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
export default function WorkoutLog() {
  const rpeScale = [
    { value: "1", description: "Very light, warm-up only" },
    { value: "2", description: "Light effort" },
    { value: "3", description: "Still easy, barely working" },
    { value: "4", description: "Moderate, could do 6+ more reps" },
    { value: "5", description: "Challenging but still easy" },
    { value: "6", description: "Moderate effort, 4-5 reps left" },
    { value: "7", description: "Hard, 3 reps left" },
    { value: "8", description: "Very hard, 2 reps left" },
    { value: "9", description: "Max effort, 1 rep left" },
    { value: "10", description: "All out, couldn't do another rep" }
  ];

  const getRecommendedRest = (exerciseName) => {
    const compounds = ["Squat", "Deadlift", "Press", "Row", "Pull-Up", "Bench"];
    return compounds.some((c) => exerciseName.includes(c)) ? "60–120s" : "30–60s";
  };

  const getSmartSuggestion = (exercise) => {
    if (!exercise.prevWeight || !exercise.rpe) return null;
    const prev = parseFloat(exercise.prevWeight);
    const rpe = parseInt(exercise.rpe);
    if (!prev || !rpe || rpe >= 9) return null;
    const increment = rpe <= 6 ? 5 : 2.5;
    return `${(prev + increment).toFixed(1)} lbs`;
  };

  const getPreviousBest = (exercise) => {
    if (!exercise.prevWeight || !exercise.sets || !exercise.reps || !exercise.rpe) return null;
    return `${exercise.prevWeight} lbs × ${exercise.reps} (RPE ${exercise.rpe})`;
  };

  const defaultLog = [
    {
      day: "Monday",
      muscleGroup: "Chest, Shoulders, Triceps + Cardio",
      warmups: ["Arm Circles", "Band Pull-Aparts"],
      exercises: [
        {
          name: "Incline Dumbbell Press",
          sets: "4",
          reps: "10",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Flat Bench Press or Machine Press",
          sets: "3",
          reps: "8",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Seated DB Shoulder Press",
          sets: "3",
          reps: "10",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Lateral Raises",
          sets: "3",
          reps: "15",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Tricep Dips or Cable Pushdowns",
          sets: "4",
          reps: "12",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "15 min Incline Walk or Light Cycle",
          sets: "1",
          reps: "15 min",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Cardio finisher",
          done: false
        }
      ]
    },
    {
      day: "Tuesday",
      muscleGroup: "Legs & Core + HIIT",
      warmups: ["Bodyweight Squats", "Hip Bridges"],
      exercises: [
        {
          name: "Barbell Back Squat or Leg Press",
          sets: "4",
          reps: "8",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Romanian Deadlifts",
          sets: "3",
          reps: "10",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Walking Lunges",
          sets: "3",
          reps: "12",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Calf Raises",
          sets: "3",
          reps: "15",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Cable Crunches",
          sets: "3",
          reps: "15",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Weighted core",
          done: false
        },
        {
          name: "Sprints (30s) + Rest (90s)",
          sets: "4",
          reps: "30s sprint",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "90s",
          notes: "HIIT finisher",
          done: false
        }
      ]
    },
    {
      day: "Wednesday",
      muscleGroup: "Back & Biceps + Cardio Row",
      warmups: ["Band Pulls", "Dynamic Arm Swings"],
      exercises: [
        {
          name: "Barbell or Cable Row",
          sets: "4",
          reps: "10",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Lat Pulldown or Pull-Ups",
          sets: "3",
          reps: "8",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Face Pulls",
          sets: "3",
          reps: "15",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Shoulder health",
          done: false
        },
        {
          name: "Barbell or Dumbbell Curls",
          sets: "3",
          reps: "10",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Hammer Curls",
          sets: "3",
          reps: "10",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Forearms",
          done: false
        },
        {
          name: "Rower (steady or intervals)",
          sets: "1",
          reps: "10–15 min",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Cardio finisher",
          done: false
        }
      ]
    },
    {
      day: "Thursday",
      muscleGroup: "Glutes, Hamstrings, Core + Conditioning",
      warmups: ["Glute Bridges", "Leg Swings"],
      exercises: [
        {
          name: "Hip Thrusts",
          sets: "4",
          reps: "10",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Bulgarian Split Squats",
          sets: "3",
          reps: "10",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Hamstring Curls",
          sets: "3",
          reps: "12",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Glute Kickbacks",
          sets: "3",
          reps: "15",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "",
          done: false
        },
        {
          name: "Hanging Leg Raises",
          sets: "3",
          reps: "12",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Core stability",
          done: false
        },
        {
          name: "Sled Push or Battle Ropes",
          sets: "6",
          reps: "20s",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Conditioning",
          done: false
        }
      ]
    },
    {
      day: "Friday",
      muscleGroup: "Full Body Metcon / HIIT",
      warmups: ["Jump Rope", "Mobility Flow"],
      exercises: [
        {
          name: "Box Jumps",
          sets: "3",
          reps: "10",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Explosiveness",
          done: false
        },
        {
          name: "Kettlebell Swings",
          sets: "3",
          reps: "20",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Glutes + cardio",
          done: false
        },
        {
          name: "Push-ups or DB Bench",
          sets: "3",
          reps: "12",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Upper body",
          done: false
        },
        {
          name: "Goblet Squats",
          sets: "3",
          reps: "15",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Quads + core",
          done: false
        },
        {
          name: "Russian Twists",
          sets: "3",
          reps: "20",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Obliques",
          done: false
        },
        {
          name: "AMRAP 10 min: burpees, wall balls, jump rope",
          sets: "AMRAP",
          reps: "10/10/10",
          weight: "",
          prevWeight: "",
          rpe: "",
          rest: "",
          notes: "Finisher circuit",
          done: false
        }
      ]
    }
  ];

  const [log, setLog] = useState(() => {
    const saved = localStorage.getItem("workoutLog");
    return saved ? JSON.parse(saved) : defaultLog;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("workoutHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [searchTerm, setSearchTerm] = useState("");
  const filteredHistory = history.filter((entry) => {
    const term = searchTerm.toLowerCase();
    return (
      entry.day.toLowerCase().includes(term) ||
      entry.muscleGroup.toLowerCase().includes(term) ||
      entry.exercises.some(
        (ex) => ex.name.toLowerCase().includes(term) || (ex.notes && ex.notes.toLowerCase().includes(term))
      )
    );
  });

  const [completedWarmups, setCompletedWarmups] = useState({});
  const [showRPE, setShowRPE] = useState(false);
  const todayIndex = new Date().getDay() - 1;
  const [activeTab, setActiveTab] = useState(todayIndex >= 0 && todayIndex <= 4 ? todayIndex : 0);
  const tabRefs = useRef([]);

  useEffect(() => {
    localStorage.setItem("workoutLog", JSON.stringify(log));
  }, [log]);

  useEffect(() => {
    localStorage.setItem("workoutHistory", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (tabRefs.current[activeTab]) {
      tabRefs.current[activeTab].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeTab]);

  const handleChange = (dayIndex, exerciseIndex, field, value) => {
    const updatedLog = [...log];
    updatedLog[dayIndex].exercises[exerciseIndex][field] = value;
    setLog(updatedLog);
  };

  const toggleWarmup = (dayIndex, warmup) => {
    const key = `${dayIndex}-${warmup}`;
    setCompletedWarmups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExerciseDone = (dayIndex, exerciseIndex) => {
    const updatedLog = [...log];
    updatedLog[dayIndex].exercises[exerciseIndex].done = !updatedLog[dayIndex].exercises[exerciseIndex].done;
    setLog(updatedLog);
  };

  const finishDay = async (dayIndex) => {
    const updatedLog = [...log];
    const today = new Date().toLocaleDateString();
    const finished = {
      date: today,
      day: log[dayIndex].day,
      muscleGroup: log[dayIndex].muscleGroup,
      exercises: log[dayIndex].exercises.map((ex) => ({
        name: ex.name,
        weight: ex.weight,
        reps: ex.reps,
        sets: ex.sets,
        rpe: ex.rpe,
        notes: ex.notes
      }))
    };

    // ✅ Save to local history
    setHistory((prev) => [...prev, finished]);

    // ✅ Save to Supabase
    const { error } = await supabase.from("workout_logs").insert({
      log_date: new Date().toISOString(),
      log_data: finished
    });

    if (error) {
      console.error("❌ Supabase upload failed:", error.message);
      alert("Failed to sync with Supabase.");
    } else {
      console.log("✅ Workout saved to Supabase.");
    }

    // ✅ Clear the log for the day
    updatedLog[dayIndex].exercises.forEach((ex) => {
      if (ex.weight) ex.prevWeight = ex.weight;
      ex.weight = "";
      ex.rpe = "";
      ex.rest = "";
      ex.notes = "";
      ex.done = false;
    });
    setLog(updatedLog);
  };

  const exportLog = () => {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workout-log-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  const tabs = [...log.map((d) => d.day), "History"];

  return (
    <div className="min-h-screen w-full bg-[#242B2F] text-white">
      <div className="p-4 space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Workout Tracker</h1>
          <button
            onClick={exportLog}
            className="border border-white text-white px-3 py-1 rounded text-sm bg-transparent hover:bg-white/10">
            Export Log
          </button>
        </div>

        <div className={`bg-[#343E44] p-4 rounded-md ${showRPE ? "" : "pb-2"}`}>
          <button
            onClick={() => setShowRPE(!showRPE)}
            className="text-left w-full text-lg font-semibold flex justify-between items-center text-white">
            RPE Scale (Rate of Perceived Exertion)
            <span>{showRPE ? "▲" : "▼"}</span>
          </button>
          {showRPE && (
            <ul className="text-sm space-y-1 mt-2 text-gray-300">
              {rpeScale.map((rpe) => (
                <li key={rpe.value}>
                  <strong>{rpe.value}</strong>: {rpe.description}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex space-x-2 overflow-x-auto border-b pb-2 border-gray-700">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 rounded-t-md text-base whitespace-nowrap ${
                activeTab === index ? "bg-[#C63663] text-white" : "bg-gray-700 text-gray-300"
              }`}>
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={testSupabase}
          className="border border-white text-white px-3 py-1 rounded text-sm bg-transparent hover:bg-white/10">
          Test Supabase Sync
        </button>

        {activeTab === tabs.length - 1 ? (
          <div className="bg-[#343E44] p-4 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-white">Workout History</h2>
            <input
              type="text"
              className="border rounded p-2 w-full mb-4 text-base bg-transparent border-[#818C91] text-white placeholder-gray-400"
              placeholder="Search history by day, muscle group, exercise, or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {filteredHistory.length === 0 ? (
              <p className="text-gray-400">No matching workouts found.</p>
            ) : (
              filteredHistory.map((entry, i) => (
                <div key={i} className="mb-4">
                  <h3 className="font-semibold text-[#C63663]">
                    {entry.date} – {entry.day} ({entry.muscleGroup})
                  </h3>
                  <ul className="text-sm ml-4 mt-1 list-disc text-gray-300">
                    {entry.exercises.map((ex, j) => (
                      <li key={j}>
                        <span className="font-medium text-white">{ex.name}</span>: {ex.sets}x{ex.reps} @ {ex.weight} lbs
                        (RPE {ex.rpe}) {ex.notes && `– ${ex.notes}`}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        ) : null}

        {log.map(
          (day, dayIndex) =>
            activeTab === dayIndex && (
              <div key={day.day} className="bg-[#343E44] p-4 rounded-xl shadow-md space-y-4">
                <h2 className="text-xl font-semibold text-white">
                  {day.day} – {day.muscleGroup}
                </h2>

                <div className="space-y-2">
                  <h3 className="text-md font-medium text-gray-300">Warmups</h3>
                  {day.warmups.map((warmup, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        className="accent-[#C63663]"
                        checked={completedWarmups[`${dayIndex}-${warmup}`] || false}
                        onChange={() => toggleWarmup(dayIndex, warmup)}
                      />
                      {warmup}
                    </label>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-300 mt-4">Main Exercises</h3>
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <div key={exercise.name} className="p-3 border border-[#818C91] rounded-md space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                        <label className="flex items-center gap-2 text-white">
                          <input
                            type="checkbox"
                            checked={exercise.done || false}
                            onChange={() => toggleExerciseDone(dayIndex, exerciseIndex)}
                          />
                          <span className="font-medium">{exercise.name}</span>
                        </label>
                        <div className="text-sm text-gray-400">
                          Recommended: {exercise.sets} x {exercise.reps}
                        </div>
                        {exercise.prevWeight && (
                          <div className="text-sm text-gray-400">Previous Weight: {exercise.prevWeight} lbs</div>
                        )}
                      </div>

                      {getPreviousBest(exercise) && (
                        <div className="text-xs text-purple-400 font-medium">
                          💪 Previous Best: {getPreviousBest(exercise)}
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-sm">
                        <input
                          className="border rounded p-1 h-9 text-base bg-transparent border-[#818C91] text-white placeholder-gray-400"
                          placeholder="Sets"
                          value={exercise.sets}
                          onChange={(e) => handleChange(dayIndex, exerciseIndex, "sets", e.target.value)}
                        />
                        <input
                          className="border rounded p-1 h-9 text-base bg-transparent border-[#818C91] text-white placeholder-gray-400"
                          placeholder="Reps"
                          value={exercise.reps}
                          onChange={(e) => handleChange(dayIndex, exerciseIndex, "reps", e.target.value)}
                        />
                        <input
                          className="border rounded p-1 h-9 text-base bg-transparent border-[#818C91] text-white placeholder-gray-400"
                          placeholder="Weight"
                          value={exercise.weight}
                          onChange={(e) => handleChange(dayIndex, exerciseIndex, "weight", e.target.value)}
                        />
                        <select
                          className="border rounded p-1 h-9 text-base bg-transparent border-[#818C91] text-white"
                          value={exercise.rpe || ""}
                          onChange={(e) => handleChange(dayIndex, exerciseIndex, "rpe", e.target.value)}>
                          <option value="">RPE</option>
                          {rpeScale.map((rpe) => (
                            <option key={rpe.value} value={rpe.value}>
                              {rpe.value}
                            </option>
                          ))}
                        </select>
                        <div className="flex flex-col">
                          <input
                            className="border rounded p-1 h-9 text-base bg-transparent border-[#818C91] text-white placeholder-gray-400"
                            placeholder="Rest (sec)"
                            value={exercise.rest}
                            onChange={(e) => handleChange(dayIndex, exerciseIndex, "rest", e.target.value)}
                          />
                          <span className="text-xs text-gray-400 mt-1">
                            Recommended: {getRecommendedRest(exercise.name)}
                          </span>
                        </div>
                        <input
                          className="border rounded p-1 h-9 text-base bg-transparent border-[#818C91] text-white placeholder-gray-400"
                          placeholder="Notes"
                          value={exercise.notes}
                          onChange={(e) => handleChange(dayIndex, exerciseIndex, "notes", e.target.value)}
                        />
                      </div>

                      {getSmartSuggestion(exercise) && (
                        <div className="text-xs text-green-400 pt-1">💡 Suggestion: {getSmartSuggestion(exercise)}</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end"></div>
              </div>
            )
        )}
      </div>
    </div>
  );
}
