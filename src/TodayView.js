import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
export default function TodayView() {
    const [workoutStarted, setWorkoutStarted] = useState(false);

    const [todayWorkout, setTodayWorkout] = useState(null);

    useEffect(() => {
        const fetchTodayWorkout = async () => {
            const today = new Date().toISOString().split("T")[0];
            const { data, error } = await supabase.from("workout_logs").select("*").eq("date", today).single();

            if (!error) {
                setTodayWorkout(data);
            }
        };

        fetchTodayWorkout();
    }, []);
    const navigate = useNavigate();

    const handleStartWorkout = () => {
        setWorkoutStarted(true);
    };

    if (workoutStarted) {
        return (
            <div className="min-h-screen bg-[#242B2F] text-white p-4">
                <h1 className="text-2xl font-bold mb-4">Today's Workout</h1>
                <p className="text-gray-300">[Insert workout flow here]</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#242B2F] text-white p-4 space-y-4 max-w-md mx-auto">
            <h1 className="text-3xl font-bold">Today</h1>

            {/* Workout Status */}
            <div className="bg-[#343E44] rounded-xl p-4">
                {false ? (
                    <>
                        <h2 className="font-semibold text-lg">Upper Body Workout</h2>
                        <p className="text-sm text-purple-300">Glutes Often Sunday</p>
                    </>
                ) : (
                    <>
                        <h2 className="font-semibold text-lg text-white">todayWorkout.muscleGroup</h2>
                        <p className="text-sm text-purple-300 mb-2">Once you log a workout, it’ll appear here.</p>
                    </>
                )}
                <button
                    className="bg-[#C63663] hover:bg-[#b03056] text-white font-medium px-4 py-2 rounded mt-2"
                    onClick={handleStartWorkout}>
                    Start Workout
                </button>
            </div>

            {/* Macro Overview Placeholder */}
            <div className="bg-[#343E44] rounded-xl p-4">
                <div className="flex justify-between text-sm text-gray-400">
                    <span>Macro targets</span>
                    <button className="text-[#C63663]">Log Meal</button>
                </div>
                <h2 className="text-2xl font-bold">2,600 kcal</h2>
                <p className="text-sm text-gray-300">202g protein target</p>
                <p className="text-sm text-purple-300">560 kcal left</p>
            </div>

            {/* Post-Workout Suggestion Placeholder */}
            <div className="bg-[#343E44] rounded-xl p-4">
                <h2 className="text-[#6EE7FF] font-semibold text-sm mb-1">Post-Workout Meal</h2>
                <p className="text-white text-sm">How about a protein shake and banana?</p>
            </div>

            {/* Meal Suggestions Placeholder */}
            <div className="bg-[#343E44] rounded-xl p-4">
                <div className="flex justify-between text-sm">
                    <h2 className="text-[#6EE7FF] font-semibold">Meal Suggestions</h2>
                    <span className="text-[#C63663]">Quick Add</span>
                </div>
                <ul className="mt-2 space-y-2 text-sm text-white">
                    <li>
                        <p className="font-medium">Yogurt with Berries</p>
                        <p className="text-xs text-gray-400">376 kcal • 28g protein</p>
                    </li>
                    <li>
                        <p className="font-medium">Chicken, Rice, and Broccoli</p>
                        <p className="text-xs text-gray-400">325 kcal • 40g protein</p>
                    </li>
                </ul>
            </div>

            {/* Chat Section */}
            <div className="bg-gradient-to-r from-[#8E2DE2] to-[#C63663] rounded-xl p-4 flex justify-between items-center">
                <div>
                    <p className="font-semibold text-white">Chat with AI</p>
                    <p className="text-sm text-white">Ask for suggestions, edits, or motivation</p>
                </div>
                <div className="text-white text-xl">💬</div>
            </div>

            {/* See All Navigation */}
            <div className="text-center">
                <button
                    onClick={() => navigate("/calendar", { state: { fromToday: true } })}
                    className="text-[#C63663] underline text-sm">
                    See All
                </button>
            </div>
        </div>
    );
}
