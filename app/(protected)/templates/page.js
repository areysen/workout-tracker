"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { getToday, getWeekday } from "@/lib/utils";
import BackButton from "@/components/BackButton";

export default function TemplateListView() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const today = getToday();

  useEffect(() => {
    async function loadTemplates() {
      const { data, error } = await supabase
        .from("workout_templates")
        .select("*");
      if (error) {
        console.error("Error fetching templates:", error);
      } else {
        const orderedDays = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ];
        const sorted = [...data].sort(
          (a, b) =>
            orderedDays.indexOf(a.day_of_week?.toLowerCase()) -
            orderedDays.indexOf(b.day_of_week?.toLowerCase())
        );
        setTemplates(sorted);
      }
      setLoading(false);
    }
    loadTemplates();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#242B2F] text-white flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-6 w-48 bg-[#343E44] rounded mb-2 mx-auto" />
          <div className="h-4 w-64 bg-[#343E44] rounded mb-2 mx-auto" />
          <div className="h-4 w-40 bg-[#343E44] rounded mx-auto" />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <BackButton />
        <h1 className="text-2xl font-bold">Workout Templates</h1>
      </div>
      <ul className="space-y-4">
        {templates.map((tpl) => (
          <li
            key={tpl.id}
            className="p-4 bg-[#343E44] shadow-md border border-[#818C91] rounded-lg flex items-center justify-between transition duration-200 ease-in-out hover:bg-[#3e484f] hover:scale-[1.01] hover:border-white"
          >
            <div>
              <p className="font-semibold">{tpl.workout_name}</p>
              <p className="text-sm text-pink-300 tracking-wide">
                {tpl.day_of_week
                  ? tpl.day_of_week.charAt(0).toUpperCase() +
                    tpl.day_of_week.slice(1)
                  : "No day assigned"}
              </p>
            </div>
            {tpl.workout_name && tpl.workout_name.toLowerCase() !== "rest" && (
              <button
                onClick={() =>
                  router.push(
                    `/log-workout?templateId=${tpl.id}&fromTemplate=true`
                  )
                }
                className="bg-transparent border border-white text-white font-bold py-2 px-4 rounded hover:bg-white hover:text-[#242B2F] transition"
              >
                Start
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
