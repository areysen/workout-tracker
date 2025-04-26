// src/components/BackButton.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BackButton({ fallback = "/", label = "← Back", to }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (
      location.state?.fromPreview &&
      location.pathname.includes("/log/")
    ) {
      // If on LogWorkoutView and fromPreview, go back to Preview but clear the state
      navigate(`/preview/${location.state.previousSelectedDate}`, {
        state: undefined,
        replace: true,
      });
    } else if (location.state?.previousViewMode) {
      navigate("/calendar", {
        state: {
          previousViewMode: location.state.previousViewMode,
          previousSelectedDate: location.state.previousSelectedDate,
        },
      });
    } else {
      navigate(-1); // fallback normal browser back
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
