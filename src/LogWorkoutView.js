import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { format, parseISO } from "date-fns";

export default function LogWorkoutView() {
    const { date } = useParams();
    const navigate = useNavigate();
    const [workout, setWorkout] = useState(null);
    const [formData, setFormData] = useState([]);

    useEffect(() => {
        const fetchWorkout = async () => {
            const { data, error } = await supabase.from("workout_logs").select("*").eq("date", date).single();

            if (error) console.error("❌ Error loading workout:", error);
            else {
                setWorkout(data);
                setFormData(
                    data.exercises.map((exercise) => ({
                        ...exercise,
                        actualSets: "",
                        actualReps: "",
                        actualWeight: "",
                        actualRPE: ""
                    }))
                );
            }
        };

        fetchWorkout();
    }, [date]);

    const handleChange = (index, field, value) => {
        const updated = [...formData];
        updated[index][field] = value;
        setFormData(updated);
    };

    const handleSubmit = async () => {
        const { error } = await supabase
            .from("workout_logs")
            .update({
                hasLoggedWorkout: true,
                actualExercises: formData
            })
            .eq("date", date);

        if (error) {
            console.error("❌ Error saving log:", error);
        } else {
            console.log("✅ Workout logged!");
            navigate(`/summary/${date}`);
        }
    };

    if (!workout) return <div className="p-4 text-white">Loading workout...</div>;

    return (
        <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm border border-white px-3 py-1 rounded hover:bg-white/10">
                    ← Back
                </button>
                <h1 className="text-xl font-bold">Log Workout for {format(parseISO(date), "EEE, MMM d")}</h1>
            </div>

            <div className="space-y-6">
                {formData.map((exercise, index) => (
                    <div key={index} className="bg-[#343E44] p-4 rounded-lg shadow">
                        <p className="font-semibold mb-2">{exercise.name}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <input
                                type="number"
                                placeholder="Sets"
                                value={exercise.actualSets}
                                onChange={(e) => handleChange(index, "actualSets", e.target.value)}
                                className="bg-transparent border border-gray-500 p-2 rounded"
                            />
                            <input
                                type="number"
                                placeholder="Reps"
                                value={exercise.actualReps}
                                onChange={(e) => handleChange(index, "actualReps", e.target.value)}
                                className="bg-transparent border border-gray-500 p-2 rounded"
                            />
                            <input
                                type="number"
                                placeholder="Weight"
                                value={exercise.actualWeight}
                                onChange={(e) => handleChange(index, "actualWeight", e.target.value)}
                                className="bg-transparent border border-gray-500 p-2 rounded"
                            />
                            <input
                                type="number"
                                placeholder="RPE"
                                value={exercise.actualRPE}
                                onChange={(e) => handleChange(index, "actualRPE", e.target.value)}
                                className="bg-transparent border border-gray-500 p-2 rounded"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                className="w-full bg-[#C63663] mt-6 py-3 text-white rounded-xl hover:brightness-110 transition">
                Finish Workout
            </button>
        </div>
    );
}
