// src/components/BackButton.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BackButton({ fallback = "/", label = "← Back" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.state?.fromTodayView) {
      navigate("/");
    } else if (location.state?.previousViewMode) {
      navigate("/calendar", {
        state: {
          previousViewMode: location.state.previousViewMode,
          previousSelectedDate: location.state.previousSelectedDate,
        },
      });
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="text-sm border border-white px-3 py-1 rounded hover:bg-white/10"
    >
      {label}
    </button>
  );
}
