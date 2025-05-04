"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function HomeRedirectPage() {
  const { user, hasProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("user:", user);
    console.log("hasProfile:", hasProfile);

    if (user === null) {
      router.replace("/login");
    } else if (user && hasProfile === false) {
      router.replace("/setup");
    } else if (user && hasProfile === true) {
      router.replace("/today");
    }
  }, [user, hasProfile]);

  return null;
}
