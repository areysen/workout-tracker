// src/components/BackButton.js
import React from "react";
import { useRouter } from "next/navigation";

export default function BackButton({ fallback = "/", label = "← Back", to }) {
  const router = useRouter();

  const handleBack = () => {
    if (to) {
      router.push(to);
    } else {
      router.back(); // fallback to browser-like back
    }
  };

  return (
    <button
      onClick={handleBack}
      className="px-3 py-1 bg-gradient-to-r from-pink-500 to-pink-700 text-white rounded-2xl shadow-glow hover:shadow-glow-hover transition duration-300 text-sm"
    >
      {label}
    </button>
  );
}
