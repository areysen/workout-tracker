import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { getWeekday, formatDateWithOptions } from "./utils";

function PreviewView() {
    const { date } = useParams();
    const navigate = useNavigate();
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

            if (data && typeof data.exercises === "string") {
                try {
                    data.exercises = JSON.parse(data.exercises);
                } catch (error) {
                    console.error("❌ Failed to parse exercises", error);
                    data.exercises = [];
                }
            }

            if (data) {
                setLogForDate(data);
            } else {
                // Forecast fallback
                const weekday = getWeekday(date).toLowerCase();
                const { data: template, error: templateError } = await supabase
                    .from("workout_templates")
                    .select("*")
                    .eq("day_of_week", weekday)
                    .maybeSingle();

                if (template) {
                    setLogForDate({
                        date,
                        exercises: template.exercises,
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
            <div className="sticky top-0 z-10 bg-[#242B2F] pt-4 pb-2">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm border border-white px-3 py-1 rounded hover:bg-white/10">
                        ← Back
                    </button>
                    <h1 className="text-xl font-bold">Preview for {formatDateWithOptions(date)}</h1>
                </div>
            </div>

            <div className="space-y-3">
                {logForDate && (
                  <h2 className="text-lg font-semibold text-[#C63663]">
                    {dayName}{logForDate.muscle_group ? ` — ${logForDate.muscle_group}` : ""}
                  </h2>
                )}

                {logForDate?.exercises &&
                  ["warmup", "main", "cooldown"].map((section) => (
                    logForDate.exercises?.[section]?.length > 0 && (
                        <div key={section}>
                            <h2 className="text-lg font-semibold text-white capitalize mb-2">{section}</h2>
                            <ul className="text-sm space-y-2">
                                {logForDate.exercises[section].map((ex, i) => (
                                    <li key={`${section}-${i}`} className="bg-[#343E44] p-3 rounded">
                                        <p className="font-semibold text-white">{ex.name}</p>
                                        <p className="text-gray-300 text-xs">
                                            {ex.sets && ex.reps ? `${ex.sets} sets × ${ex.reps} reps` : ex.duration || ""}
                                            {ex.weight ? ` @ ${ex.weight} lbs` : ""}
                                            {ex.rpe ? ` (RPE ${ex.rpe})` : ""}
                                        </p>
                                        {ex.notes && <p className="text-xs text-gray-400 mt-1">Note: {ex.notes}</p>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                  ))}
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
