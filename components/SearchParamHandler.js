"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SearchParamHandler({ param, fallback, onResult }) {
  const searchParams = useSearchParams();
  const value = searchParams.get(param) || fallback;

  useEffect(() => {
    if (onResult) onResult(value);
  }, [value, onResult]);

  return null;
}
