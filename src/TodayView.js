import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

const TodayView = () => {
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTodayLog = async () => {
            setLoading(true);
            const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'
            const { data, error } = await supabase.from("workout_logs").select("*").eq("date", today).single();

            if (error) {
                console.warn("No workout log for today");
            } else {
                setLog(data);
            }

            setLoading(false);
        };

        fetchTodayLog();
    }, []);

    const handleGoToLog = () => {
        if (log?.forecast) {
            navigate(`/preview/${log.date}`);
        } else {
            navigate(`/summary/${log.date}`);
        }
    };

    if (loading) {
        return <div className="text-white p-4">Loading...</div>;
    }

    if (!log) {
        return (
            <div className="min-h-screen bg-[#242B2F] text-white p-4">
                <h1 className="text-xl font-bold mb-4">Today</h1>
                <p>No workout logged or scheduled for today.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#242B2F] text-white p-4">
            <h1 className="text-xl font-bold mb-4">Today</h1>
            <div className="bg-[#343E44] p-4 rounded shadow text-sm space-y-2">
                <p className="text-[#C63663] font-semibold">
                    {log.day} — {log.muscleGroup}
                </p>
                <ul className="space-y-1">
                    {log.exercises?.map((exercise, idx) => (
                        <li key={idx} className="border-b border-gray-600 pb-1">
                            <p className="text-white font-medium">{exercise.name}</p>
                            <p className="text-gray-300 text-xs">
                                {exercise.sets} sets × {exercise.reps} reps @ {exercise.weight} lbs (RPE {exercise.rpe})
                            </p>
                        </li>
                    ))}
                </ul>
                <button onClick={handleGoToLog} className="mt-3 bg-[#C63663] text-white px-4 py-1 rounded text-xs">
                    View {log.forecast ? "Planned" : "Completed"} Workout
                </button>
            </div>
        </div>
    );
};

export default TodayView;
