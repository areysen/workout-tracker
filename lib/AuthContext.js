"use client";
export const dynamic = "force-dynamic";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [user, setUser] = useState(undefined);
  const [hasProfile, setHasProfile] = useState(undefined);

  useEffect(() => {
    // Restore any existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Don't check profile here to prevent unnecessary queries
    });
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const checkProfile = async () => {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single();

          if (error || !data) {
            setHasProfile(false);
          } else {
            setHasProfile(true);
          }
        };
        checkProfile();
      } else {
        setHasProfile(undefined);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink = (email) =>
    supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth-callback`,
      },
    });

  const signInWithProvider = (provider) =>
    supabase.auth.signInWithOAuth({ provider });

  const signInWithEmailPassword = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUpWithEmailPassword = (email, password) =>
    supabase.auth.signUp(
      { email, password },
      { emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth-callback` }
    );

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        hasProfile,
        signInWithMagicLink,
        signInWithProvider,
        signInWithEmailPassword,
        signUpWithEmailPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
