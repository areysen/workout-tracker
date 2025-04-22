// utils.js

export function getToday() {
    return new Date().toISOString().split("T")[0];
}

export function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
    }); // → e.g., "Fri, Apr 25"
}

export function getWeekday(dateStr) {
    const localDate = new Date(dateStr + "T00:00:00");
    return localDate.toLocaleDateString("en-US", { weekday: "long" });
}

export function formatDateForDisplay(date) {
    return new Date(date).toISOString().split("T")[0];
}

export function formatDateWithOptions(dateInput, { weekday = "short", includeYear = false } = {}) {
    let date;

    if (typeof dateInput === "string") {
        // If it's already a local-format date (e.g. "2025-04-21"), just pass it through to a normal new Date
        date = new Date(dateInput + "T00:00:00"); // safely create it in local time
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else {
        throw new Error("Invalid date input passed to formatDateWithOptions");
    }

    return date.toLocaleDateString("en-US", {
        weekday,
        month: "short",
        day: "numeric",
        ...(includeYear && { year: "numeric" })
    });
}