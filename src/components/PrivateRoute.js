import React from "react";
import { useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

export default function PrivateRoute({ children }) {
  const { session, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session && user) {
      supabase
        .from("templates")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .then(({ count }) => {
          if (count === 0) {
            navigate("/setup", { replace: true });
          }
        });
    }
  }, [session, user, navigate]);

  if (session === undefined) return null;
  if (!session) return <Navigate to="/login" replace />;

  return children;
}
