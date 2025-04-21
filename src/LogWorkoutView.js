import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { getToday, formatDateWithOptions } from "./utils";

export default function LogWorkoutView() {
    const [searchParams] = useSearchParams();
    const { date: selectedDate } = useParams();
    const navigate = useNavigate();
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState([]);

    useEffect(() => {
        async function fetchWorkout() {
            const { data, error } = await supabase.from("workout_logs").select("*").eq("date", selectedDate).single();

            if (error) {
                console.error("Error fetching workout:", error);
            } else {
                setLog(data);
                setFormData(
                    data.exercises.map((exercise) => ({
                        name: exercise.name,
                        sets: "",
                        reps: "",
                        weight: "",
                        rpe: "",
                        note: ""
                    }))
                );
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
            rpe: Number(exercise.rpe)
        }));

        const { error } = await supabase
            .from("workout_logs")
            .update({ exercises: updatedExercises, forecast: false })
            .eq("date", selectedDate);

        if (error) {
            console.error("Error updating workout:", error);
        } else {
            navigate(`/summary?date=${selectedDate}`);
        }
    };

    if (loading) return <div className="text-white p-4">Loading...</div>;
    if (!log) return <div className="text-white p-4">No workout found for this date.</div>;

    return (
        <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
            <div className="sticky top-0 z-10 bg-[#242B2F] pt-4 pb-2">
                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm border border-white px-3 py-1 rounded hover:bg-white/10">
                        ← Back
                    </button>
                    <h1 className="text-xl font-bold">Log Workout for {formatDateWithOptions(selectedDate)}</h1>
                </div>
            </div>

            <h2 className="text-lg font-semibold text-[#C63663] mt-4">
                {log.day} — {log.muscleGroup}
            </h2>

            <form className="space-y-6 mt-4">
                {formData.map((exercise, index) => (
                    <div key={index} className="bg-[#343E44] p-4 rounded space-y-2">
                        <p className="font-semibold text-white">{exercise.name}</p>
                        <div className="flex gap-2 text-sm">
                            <input
                                type="number"
                                placeholder="Sets"
                                className="w-1/5 p-1 rounded bg-transparent border border-[#818C91] text-white"
                                value={exercise.sets}
                                onChange={(e) => handleChange(index, "sets", e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Reps"
                                className="w-1/5 p-1 rounded bg-transparent border border-[#818C91] text-white"
                                value={exercise.reps}
                                onChange={(e) => handleChange(index, "reps", e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="Weight"
                                className="w-1/5 p-1 rounded bg-transparent border border-[#818C91] text-white"
                                value={exercise.weight}
                                onChange={(e) => handleChange(index, "weight", e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="RPE"
                                className="w-1/5 p-1 rounded bg-transparent border border-[#818C91] text-white"
                                value={exercise.rpe}
                                onChange={(e) => handleChange(index, "rpe", e.target.value)}
                            />
                        </div>
                        <textarea
                            placeholder="Notes"
                            className="w-full p-1 rounded bg-transparent border border-[#818C91] text-white text-sm"
                            value={exercise.note}
                            onChange={(e) => handleChange(index, "note", e.target.value)}
                        />
                    </div>
                ))}
            </form>

            <button
                onClick={handleSubmit}
                className="mt-6 w-full bg-[#C63663] text-white py-2 rounded text-sm font-semibold">
                Save Workout
            </button>
        </div>
    );
}
