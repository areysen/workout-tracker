// src/AuthCallback.js
import { useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "next/navigation";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // once Supabase parses the link and fires SIGNED_IN, send them home
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // clean out any tokens/params from the URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 2000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#242B2F] p-4">
      <div className="text-center">
        {/* Spinner */}
        <div className="loader mb-4 animate-spin border-4 border-t-pink-500 border-gray-600 rounded-full w-12 h-12 mx-auto"></div>
        <p className="text-white text-lg">Logging you in…</p>
      </div>
    </div>
  );
}
