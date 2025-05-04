"use client";
export const dynamic = "force-dynamic";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { getToday, getWeekday } from "@/lib/utils";

export default function TemplateListView() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const today = getToday();

  useEffect(() => {
    async function loadTemplates() {
      const { data, error } = await supabase
        .from("workout_templates")
        .select("*")
        .order("day_of_week", { ascending: true });
      if (error) {
        console.error("Error fetching templates:", error);
      } else {
        setTemplates(data);
      }
      setLoading(false);
    }
    loadTemplates();
  }, []);

  if (loading) return <div>Loading templates...</div>;

  return (
    <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Workout Templates</h1>
      <ul className="space-y-4">
        {templates.map((tpl) => (
          <li
            key={tpl.id}
            className="p-4 bg-[#2E353A] rounded-lg flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">{tpl.workout_name}</p>
              <p className="text-gray-400">{getWeekday(tpl.day_of_week)}</p>
            </div>
            <button
              onClick={() =>
                router.push(
                  `/log-workout?templateId=${tpl.id}&fromTemplate=true`
                )
              }
              className="bg-white text-[#242B2F] font-bold py-2 px-4 rounded hover:brightness-105"
            >
              Start
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
