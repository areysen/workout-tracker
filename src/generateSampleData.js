// generateSampleData.js
import { supabase } from "./supabaseClient";
import { format, addDays, subDays, isWeekend, getDay, startOfDay } from "date-fns";

const workoutPlan = [
    "Chest, Shoulders, Triceps + Cardio",
    "Legs & Core + HIIT",
    "Back & Biceps + Cardio Row",
    "Glutes, Hamstrings, Core + Conditioning",
    "Full Body Metcon / HIIT"
];

const sampleExercises = {
    "Chest, Shoulders, Triceps + Cardio": ["Incline Dumbbell Press", "Flat Bench Press", "Shoulder Press"],
    "Legs & Core + HIIT": ["Back Squat", "Lunges", "Cable Crunches"],
    "Back & Biceps + Cardio Row": ["Barbell Row", "Lat Pulldown", "Hammer Curls"],
    "Glutes, Hamstrings, Core + Conditioning": ["Hip Thrusts", "Split Squats", "Hamstring Curls"],
    "Full Body Metcon / HIIT": ["Box Jumps", "Push-ups", "Goblet Squats"]
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shouldSkip = () => Math.random() < 0.2; // 20% chance to skip

export const generateSampleData = async () => {
    const today = startOfDay(new Date());
    const data = [];

    for (let i = 28; i > 0; i--) {
        const date = subDays(today, i);
        const dow = getDay(date);
        if (dow === 0 || dow === 6) continue;

        const planIndex = dow - 1;
        const workoutType = workoutPlan[planIndex];
        const exercises = sampleExercises[workoutType] || [];

        if (shouldSkip()) continue;

        data.push({
            date: format(date, "yyyy-MM-dd"),
            day: format(date, "EEEE"),
            muscleGroup: workoutType,
            exercises: exercises.map((name) => ({
                name,
                sets: 3,
                reps: 10,
                weight: (Math.random() * 50 + 40).toFixed(1),
                rpe: Math.floor(Math.random() * 4 + 6),
                notes: "Sample entry"
            })),
            caloriesBurned: Math.floor(Math.random() * 250 + 400)
        });
    }

    for (let i = 0; i < 14; i++) {
        const date = addDays(today, i);
        const dow = getDay(date);
        if (dow === 0 || dow === 6) continue;

        const planIndex = dow - 1;
        const workoutType = workoutPlan[planIndex];
        const exercises = sampleExercises[workoutType] || [];

        data.push({
            date: format(date, "yyyy-MM-dd"),
            day: format(date, "EEEE"),
            muscleGroup: workoutType,
            exercises: exercises.map((name) => ({
                name,
                sets: 3,
                reps: 10,
                weight: (Math.random() * 50 + 40).toFixed(1),
                rpe: Math.floor(Math.random() * 4 + 6),
                notes: "Planned workout"
            })),
            forecast: true
        });
    }

    for (let entry of data) {
        const { error } = await supabase.from("workout_logs").insert(entry);
        if (error) console.error("❌ Error inserting entry:", entry, error);
    }

    console.log("✅ Sample data inserted.");
};

export const clearSampleData = async () => {
    const { error } = await supabase.from("workout_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // dummy WHERE clause to allow delete

    if (error) {
        console.error("❌ Error clearing ALL logs:", error);
    } else {
        console.log("🧼 All workout logs cleared.");
    }
};

// OPTIONAL DEV PANEL
export function DevControls() {
    return (
        <div className="fixed bottom-4 right-4 bg-[#343E44] border border-[#818C91] rounded-lg shadow-md p-3 z-50">
            <p className="text-white text-sm font-semibold mb-2">Dev Controls</p>
            <div className="flex flex-col gap-2">
                <button
                    onClick={generateSampleData}
                    className="bg-[#C63663] text-white text-sm rounded px-3 py-1 hover:bg-[#b03056]">
                    Generate Sample Data
                </button>
                <button
                    onClick={clearSampleData}
                    className="bg-transparent border border-white text-white text-sm rounded px-3 py-1 hover:bg-white/10">
                    Clear Sample Data
                </button>
            </div>
        </div>
    );
}
