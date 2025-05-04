// src/AuthCallback.js
"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

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
          router.replace("/");
        }, 2000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

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
