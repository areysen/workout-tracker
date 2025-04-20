import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yfnbnytutxdbmyvfsyba.supabase.co"; // paste your Project URL
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmbmJueXR1dHhkYm15dmZzeWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjAwNTksImV4cCI6MjA2MDQ5NjA1OX0.HJhDpx79rDzl5DZIh3qJZbBrSwudG95htPXOs2IGD30"; // paste your anon public key

export const supabase = createClient(supabaseUrl, supabaseKey);
export const fetchWorkoutLogs = async () => {
    const { data, error } = await supabase.from("workout_logs").select("*").order("date", { ascending: true });

    if (error) {
        console.error("Error fetching workout logs:", error.message);
        return [];
    }

    return data;
};
