import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { format, parseISO } from "date-fns";
import { getToday, formatDateForDisplay } from "./utils";

function PreviewView() {
    const { date } = useParams();
    const navigate = useNavigate();
    const [logForDate, setLogForDate] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function fetchWorkoutLog() {
            setLoading(true);
            const { data, error } = await supabase.from("workout_logs").select("*").eq("date", date).maybeSingle();

            if (error) {
                console.error("Error fetching log:", error);
            }
            if (data && typeof data.exercises === "string") {
                try {
                    data.exercises = JSON.parse(data.exercises);
                } catch (error) {
                    console.error("❌ Failed to parse exercises", error);
                    data.exercises = [];
                }
            }
            setLogForDate(data);
            setLoading(false);
        }

        fetchWorkoutLog();
    }, [date]);

    if (!logForDate) return <div>No workout found for this day.</div>;
    if (!logForDate) return <div className="p-4 text-white">Loading...</div>;

    const dateObj = new Date(logForDate.date);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    return (
        <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
            <div className="sticky top-0 z-10 bg-[#242B2F] pt-4 pb-2">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm border border-white px-3 py-1 rounded hover:bg-white/10">
                        ← Back
                    </button>
                    <h1 className="text-xl font-bold">Preview for {format(parseISO(date), "EEE, MMM d")}</h1>
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#C63663]">
                    {dayName} — {logForDate.muscleGroup}
                </h2>

                <ul className="text-sm space-y-2">
                    {logForDate.exercises.map((exercise, index) => (
                        <li key={index} className="bg-[#343E44] p-3 rounded">
                            <p className="font-semibold text-white">{exercise.name}</p>
                            <p className="text-gray-300 text-xs">
                                {exercise.sets} sets × {exercise.reps} reps @ {exercise.weight} lbs (RPE {exercise.rpe})
                            </p>
                            {exercise.notes && <p className="text-xs text-gray-400 mt-1">Note: {exercise.notes}</p>}
                        </li>
                    ))}
                </ul>
            </div>
            {!logForDate?.hasLoggedWorkout && (
                <div className="mt-8 flex justify-center">
                    <Link
                        to={`/log/${date}`}
                        className="bg-[#C63663] text-white px-6 py-3 rounded-xl shadow hover:brightness-110 transition w-full text-center">
                        Start Workout
                    </Link>
                </div>
            )}
        </div>
    );
}

export default PreviewView;
