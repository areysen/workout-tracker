// AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    // Restore any existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink = (email) =>
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth-callback` },
    });

  const signInWithProvider = (provider) =>
    supabase.auth.signInWithOAuth({ provider });

  const signInWithEmailPassword = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUpWithEmailPassword = (email, password) =>
    supabase.auth.signUp(
      { email, password },
      { emailRedirectTo: `${window.location.origin}/auth-callback` }
    );

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
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
