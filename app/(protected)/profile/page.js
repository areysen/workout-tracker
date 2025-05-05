"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [unitPreference, setUnitPreference] = useState("metric");
  const [heightCm, setHeightCm] = useState("");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [workoutDays, setWorkoutDays] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [equipment, setEquipment] = useState("");
  const [cardioPreference, setCardioPreference] = useState("");
  const [preferredRestDays, setPreferredRestDays] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showRegeneratePrompt, setShowRegeneratePrompt] = useState(false);

  // Helper for formatting date of birth
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Option maps as in setup flow
  const fitnessGoalOptions = [
    { value: "fat_loss", label: "Fat Loss" },
    { value: "muscle_gain", label: "Muscle Gain" },
    { value: "maintenance", label: "Maintenance" },
    { value: "athletic_performance", label: "Athletic Performance" },
  ];
  const experienceLevelOptions = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];
  const equipmentOptions = [
    { value: "full_gym", label: "Full Gym" },
    { value: "dumbbells_only", label: "Dumbbells Only" },
    { value: "bodyweight_only", label: "Bodyweight Only" },
  ];

  const restDayOptions = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name, birth_date, height_cm, weight_kg, unit_preference, experience, goal, days_per_week, equipment, cardio_preference, preferred_rest_days"
        )
        .eq("user_id", (await supabase.auth.getUser()).data.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setFullName(data.full_name || "");
        setBirthDate(data.birth_date ? data.birth_date.substring(0, 10) : "");
        setUnitPreference(data.unit_preference || "metric");
        // Set height/weight according to unit preference
        if (data.unit_preference === "imperial") {
          if (data.height_cm) {
            const totalInches = data.height_cm / 2.54;
            const feet = Math.floor(totalInches / 12);
            const inches = Math.round(totalInches % 12);
            setHeightFeet(feet.toString());
            setHeightInches(inches.toString());
            setHeightCm("");
          }
          if (data.weight_kg) {
            const lbs = Math.round(data.weight_kg * 2.20462);
            setWeightLbs(lbs.toString());
            setWeightKg("");
          }
        } else {
          setHeightCm(
            data.height_cm !== null && data.height_cm !== undefined
              ? data.height_cm.toString()
              : ""
          );
          setHeightFeet("");
          setHeightInches("");
          setWeightKg(
            data.weight_kg !== null && data.weight_kg !== undefined
              ? data.weight_kg.toString()
              : ""
          );
          setWeightLbs("");
        }
        setFitnessGoal(data.goal || "");
        setWorkoutDays(data.days_per_week?.toString() || "");
        setExperienceLevel(data.experience || "");
        setEquipment(data.equipment || "");
        setCardioPreference(data.cardio_preference || "");
        setPreferredRestDays(
          Array.isArray(data.preferred_rest_days)
            ? data.preferred_rest_days
            : []
        );
      }
    };

    fetchProfile();
  }, []);

  // Convert height/weight automatically when unitPreference changes
  useEffect(() => {
    // Only convert if there is a value to convert
    if (unitPreference === "imperial" && heightCm) {
      // Convert to imperial and clear metric
      const cmNum = parseFloat(heightCm);
      if (!isNaN(cmNum)) {
        const totalInches = cmNum / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = Math.round(totalInches % 12);
        setHeightFeet(feet.toString());
        setHeightInches(inches.toString());
        setHeightCm("");
      }
    }
    if (unitPreference === "imperial" && weightKg) {
      const kgNum = parseFloat(weightKg);
      if (!isNaN(kgNum)) {
        const lbs = Math.round(kgNum * 2.20462);
        setWeightLbs(lbs.toString());
        setWeightKg("");
      }
    }
    if (unitPreference === "metric" && (heightFeet || heightInches)) {
      // Convert to metric and clear imperial
      const feetNum = parseInt(heightFeet, 10);
      const inchesNum = parseInt(heightInches, 10);
      if (!isNaN(feetNum) && !isNaN(inchesNum)) {
        const cm = feetNum * 30.48 + inchesNum * 2.54;
        setHeightCm(Math.round(cm).toString());
        setHeightFeet("");
        setHeightInches("");
      }
    }
    if (unitPreference === "metric" && weightLbs) {
      const lbsNum = parseFloat(weightLbs);
      if (!isNaN(lbsNum)) {
        const kg = lbsNum / 2.20462;
        setWeightKg(Math.round(kg).toString());
        setWeightLbs("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitPreference]);

  const handleRestDayToggle = (day) => {
    if (preferredRestDays.includes(day)) {
      setPreferredRestDays(preferredRestDays.filter((d) => d !== day));
    } else {
      // Only allow up to (7 - workoutDays) rest days
      const maxRestDays = 7 - (parseInt(workoutDays, 10) || 0);
      if (preferredRestDays.length < maxRestDays) {
        setPreferredRestDays([...preferredRestDays, day]);
      }
    }
  };

  const convertHeightToCm = () => {
    if (unitPreference === "imperial") {
      const feetNum = parseInt(heightFeet, 10);
      const inchesNum = parseInt(heightInches, 10);
      if (!isNaN(feetNum) && !isNaN(inchesNum)) {
        return Math.floor(feetNum * 30.48 + inchesNum * 2.54);
      }
      return null;
    } else {
      const cmNum = parseFloat(heightCm);
      return !isNaN(cmNum) ? Math.floor(cmNum) : null;
    }
  };

  const convertWeightToKg = () => {
    if (unitPreference === "imperial") {
      const lbsNum = parseFloat(weightLbs);
      return !isNaN(lbsNum) ? Math.floor(lbsNum / 2.20462) : null;
    } else {
      const kgNum = parseFloat(weightKg);
      return !isNaN(kgNum) ? Math.floor(kgNum) : null;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const heightCmVal = convertHeightToCm();
      const weightKgVal = convertWeightToKg();

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          birth_date: birthDate || null,
          height_cm: heightCmVal,
          weight_kg: weightKgVal,
          unit_preference: unitPreference,
          experience: experienceLevel,
          goal: fitnessGoal,
          days_per_week: parseInt(workoutDays, 10),
          equipment,
          cardio_preference: cardioPreference,
          preferred_rest_days: preferredRestDays,
        })
        .eq("user_id", (await supabase.auth.getUser()).data.user.id);

      if (error) {
        throw error;
      }

      alert("Preferences saved!");
      setShowRegeneratePrompt(true);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Error saving preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setShowRegeneratePrompt(false);
    try {
      // Fetch the current profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", (await supabase.auth.getUser()).data.user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        throw new Error("Profile not found");
      }

      const apiProfile = {
        name: profileData.full_name || profileData.name || "",
        experience: profileData.experience,
        goal: profileData.goal,
        days_per_week: profileData.days_per_week,
        equipment: profileData.equipment,
        height_cm: profileData.height_cm,
        weight_kg: profileData.weight_kg,
        unit_preference: profileData.unit_preference,
        cardio_preference: profileData.cardio_preference,
        preferred_rest_days: profileData.preferred_rest_days || [],
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/generate-template`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiProfile),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to regenerate template");
      }

      const template = await response.json();

      const { error: deleteError } = await supabase
        .from("workout_templates")
        .delete()
        .eq("user_id", profileData.user_id);

      if (deleteError) {
        throw new Error("Failed to delete old templates.");
      }

      const inserts = template.workouts.map((workout) => ({
        user_id: profileData.user_id,
        day_of_week: workout.day,
        workout_name: workout.type || workout.workout_name || "",
        exercises: workout.exercises,
        muscle_group: workout.muscle_group,
      }));

      const { error: insertError } = await supabase
        .from("workout_templates")
        .insert(inserts);

      if (insertError) {
        throw new Error("Failed to save new templates.");
      }

      router.push("/confirm-template");
    } catch (err) {
      console.error("Error regenerating template:", err);
      alert("Failed to regenerate workout template.");
    }
  };

  const handleCancelRegenerate = () => {
    setShowRegeneratePrompt(false);
  };

  // Helper for display
  const getGoalLabel = (val) =>
    fitnessGoalOptions.find((o) => o.value === val)?.label ||
    (val ? val.charAt(0).toUpperCase() + val.slice(1) : "");
  const getExperienceLabel = (val) =>
    experienceLevelOptions.find((o) => o.value === val)?.label ||
    (val ? val.charAt(0).toUpperCase() + val.slice(1) : "");
  const getEquipmentLabel = (val) =>
    equipmentOptions.find((o) => o.value === val)?.label ||
    (val ? val.charAt(0).toUpperCase() + val.slice(1) : "");
  // Cardio label helper (not used for dropdown, but for display if needed)
  // The options are hardcoded in the select below.
  const getCardioLabel = (val) => {
    switch (val) {
      case "none":
        return "None (Strength Only)";
      case "light":
        return "Light (Warmups or Finishers)";
      case "moderate":
        return "Moderate (1–2 Sessions/Week)";
      case "high":
        return "High (Daily Conditioning)";
      default:
        return val ? val.charAt(0).toUpperCase() + val.slice(1) : "";
    }
  };

  // Rest day button disable logic
  const maxRestDays = 7 - (parseInt(workoutDays, 10) || 0);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
      </div>
      <div className="space-y-10 text-white">
        {/* Profile Info */}
        <div className="bg-[#2C353C] rounded-2xl p-6 space-y-6 shadow-md border border-[#3C474F]">
          <h2 className="text-lg font-semibold mb-2">Profile Information</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Name</label>
            <div
              className="bg-[#343E44] px-3 py-2 rounded text-white border border-[#818C91] cursor-not-allowed bg-opacity-70"
              aria-disabled="true"
              title="Read-only"
            >
              {fullName}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Date of Birth</label>
            <div
              className="bg-[#343E44] px-3 py-2 rounded text-white border border-[#818C91] cursor-not-allowed bg-opacity-70"
              aria-disabled="true"
              title="Read-only"
            >
              {formatDate(birthDate)}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-[#2C353C] rounded-2xl p-6 space-y-6 shadow-md border border-[#3C474F]">
          <h2 className="text-lg font-semibold mb-2">Preferences</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Unit System</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 px-3 py-2 rounded border text-white transition ${
                  unitPreference === "imperial"
                    ? "bg-pink-600 border-pink-600"
                    : "border-[#818C91] bg-[#343E44]"
                }`}
                onClick={() => setUnitPreference("imperial")}
              >
                Imperial
              </button>{" "}
              <button
                type="button"
                className={`flex-1 px-3 py-2 rounded border text-white transition ${
                  unitPreference === "metric"
                    ? "bg-pink-600 border-pink-600"
                    : "border-[#818C91] bg-[#343E44]"
                }`}
                onClick={() => setUnitPreference("metric")}
              >
                Metric
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Height</label>
            {unitPreference === "imperial" ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                  className="w-1/2 border border-[#818C91] bg-[#343E44] px-3 py-2 rounded text-white"
                  placeholder="Feet"
                />
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  className="w-1/2 border border-[#818C91] bg-[#343E44] px-3 py-2 rounded text-white"
                  placeholder="Inches"
                />
              </div>
            ) : (
              <input
                type="number"
                min="0"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full border border-[#818C91] bg-[#343E44] px-3 py-2 rounded text-white"
                placeholder="Centimeters"
              />
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Weight</label>
            {unitPreference === "imperial" ? (
              <input
                type="number"
                min="0"
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
                className="w-full border border-[#818C91] bg-[#343E44] px-3 py-2 rounded text-white"
                placeholder="Pounds"
              />
            ) : (
              <input
                type="number"
                min="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full border border-[#818C91] bg-[#343E44] px-3 py-2 rounded text-white"
                placeholder="Kilograms"
              />
            )}
          </div>
        </div>

        {/* Training Setup */}
        <div className="bg-[#2C353C] rounded-2xl p-6 space-y-6 shadow-md border border-[#3C474F]">
          <h2 className="text-lg font-semibold mb-2">Training Setup</h2>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Grouped: Fitness Goal & Experience Level */}
            <div className="flex-1 bg-[#343E44] rounded-lg p-4 space-y-4 border border-[#818C91]">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Fitness Goal
                </label>
                <select
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value)}
                  className="w-full border border-[#818C91] bg-[#232B32] px-3 py-2 rounded text-white"
                >
                  <option value="">Select goal...</option>
                  {fitnessGoalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full border border-[#818C91] bg-[#232B32] px-3 py-2 rounded text-white"
                >
                  <option value="">Select experience...</option>
                  {experienceLevelOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Workout Days */}
            <div className="flex-1 space-y-2">
              <label className="block text-sm font-medium">
                Workout Days per Week
              </label>
              <input
                type="number"
                min="0"
                max="7"
                value={workoutDays}
                onChange={(e) => setWorkoutDays(e.target.value)}
                className="w-full border border-[#818C91] bg-[#343E44] px-3 py-2 rounded text-white"
                placeholder="Number of days"
              />
            </div>
          </div>
          {/* Equipment */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Equipment Access
            </label>
            <select
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="w-full border border-[#818C91] bg-[#343E44] px-3 py-2 rounded text-white"
            >
              <option value="">Select equipment...</option>
              {equipmentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {/* Cardio Preference */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Cardio Preference
            </label>
            <select
              value={cardioPreference}
              onChange={(e) => setCardioPreference(e.target.value)}
              className="w-full border border-[#818C91] bg-[#343E44] px-3 py-2 rounded text-white"
            >
              <option value="">Cardio Preference</option>
              <option value="none">None (Strength Only)</option>
              <option value="light">Light (Warmups or Finishers)</option>
              <option value="moderate">Moderate (1–2 Sessions/Week)</option>
              <option value="high">High (Daily Conditioning)</option>
            </select>
          </div>
          {/* Preferred Rest Days */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Preferred Rest Days
            </label>
            <div className="flex flex-wrap gap-2">
              {restDayOptions.map((day) => {
                const disabled =
                  !preferredRestDays.includes(day) &&
                  preferredRestDays.length >= maxRestDays;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleRestDayToggle(day)}
                    className={`px-3 py-1 rounded-full border transition ${
                      preferredRestDays.includes(day)
                        ? "bg-pink-600 border-pink-600 text-white"
                        : "border-[#818C91] text-[#818C91] bg-transparent"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={disabled}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#818C91] mt-1">
              {maxRestDays === 0
                ? "All days are workout days."
                : `Select up to ${maxRestDays} rest day${
                    maxRestDays > 1 ? "s" : ""
                  }.`}
            </p>
          </div>
        </div>
        {/* Save Button */}
        <div className="flex gap-4 justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 border border-pink-600 text-white rounded bg-pink-600 hover:bg-pink-700 transition disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      {/* Regenerate Modal */}
      {showRegeneratePrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-[#1F2937] p-6 rounded shadow-lg max-w-sm w-full text-white space-y-4">
            <p>
              Preferences saved! Would you like to regenerate your AI workout
              template now?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelRegenerate}
                className="px-4 py-2 border border-[#818C91] rounded text-[#818C91] hover:border-pink-600 hover:text-pink-600 transition"
              >
                Later
              </button>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 bg-pink-600 rounded text-white hover:bg-pink-700 transition"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
