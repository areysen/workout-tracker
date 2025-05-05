// src/LoginView.js
"use client";
export const dynamic = "force-dynamic";
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginView() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signInWithMagicLink, signInWithProvider } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await signInWithMagicLink(email);
    const { error } = result;
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "✅ Check your inbox for the magic link!",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#242B2F] p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#343E44] p-6 rounded-lg w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-semibold text-white text-center">
          Welcome Back
        </h1>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => signInWithProvider("google")}
            className="w-full flex items-center justify-center py-2 rounded-2xl bg-white border border-gray-300 hover:bg-gray-50 transition"
          >
            <Image
              src="/assets/google-logo.png"
              alt="Google logo"
              width={20}
              height={20}
              className="mr-2"
            />
            Continue with Google
          </button>
        </div>
        <div className="flex items-center my-4">
          <hr className="flex-grow border-gray-600" />
          <span className="px-3 text-gray-400">or</span>
          <hr className="flex-grow border-gray-600" />
        </div>
        {message && (
          <div
            className={`text-sm ${
              message.type === "error" ? "text-red-400" : "text-green-400"
            }`}
          >
            {message.text}
          </div>
        )}
        <input
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-2xl bg-[#242B2F] text-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-700 text-white shadow-glow hover:shadow-glow-hover transition"
        >
          {loading ? "Sending…" : "Email me a link"}
          {loading ? "Sending…" : isSignUp ? "Sign Up" : "Email me a link"}
        </button>
      </form>
    </div>
  );
}
