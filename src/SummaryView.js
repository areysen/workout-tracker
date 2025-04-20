import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { parseISO, format } from "date-fns";

export default function SummaryView() {
    const { date } = useParams();
    const navigate = useNavigate();
    const [logEntry, setLogEntry] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase.from("workout_logs").select("*").eq("date", date);

            if (error) {
                console.error("Error loading workout summary:", error);
            } else {
                setLogEntry(data[0]);
            }
        };

        fetchData();
    }, [date]);

    return (
        <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm border border-white px-3 py-1 rounded hover:bg-white/10">
                    ← Back
                </button>
                <h1 className="text-xl font-bold">Summary for {format(parseISO(date), "EEE, MMM d")}</h1>
            </div>

            {!logEntry ? (
                <p className="text-gray-400 text-sm">No workout was logged for this day.</p>
            ) : (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-[#C63663]">
                        {logEntry.day} — {logEntry.muscleGroup}
                    </h2>
                    <ul className="text-sm space-y-2">
                        {logEntry.exercises.map((ex, i) => (
                            <li key={i} className="bg-[#343E44] p-3 rounded">
                                <p className="font-semibold text-white">{ex.name}</p>
                                <p className="text-gray-300 text-xs">
                                    {ex.sets} sets × {ex.reps} reps @ {ex.weight || "—"} lbs (RPE {ex.rpe || "—"})
                                </p>
                                {ex.notes && <p className="text-xs text-gray-400 mt-1">Note: {ex.notes}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
