// src/LoginView.js
import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import googleLogo from "./assets/google-logo.png";

export default function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const {
    signInWithMagicLink,
    signInWithProvider,
    signInWithEmailPassword,
    signUpWithEmailPassword,
  } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let result;
    if (isSignUp && password) {
      result = await signUpWithEmailPassword(email, password);
    } else if (password) {
      result = await signInWithEmailPassword(email, password);
    } else {
      result = await signInWithMagicLink(email);
    }
    const { error } = result;
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      if (isSignUp) {
        setMessage({
          type: "success",
          text: "✅ Check your inbox to confirm your email!",
        });
        setIsSignUp(false);
      } else {
        setMessage({
          type: "success",
          text: password
            ? "✅ Signed in successfully!"
            : "✅ Check your inbox for the magic link!",
        });
      }
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
            <img src={googleLogo} alt="Google logo" className="w-5 h-5 mr-2" />
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
        <input
          type="password"
          placeholder="Password (leave blank for magic link)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-2xl bg-[#242B2F] text-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-700 text-white shadow-glow hover:shadow-glow-hover transition"
        >
          {loading
            ? isSignUp
              ? "Signing Up…"
              : password
              ? "Signing In…"
              : "Sending…"
            : isSignUp
            ? "Sign Up"
            : password
            ? "Sign In"
            : "Email me a link"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-400 text-center">
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <button
          type="button"
          className="underline"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </button>
      </p>
    </div>
  );
}
