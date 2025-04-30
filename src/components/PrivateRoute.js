import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

export default function PrivateRoute({ children }) {
  const { session, user } = useAuth();
  const [hasProfile, setHasProfile] = useState(undefined);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (session && user && hasProfile === undefined) {
      setCheckingProfile(true);
      supabase
        .from("profiles")
        .select("user_id", { head: true, count: "exact" })
        .eq("user_id", user.id)
        .then(({ count }) => {
          setHasProfile(count > 0);
          setCheckingProfile(false);
        })
        .catch(() => {
          setHasProfile(false);
          setCheckingProfile(false);
        });
    }
    // re-run this fetch any time we sign in, change user, *or* move around routes
  }, [session, user, location.pathname, hasProfile]);

  if (checkingProfile) return null;
  // only redirect to /setup if you *don’t* already have one and you’re not *already* on /setup
  if (
    session &&
    user &&
    hasProfile === false &&
    location.pathname !== "/setup"
  ) {
    return <Navigate to="/setup" replace />;
  }
  if (session === undefined) return null;
  if (!session) return <Navigate to="/login" replace />;

  return children;
}
