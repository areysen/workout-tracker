"use client";
export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function HomeRedirectPage() {
  const { user, hasProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
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
