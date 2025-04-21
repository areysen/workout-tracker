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
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" });
}

export function formatFullDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}
