// utils.js

/**
 * Returns today’s date in YYYY-MM-DD (local time).
 */
export function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }); // → e.g., "Fri, Apr 25"
}

/**
 * Returns the full weekday name for a YYYY-MM-DD string or Date.
 */
export function getWeekday(dateInput) {
  let date;
  if (typeof dateInput === "string") {
    const [year, month, day] = dateInput.split("-").map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  }
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export function formatDateForDisplay(date) {
  return new Date(date).toISOString().split("T")[0];
}

/**
 * Formats a YYYY-MM-DD string or Date according to Intl options.
 */
export function formatDateWithOptions(
  dateInput,
  {
    weekday = "short",
    month = "short",
    day = "numeric",
    includeYear = false,
  } = {}
) {
  let date;
  if (typeof dateInput === "string") {
    const [year, monthNum, dayNum] = dateInput.split("-").map(Number);
    date = new Date(year, monthNum - 1, dayNum);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    throw new Error("Invalid date input passed to formatDateWithOptions");
  }

  return date.toLocaleDateString("en-US", {
    weekday,
    month,
    day,
    ...(includeYear && { year: "numeric" }),
  });
}
