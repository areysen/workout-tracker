"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function ConfirmTemplatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  const weekdayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  useEffect(() => {
    if (!user?.id) return;
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from("workout_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("day_of_week", { ascending: true, foreignTable: undefined });

      if (!error) {
        const sorted = (data || []).sort((a, b) => {
          return (
            weekdayOrder.indexOf(a.day_of_week.toLowerCase()) -
            weekdayOrder.indexOf(b.day_of_week.toLowerCase())
          );
        });
        setWorkouts(sorted);
      }
      setLoading(false);
    };
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setProfile(data);
    };
    fetchTemplates();
    fetchProfile();
  }, [user]);

  const groupExercises = (exercises) => {
    return {
      warmup: exercises.warmup || [],
      main: exercises.main || [],
      cooldown: exercises.cooldown || [],
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#242B2F] text-white">
        Loading your plan…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#242B2F] text-white px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-4">
        Confirm Your Workout Plan
      </h1>

      {workouts.map((w) => {
        const sections = groupExercises(w.exercises || {});
        return (
          <details
            key={w.id || w.day_of_week}
            className="bg-[#343E44] rounded-lg p-4 shadow-md ring-1 ring-pink-600/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-pink-500/20 transition-all ease-in-out duration-300"
            open
          >
            <summary className="text-lg font-semibold capitalize cursor-pointer list-none flex justify-between items-center transition-all ease-in-out duration-300">
              <span className="font-bold text-white">
                {w.day_of_week.charAt(0).toUpperCase() + w.day_of_week.slice(1)}
                : {w.workout_name}
              </span>
            </summary>

            {["warmup", "main", "cooldown"].map(
              (section) =>
                sections[section]?.length > 0 && (
                  <div
                    key={section}
                    className={`mt-4 border-l-4 pl-3 ${
                      section === "warmup"
                        ? "border-pink-400"
                        : section === "cooldown"
                        ? "border-purple-400"
                        : "border-white/20"
                    }`}
                  >
                    <h3 className="uppercase text-sm font-bold text-gray-300">
                      {section === "warmup"
                        ? "Warmup 🔥"
                        : section === "main"
                        ? "Main 🏋️"
                        : "Cooldown 🧘"}
                    </h3>
                    <ul className="mt-1 text-sm space-y-1">
                      {sections[section].map((ex, idx) => (
                        <li key={idx}>
                          <span className="font-semibold">{ex.name}</span> –{" "}
                          {ex.timed
                            ? `${ex.duration} ⏱`
                            : `${ex.sets}x${ex.reps}`}
                          {ex.cardio && <span className="ml-1">❤️</span>}
                          {ex.weighted && <span className="ml-1">🏋️</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )}
          </details>
        );
      })}

      <div className="text-center pt-4 flex flex-col items-center">
        <button
          onClick={() => router.push("/today")}
          className="px-5 py-2 mt-4 rounded-2xl bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:shadow-lg transition-all duration-200 text-white font-semibold"
        >
          Looks Good!
        </button>
        <button
          onClick={() => setShowPreferencesModal(true)}
          className="px-5 py-2 mt-2 rounded-2xl border border-white text-white hover:bg-white hover:text-black font-semibold hover:shadow-lg transition-all duration-200"
        >
          Edit My Preferences
        </button>
      </div>

      {showPreferencesModal && (
        <PreferencesModal
          profile={profile}
          setProfile={setProfile}
          onClose={() => setShowPreferencesModal(false)}
          userId={user?.id}
          refreshTemplates={() => {
            // Refetch templates and profile
            setLoading(true);
            const fetchTemplates = async () => {
              const { data, error } = await supabase
                .from("workout_templates")
                .select("*")
                .eq("user_id", user.id)
                .order("day_of_week", {
                  ascending: true,
                  foreignTable: undefined,
                });
              if (!error) {
                const sorted = (data || []).sort((a, b) => {
                  return (
                    weekdayOrder.indexOf(a.day_of_week.toLowerCase()) -
                    weekdayOrder.indexOf(b.day_of_week.toLowerCase())
                  );
                });
                setWorkouts(sorted);
              }
              setLoading(false);
            };
            const fetchProfile = async () => {
              const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();
              if (data) setProfile(data);
            };
            fetchTemplates();
            fetchProfile();
          }}
        />
      )}
    </div>
  );
}

// PreferencesModal component
import React from "react";

function PreferencesModal({
  profile,
  setProfile,
  onClose,
  userId,
  refreshTemplates,
}) {
  const [localProfile, setLocalProfile] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Keep localProfile in sync with profile
  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  if (!localProfile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white text-black p-6 rounded-lg w-11/12 max-w-md">
          <p>Loading preferences…</p>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-gray-300 text-black hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cardio preference handler
  const handleCardioPrefChange = (e) => {
    setLocalProfile((p) => ({
      ...p,
      cardio_preference: e.target.value,
    }));
  };

  // Days per week handler
  const handleDaysPerWeekChange = (e) => {
    let val = e.target.value;
    if (val === "") val = "";
    else {
      const num = Number(val);
      if (num < 1) val = "1";
      else if (num > 7) val = "7";
      else val = num.toString();
    }
    setLocalProfile((p) => ({
      ...p,
      days_per_week: val,
      // Also update preferred rest days if needed
      preferred_rest_days:
        p.preferred_rest_days && Array.isArray(p.preferred_rest_days)
          ? p.preferred_rest_days.slice(0, 7 - Number(val || 0))
          : [],
    }));
  };

  // Preferred rest days handler
  const handleRestDayToggle = (day) => {
    setLocalProfile((p) => {
      const maxRestDays = 7 - Number(p.days_per_week || 0);
      const selected = p.preferred_rest_days || [];
      if (selected.includes(day)) {
        return { ...p, preferred_rest_days: selected.filter((d) => d !== day) };
      }
      if (selected.length >= maxRestDays) {
        // Replace first selected rest day with the new one
        return { ...p, preferred_rest_days: [...selected.slice(1), day] };
      }
      return { ...p, preferred_rest_days: [...selected, day] };
    });
  };

  // Save & Regenerate handler
  const handleSaveAndRegenerate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // Upsert profile
      const upsertProfile = {
        ...localProfile,
        user_id: userId,
      };
      // Make sure days_per_week is a number
      if (typeof upsertProfile.days_per_week === "string") {
        upsertProfile.days_per_week = Number(upsertProfile.days_per_week);
      }
      // Upsert to Supabase
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(upsertProfile, { onConflict: ["user_id"] });
      if (profileError) {
        setError("Failed to update preferences.");
        setSaving(false);
        return;
      }
      setProfile((prev) => ({ ...prev, ...localProfile }));

      // Call /api/generate-template with new profile
      // Build the profile object for the endpoint
      const apiProfile = {
        name: localProfile.full_name || localProfile.name || "",
        experience: localProfile.experience,
        goal: localProfile.goal,
        days_per_week: localProfile.days_per_week,
        equipment: localProfile.equipment,
        height_cm: localProfile.height_cm,
        weight_kg: localProfile.weight_kg,
        unit_preference: localProfile.unit_preference,
        cardio_preference: localProfile.cardio_preference,
        preferred_rest_days: localProfile.preferred_rest_days || [],
      };
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/generate-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiProfile),
      });
      if (!response.ok) {
        setError("Failed to generate new workout template.");
        setSaving(false);
        return;
      }
      const template = await response.json();
      // Remove existing workout_templates for this user
      const { error: deleteError } = await supabase
        .from("workout_templates")
        .delete()
        .eq("user_id", userId);
      if (deleteError) {
        setError("Failed to delete old templates.");
        setSaving(false);
        return;
      }
      // Insert new templates
      const inserts = template.workouts.map((workout) => ({
        user_id: userId,
        day_of_week: workout.day,
        workout_name: workout.type || workout.workout_name || "",
        exercises: workout.exercises,
        muscle_group: workout.muscle_group,
      }));
      const { error: insertError } = await supabase
        .from("workout_templates")
        .insert(inserts);
      if (insertError) {
        setError("Failed to save new templates.");
        setSaving(false);
        return;
      }
      setSuccess(true);
      // Refresh parent workouts/profile
      if (refreshTemplates) refreshTemplates();
      setTimeout(() => {
        setSaving(false);
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  // For rest days UI
  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const maxRestDays = 7 - Number(localProfile.days_per_week || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white text-black p-6 rounded-lg w-11/12 max-w-md">
        <h2 className="text-lg font-bold mb-4">Edit Preferences</h2>
        <form
          onSubmit={handleSaveAndRegenerate}
          className="mb-4 space-y-3 text-sm"
        >
          {/* --- Only show the required fields --- */}
          <div>
            <label className="font-semibold block mb-1">Experience Level</label>
            <select
              value={localProfile.experience || ""}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, experience: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Experience Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1">Primary Goal</label>
            <select
              value={localProfile.goal || ""}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, goal: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Goal</option>
              <option value="fat_loss">Fat Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="maintenance">Maintenance</option>
              <option value="athletic_performance">Athletic Performance</option>
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1">Equipment</label>
            <select
              value={localProfile.equipment || ""}
              onChange={(e) =>
                setLocalProfile((p) => ({ ...p, equipment: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Equipment Access</option>
              <option value="full_gym">Full Gym</option>
              <option value="dumbbells_only">Dumbbells Only</option>
              <option value="bodyweight_only">Bodyweight Only</option>
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1">
              Cardio Preference
            </label>
            <select
              value={localProfile.cardio_preference || ""}
              onChange={handleCardioPrefChange}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="none">None (Strength Only)</option>
              <option value="light">Light (Warmups or Finishers)</option>
              <option value="moderate">Moderate (1–2 Sessions/Week)</option>
              <option value="high">High (Daily Conditioning)</option>
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1">Days per Week</label>
            <input
              type="number"
              min="1"
              max="7"
              value={localProfile.days_per_week || ""}
              onChange={handleDaysPerWeekChange}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="font-semibold block mb-1">
              Preferred Rest Days
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`px-3 py-1 rounded-full ${
                    localProfile.preferred_rest_days?.includes(day)
                      ? "bg-pink-600 text-white"
                      : localProfile.preferred_rest_days?.length >= maxRestDays
                      ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                      : "bg-gray-700 text-white"
                  }`}
                  onClick={() => handleRestDayToggle(day)}
                  disabled={
                    !localProfile.preferred_rest_days?.includes(day) &&
                    localProfile.preferred_rest_days?.length >= maxRestDays
                  }
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-1">
              Select up to {maxRestDays} rest day{maxRestDays !== 1 ? "s" : ""}
            </p>
          </div>
          {error && <div className="text-red-600 text-xs">{error}</div>}
          {success && (
            <div className="text-green-600 text-xs">
              Saved! Regenerated your plan.
            </div>
          )}
          <div className="flex justify-center items-center gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-2xl bg-gray-300 text-black hover:bg-gray-400 font-semibold flex-1"
              style={{ minWidth: "0" }}
              disabled={saving}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-semibold flex-1 whitespace-nowrap min-w-[140px]"
              style={{ minWidth: "0" }}
            >
              {saving ? "Saving…" : "Save & Regenerate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
