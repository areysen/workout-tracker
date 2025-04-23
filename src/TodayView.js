import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWorkoutLogs } from "./supabaseClient";
import { getToday, formatDateWithOptions } from "./utils";

export default function TodayView() {
  const [todayLog, setTodayLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();

  const today = getToday();
  const formattedDate = formatDateWithOptions(today, { weekday: "long" });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const logs = await fetchWorkoutLogs();
      const todayMatch = logs.find((log) => log.date === today);
      setTodayLog(todayMatch || null);
      setLoading(false);
    }
    load();
  }, [today]);

  return (
    <div className="min-h-screen bg-[#242B2F] p-4 max-w-3xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-1">Welcome back, Andrew! 💪</h1>
      <p className="text-sm text-gray-300 mb-4">Today is {formattedDate}</p>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : todayLog ? (
        <div>
          <p className="mb-4 text-gray-300">
            You have a {todayLog.forecast ? "planned" : "completed"} workout for
            today!
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 bg-[#C63663] text-white py-2 px-4 rounded font-semibold hover:bg-pink-600 transition"
              onClick={() =>
                navigate(
                  todayLog.forecast ? `/preview/${today}` : `/summary/${today}`
                )
              }
            >
              View {todayLog.forecast ? "Preview" : "Summary"}
            </button>
            <button
              className="flex-1 bg-[#343E44] text-white py-2 px-4 rounded font-semibold hover:bg-gray-700 transition"
              onClick={() => navigate("/calendar")}
            >
              View Calendar
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-gray-400 mb-2">No workout logged for today yet.</p>
          <p className="text-pink-400 font-medium mb-4">Planned: Leg Day</p>
          <div className="flex gap-2">
            <button
              className="flex-1 bg-[#C63663] text-white py-2 px-4 rounded font-semibold hover:bg-pink-600 transition"
              onClick={() => navigate(`/preview/${today}`)}
            >
              Preview Workout
            </button>
            <button
              className="flex-1 bg-[#343E44] text-white py-2 px-4 rounded font-semibold hover:bg-gray-700 transition"
              onClick={() => navigate("/calendar")}
            >
              View Calendar
            </button>
          </div>
        </>
      )}

      {/* Motivational Box */}
      <div className="mt-6 p-4 bg-[#2E353A] rounded text-sm text-gray-300 border border-[#C63663]">
        💪 Stay consistent, Andrew — today’s workout pushes you one step closer
        to your goal!
      </div>

      {/* Toggle CoachBot */}
      <button
        className="mt-4 text-sm text-white bg-[#343E44] px-3 py-1 rounded"
        onClick={() => setShowChat(!showChat)}
      >
        {showChat ? "Hide CoachBot 🤖" : "Show CoachBot 💬"}
      </button>

      {showChat && (
        <div className="mt-4 flex items-start space-x-2">
          <div className="bg-[#343E44] p-4 rounded text-sm text-gray-300 w-full">
            <span className="font-semibold text-[#C63663]">CoachBot:</span>{" "}
            Let’s crush it today! Here’s your game plan. 🧠🔥
          </div>
        </div>
      )}
    </div>
  );
}
