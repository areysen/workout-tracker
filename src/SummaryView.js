import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { getToday, formatDateWithOptions } from "./utils";

export default function SummaryView() {
  const { date } = useParams();
  const today = getToday();
  const formattedDate = formatDateWithOptions(date);
  const isToday = date === today;
  const navigate = useNavigate();
  const [logEntry, setLogEntry] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("date", date);

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
      <div className="sticky top-0 z-10 bg-[#242B2F] pt-4 pb-2">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => {
              if (logEntry) {
                navigate("/calendar", {
                  state: {
                    previousViewMode: window.lastViewMode || "week",
                    previousSelectedDate: date,
                  },
                });
              } else {
                navigate(-1);
              }
            }}
            className="text-sm border border-white px-3 py-1 rounded hover:bg-white/10"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">
            Summary for {formatDateWithOptions(date)}
          </h1>
        </div>
      </div>

      {!logEntry ? (
        <p className="text-gray-400 text-sm">
          No workout was logged for this day.
        </p>
      ) : logEntry.skipped ? (
        <p className="text-gray-400 text-sm">
          Workout was skipped for this day.
        </p>
      ) : (
        <div className="pb-32">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-[#C63663]">
              {logEntry.day} — {logEntry.muscle_group}
            </h2>
            {["warmup", "main", "cooldown"].map(
              (section) =>
                logEntry.exercises[section]?.length > 0 && (
                  <div key={section}>
                    <h2 className="text-lg font-semibold text-white capitalize mb-2">
                      {section}
                    </h2>
                    <ul className="text-sm space-y-2">
                      {logEntry.exercises[section].map((ex, i) => (
                        <li
                          key={`${section}-${i}`}
                          className="bg-[#343E44] p-3 rounded"
                        >
                          <p className="font-semibold text-white">{ex.name}</p>
                          <p className="text-gray-300 text-xs">
                            {ex.sets && ex.reps
                              ? `${ex.sets} sets × ${ex.reps} reps`
                              : ""}
                            {ex.duration
                              ? `${ex.sets && ex.reps ? " – " : ""}${
                                  ex.duration
                                }`
                              : ""}
                            {ex.weight ? ` @ ${ex.weight} lbs` : ""}
                            {ex.rpe ? ` (RPE ${ex.rpe})` : ""}
                          </p>
                          {ex.notes && (
                            <p className="text-xs text-gray-400 mt-1">
                              Note: {ex.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )}
          </div>
        </div>
      )}
      {logEntry && !logEntry.skipped && (
        <>
          <div className="pb-32" />
          <div className="fixed bottom-0 left-0 w-full bg-[#242B2F] p-4 space-y-3 z-10 max-w-3xl mx-auto">
            <button
              onClick={() => navigate(`/log/${date}`)}
              className="w-full bg-white text-[#242B2F] font-bold py-2 px-4 rounded hover:bg-gray-100"
            >
              Edit Workout
            </button>
            <button
              onClick={async () => {
                const { error } = await supabase
                  .from("workout_logs")
                  .delete()
                  .eq("date", date);
                if (!error) navigate("/calendar");
              }}
              className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700"
            >
              Delete Workout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
