"use client";

import { useSearchParams } from "next/navigation";

export default function SearchParamHandler({ param, fallback, onResult }) {
  const searchParams = useSearchParams();
  const value = searchParams.get(param) || fallback;

  if (onResult) onResult(value);

  return null;
}
