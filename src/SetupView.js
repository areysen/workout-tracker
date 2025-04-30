// src/SetupView.js
import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { formatDateWithOptions } from "./utils";

const getMaxDOB = () => {
  const today = new Date();
  today.setFullYear(today.getFullYear() - 13);
  return today.toISOString().split("T")[0];
};

export default function SetupView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dob, setDob] = useState("");
  const [unitSystem, setUnitSystem] = useState("imperial");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weight, setWeight] = useState("");
  const [experience, setExperience] = useState("");
  const [goal, setGoal] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("");
  const [equipment, setEquipment] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [dirty, setDirty] = useState({});

  // On mount: fetch profile if exists, and populate state
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setName(data.full_name || "");
        setDob(data.birth_date || "");
        setExperience(data.experience || "");
        setGoal(data.goal || "");
        setDaysPerWeek(data.days_per_week?.toString() || "");
        setEquipment(data.equipment || "");

        setUnitSystem(data.unit_preference || "imperial");
        if (data.unit_preference === "imperial") {
          const totalInches = Math.round(data.height_cm / 2.54);
          setHeightFeet(Math.floor(totalInches / 12).toString());
          setHeightInches((totalInches % 12).toString());
          setWeight(Math.round(data.weight_kg * 2.20462).toString());
        } else {
          setHeightCm(data.height_cm?.toString() || "");
          setWeight(data.weight_kg?.toString() || "");
        }
      }

      if (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    fetchProfile();
  }, [user]);

  // Clamp weight input based on unit system
  const handleWeightChange = (e) => {
    const val = e.target.value;
    const max = unitSystem === "imperial" ? 999 : 453;
    if (val === "" || Number(val) <= max) {
      setWeight(val);
    }
  };

  const getAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleBlur = (field, value) => {
    setDirty((prev) => ({ ...prev, [field]: prev[field] || value }));
  };

  // Helper function to generate workout template from AI endpoint
  const generateWorkoutTemplate = async (profile) => {
    const response = await fetch("/api/generate-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!response.ok) throw new Error("Failed to generate workout");
    return await response.json();
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (step !== 4) return;
    setLoading(true);

    // Calculate height_cm and weight_kg based on unit system
    let height_cm =
      unitSystem === "imperial"
        ? Math.round((Number(heightFeet) * 12 + Number(heightInches)) * 2.54)
        : Number(heightCm);

    let weight_kg =
      unitSystem === "imperial"
        ? Math.round(Number(weight) / 2.20462)
        : Number(weight);

    // Upsert the profile (insert or update)
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        full_name: name,
        first_name: name.split(" ")[0],
        birth_date: dob,
        height_cm,
        weight_kg,
        unit_preference: unitSystem,
        experience,
        goal,
        days_per_week: daysPerWeek,
        equipment,
      },
      { onConflict: ["user_id"] }
    );
    if (profileError) {
      console.error("Error upserting profile:", profileError);
      setLoading(false);
      return;
    }

    // Update auth metadata & refresh session (optional)
    await supabase.auth.updateUser({ data: { full_name: name } });
    await supabase.auth.getSession();

    // ---- Generate workout plan and store in workout_templates ----
    try {
      const profile = {
        name,
        experience,
        goal,
        days_per_week: daysPerWeek,
        equipment,
        height_cm,
        weight_kg,
        unit_preference: unitSystem,
      };
      const template = await generateWorkoutTemplate(profile);
      console.log("🎯 AI Generated Template:", template);

      const { error: templateError } = await supabase
        .from("workout_templates")
        .insert([
          {
            user_id: user.id,
            template,
          },
        ]);

      if (templateError) {
        console.error("Failed to save template:", templateError);
      }
    } catch (err) {
      console.error("Error generating template:", err);
    }
    // ------------------------------------------------------------

    setLoading(false);
    navigate("/", { replace: true });
  };

  const isStepValid = () => {
    if (step === 1)
      return (
        name &&
        dob &&
        getAge(dob) >= 13 &&
        (unitSystem === "metric" ? heightCm : heightFeet && heightInches) &&
        weight
      );
    if (step === 2) return experience && goal;
    if (step === 3) return daysPerWeek && equipment;
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#242B2F] p-4">
      <form className="bg-[#343E44] p-6 rounded-lg w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-white text-center">
          Welcome!
        </h1>
        <p className="text-gray-400 text-sm">
          Let’s set you up with your first workout plan.
        </p>
        {step === 1 && (
          <>
            <p className="text-white text-sm">Step 1: Tell us about you</p>
            <label className="block text-sm text-white">Name</label>
            <input
              type="text"
              placeholder="Your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name", name)}
              className={`text-base w-full px-3 py-2 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                dirty.name && !name ? "border border-red-500" : ""
              }`}
            />
            <label className="block text-sm text-white">Date of Birth</label>
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              onBlur={() => handleBlur("dob", dob)}
              max={getMaxDOB()}
              className={`text-base w-full px-3 py-2 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                dirty.dob && (!dob || getAge(dob) < 13)
                  ? "border border-red-500"
                  : ""
              }`}
            />
            {dirty.dob && (!dob || getAge(dob) < 13) && (
              <p className="text-xs text-red-400 mt-1">
                Must be 13 years or older.
              </p>
            )}
            <label className="block text-sm text-white">Preferred Units</label>
            <select
              value={unitSystem}
              onChange={(e) => setUnitSystem(e.target.value)}
              onBlur={() => handleBlur("unitSystem", unitSystem)}
              className={`text-base w-full px-3 py-2 pr-8 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                dirty.unitSystem && !unitSystem ? "border border-red-500" : ""
              }`}
            >
              <option value="imperial">Imperial (ft/in)</option>
              <option value="metric">Metric (cm)</option>
            </select>
            <label className="block text-sm text-white">Height</label>
            {unitSystem === "imperial" ? (
              <div className="flex space-x-2">
                <select
                  value={heightFeet}
                  onChange={(e) => setHeightFeet(e.target.value)}
                  onBlur={() => handleBlur("heightFeet", heightFeet)}
                  className={`text-base w-1/2 px-3 py-2 pr-8 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                    dirty.heightFeet && !heightFeet
                      ? "border border-red-500"
                      : ""
                  }`}
                  required
                >
                  <option value="">Feet</option>
                  {[...Array(8)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <select
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  onBlur={() => handleBlur("heightInches", heightInches)}
                  className={`text-base w-1/2 px-3 py-2 pr-8 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                    dirty.heightInches && !heightInches
                      ? "border border-red-500"
                      : ""
                  }`}
                  required
                >
                  <option value="">Inches</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input
                type="number"
                placeholder="Height (cm)"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                onBlur={() => handleBlur("heightCm", heightCm)}
                className={`text-base w-full px-3 py-2 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                  dirty.heightCm && !heightCm ? "border border-red-500" : ""
                }`}
                required
              />
            )}
            <label className="block text-sm text-white">Weight</label>
            {unitSystem === "imperial" ? (
              <input
                type="number"
                placeholder="Weight (lbs)"
                required
                value={weight}
                max={unitSystem === "imperial" ? 999 : 453}
                onChange={handleWeightChange}
                onBlur={() => handleBlur("weight", weight)}
                className={`text-base w-full px-3 py-2 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                  dirty.weight && !weight ? "border border-red-500" : ""
                }`}
              />
            ) : (
              <input
                type="number"
                placeholder="Weight (kg)"
                required
                value={weight}
                max={unitSystem === "imperial" ? 999 : 453}
                onChange={handleWeightChange}
                onBlur={() => handleBlur("weight", weight)}
                className={`text-base w-full px-3 py-2 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                  dirty.weight && !weight ? "border border-red-500" : ""
                }`}
              />
            )}
          </>
        )}
        {step === 2 && (
          <>
            <p className="text-white text-sm">Step 2: Define your goals</p>
            <label className="block text-sm text-white">Experience Level</label>
            <select
              required
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              onBlur={() => handleBlur("experience", experience)}
              className={`text-base w-full px-3 py-2 pr-8 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                dirty.experience && !experience ? "border border-red-500" : ""
              }`}
            >
              <option value="">Experience Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <label className="block text-sm text-white">Primary Goal</label>
            <select
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onBlur={() => handleBlur("goal", goal)}
              className={`text-base w-full px-3 py-2 pr-8 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                dirty.goal && !goal ? "border border-red-500" : ""
              }`}
            >
              <option value="">Primary Goal</option>
              <option value="fat_loss">Fat Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="maintenance">Maintenance</option>
              <option value="athletic_performance">Athletic Performance</option>
            </select>
          </>
        )}
        {step === 3 && (
          <>
            <p className="text-white text-sm">Step 3: Workout preferences</p>
            <label className="block text-sm text-white">Days per Week</label>
            <input
              type="number"
              min="1"
              max="7"
              placeholder="Days per Week"
              required
              value={daysPerWeek}
              onChange={(e) => {
                // Prevent entering values outside 1-7
                const val = e.target.value;
                if (val === "") {
                  setDaysPerWeek("");
                  return;
                }
                const num = Number(val);
                if (num >= 1 && num <= 7) {
                  setDaysPerWeek(val);
                }
              }}
              onBlur={() => handleBlur("daysPerWeek", daysPerWeek)}
              onWheel={(e) => e.target.blur()}
              className={`text-base w-full px-3 py-2 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                dirty.daysPerWeek && !daysPerWeek ? "border border-red-500" : ""
              }`}
            />
            <label className="block text-sm text-white">Equipment Access</label>
            <select
              required
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              onBlur={() => handleBlur("equipment", equipment)}
              className={`text-base w-full px-3 py-2 pr-8 rounded-2xl bg-[#242B2F] text-white focus:outline-none ${
                dirty.equipment && !equipment ? "border border-red-500" : ""
              }`}
            >
              <option value="">Equipment Access</option>
              <option value="full_gym">Full Gym</option>
              <option value="dumbbells_only">Dumbbells Only</option>
              <option value="bodyweight_only">Bodyweight Only</option>
            </select>
          </>
        )}
        {step === 4 && (
          <>
            <p className="text-white text-sm mb-2">
              Step 4: Review your selections
            </p>
            <div className="text-white text-sm space-y-2">
              <p>
                <strong>Name:</strong> {name}
              </p>
              <p>
                <strong>Date of Birth:</strong>{" "}
                {dob
                  ? formatDateWithOptions(dob, {
                      month: "long",
                      day: "numeric",
                      includeYear: true,
                    })
                  : ""}
              </p>
              <p>
                <strong>Preferred Units:</strong>{" "}
                {unitSystem === "imperial"
                  ? "Imperial (lbs/ft)"
                  : "Metric (kg/cm)"}
              </p>
              <p>
                <strong>Height:</strong>{" "}
                {unitSystem === "imperial"
                  ? `${heightFeet}'${heightInches}"`
                  : `${heightCm} cm`}
              </p>
              <p>
                <strong>Weight:</strong> {weight}{" "}
                {unitSystem === "imperial" ? "lbs" : "kg"}
              </p>
              <p>
                <strong>Experience:</strong> {experience}
              </p>
              <p>
                <strong>Goal:</strong>{" "}
                {
                  {
                    fat_loss: "Fat Loss",
                    muscle_gain: "Muscle Gain",
                    maintenance: "Maintenance",
                    athletic_performance: "Athletic Performance",
                  }[goal]
                }
              </p>
              <p>
                <strong>Days per Week:</strong> {daysPerWeek}
              </p>
              <p>
                <strong>Equipment:</strong>{" "}
                {
                  {
                    full_gym: "Full Gym",
                    dumbbells_only: "Dumbbells Only",
                    bodyweight_only: "Bodyweight Only",
                  }[equipment]
                }
              </p>
            </div>
          </>
        )}

        <div className="flex justify-between pt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-2xl bg-[#555] text-white"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                setDirty((prev) => {
                  const newDirty = { ...prev };
                  if (step === 1) {
                    newDirty.name = true;
                    newDirty.dob = true;
                    newDirty.unitSystem = true;
                    if (unitSystem === "imperial") {
                      newDirty.heightFeet = true;
                      newDirty.heightInches = true;
                    } else {
                      newDirty.heightCm = true;
                    }
                    newDirty.weight = true;
                  } else if (step === 2) {
                    newDirty.experience = true;
                    newDirty.goal = true;
                  } else if (step === 3) {
                    newDirty.daysPerWeek = true;
                    newDirty.equipment = true;
                  }
                  return newDirty;
                });
                if (isStepValid()) setStep(step + 1);
              }}
              disabled={!isStepValid()}
              className={`px-4 py-2 rounded-2xl text-white ${
                isStepValid()
                  ? "bg-gradient-to-r from-pink-500 to-pink-700"
                  : "bg-gray-600 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateProfile}
              disabled={loading}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-700 text-white"
            >
              {loading ? "Setting up…" : "Get Started"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
