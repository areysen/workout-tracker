// src/SetupView.js
import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function SetupView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    // 1) Create your own profile row
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        full_name: name,
        first_name: name.split(" ")[0],
      });
    if (profileError) {
      console.error("Error creating profile:", profileError);
      setLoading(false);
      return;
    }
    // 2) Insert one or more starter templates
    const { error } = await supabase.from("templates").insert([
      { user_id: user.id, name: "Full-Body Beginner" },
      // …add more default templates if you like
    ]);
    setLoading(false);
    if (!error && profileData) {
      navigate("/", { replace: true });
    } else {
      console.error(error);
      // show an error message…
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#242B2F] p-4">
      <form
        onSubmit={handleCreateProfile}
        className="bg-[#343E44] p-6 rounded-lg w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-semibold text-white text-center">
          Welcome!
        </h1>
        <p className="text-gray-400 text-sm">
          Let’s set you up with your first workout plan.
        </p>
        <input
          type="text"
          placeholder="Your name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-2xl bg-[#242B2F] text-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-700 text-white transition"
        >
          {loading ? "Setting up…" : "Get Started"}
        </button>
      </form>
    </div>
  );
}
