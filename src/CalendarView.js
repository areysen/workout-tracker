import React, { useMemo, useEffect, useRef, useState } from "react";
import {
    eachDayOfInterval,
    startOfYear,
    endOfYear,
    isToday,
    isBefore,
    getMonth,
    getYear,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths
} from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "./supabaseClient";
import { getToday, formatDateWithOptions, formatDateForDisplay, getWeekday } from "./utils";

export default function CalendarView() {
    const navigate = useNavigate();
    const today = new Date();
    const todayRef = useRef(null);
    const monthRefs = useRef({});
    const location = useLocation();
    const fromToday = location.state?.fromToday;

    const [viewMode, setViewMode] = useState("week");
    const [selectedDate, setSelectedDate] = useState(today);
    const [workoutLogs, setWorkoutLogs] = useState([]);
    const [workoutTemplates, setWorkoutTemplates] = useState([]);

    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const currentMonth = new Date(getYear(selectedDate), getMonth(selectedDate));

    const currentYear = getYear(today);
    const allDays = useMemo(
        () =>
            eachDayOfInterval({
                start: startOfYear(new Date(currentYear, 0, 1)),
                end: endOfYear(new Date(currentYear, 11, 31))
            }),
        [currentYear]
    );

    const groupedByMonth = useMemo(() => {
        return allDays.reduce((acc, date) => {
            const month = formatDateWithOptions(date, { weekday: undefined }).split(" ")[0];
            if (!acc[month]) acc[month] = [];
            acc[month].push(date);
            return acc;
        }, {});
    }, [allDays]);

    const daysThisMonth = useMemo(() => {
        return eachDayOfInterval({
            start: startOfMonth(selectedDate),
            end: endOfMonth(selectedDate)
        });
    }, [selectedDate]);

    const daysThisWeek = useMemo(() => {
        return eachDayOfInterval({
            start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
            end: endOfWeek(selectedDate, { weekStartsOn: 1 })
        });
    }, [selectedDate]);

    useEffect(() => {
        if (fromToday) {
            setViewMode("week");
            setSelectedDate(today);
        }
    }, [fromToday]);

    useEffect(() => {
        if (viewMode === "year" && monthRefs.current[formatDateWithOptions(selectedDate, { weekday: undefined }).split(" ")[0]]) {
            monthRefs.current[formatDateWithOptions(selectedDate, { weekday: undefined }).split(" ")[0]].scrollIntoView({ behavior: "smooth" });
        }
    }, [viewMode, selectedDate]);
    useEffect(() => {
        async function fetchWorkoutLogs() {
            const { data, error } = await supabase.from("workout_logs").select("*");
            if (error) {
                console.error("Error fetching logs:", error);
            } else {
                setWorkoutLogs(data);
            }
        }
        async function fetchWorkoutTemplates() {
            const { data, error } = await supabase.from("workout_templates").select("day_of_week, workout_name");
            if (!error) {
                setWorkoutTemplates(data);
            }
        }
        fetchWorkoutLogs();
        fetchWorkoutTemplates();
    }, []);
    useEffect(() => {
        if (viewMode === "month" && todayRef.current) {
            todayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [viewMode]);

    const handleClick = (date) => {
        const formatted = formatDateForDisplay(date);
        setSelectedDate(date);
        const log = workoutLogs.find((l) => l.date === formatted);
        if (log && isToday(date)) {
            navigate("/summary/" + formatted, { state: { allowLogAnother: true } });
        } else if (isToday(date)) {
            navigate("/preview/" + formatted);
        } else if (isBefore(date, today)) {
            navigate("/summary/" + formatted);
        } else {
            navigate("/preview/" + formatted);
        }
    };

    const handlePrevious = () => {
        if (viewMode === "week") {
            setSelectedDate((prev) => subWeeks(prev, 1));
        } else if (viewMode === "month") {
            setSelectedDate((prev) => subMonths(prev, 1));
        }
    };

    const handleNext = () => {
        if (viewMode === "week") {
            setSelectedDate((prev) => addWeeks(prev, 1));
        } else if (viewMode === "month") {
            setSelectedDate((prev) => addMonths(prev, 1));
        }
    };

    const handleGoToToday = () => {
        setSelectedDate(today);
    };

    const renderControls = () => (
        <div className="sticky top-0 z-10 bg-[#242B2F] pt-4 pb-2">
            <div className="flex justify-between items-start mb-4 flex-wrap gap-2 sm:flex-nowrap">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm border border-white px-3 py-1 rounded hover:bg-white/10">
                        ← Back
                    </button>
                </div>

                {viewMode !== "year" && (
                    <div className="flex justify-center items-center gap-4">
                        <button
                            onClick={handlePrevious}
                            className="text-xl text-white hover:text-[#C63663]"
                            aria-label="Previous">
                            ←
                        </button>
                        <h2 className="text-lg font-semibold text-[#C63663]">
                            {viewMode === "week"
                                ? `Week of ${formatDateWithOptions(currentWeekStart)}`
                                : currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </h2>
                        <button
                            onClick={handleNext}
                            className="text-xl text-white hover:text-[#C63663]"
                            aria-label="Next">
                            →
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleGoToToday}
                        className="text-sm border border-white px-3 py-1 rounded hover:bg-white/10">
                        Today
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-start flex-wrap gap-2 sm:flex-nowrap">
                <div className="flex gap-2 mt-2 sm:mt-0">
                    {["week", "month", "year"].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`text-sm px-3 py-1 rounded font-medium ${
                                viewMode === mode
                                    ? "bg-[#C63663] text-white"
                                    : "border border-[#818C91] text-white hover:bg-white/10"
                            }`}>
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderGridDays = (dates) => {
        // Reset forecast cache at the start of this render
        window._splitForecastCache = null;
        return (
            <motion.div
                key={`${viewMode}-${formatDateWithOptions(selectedDate)}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-7 gap-3">
                {dates.map((date) => {
                    const isTodayDate = isToday(date);
                    const dayOfWeek = formatDateWithOptions(date, { weekday: "short" }).split(",")[0];
                    const dayNumber = new Date(date).getDate();

                    // --- Forecast logic block start ---
                    const formatted = formatDateForDisplay(date);
                    const log = workoutLogs.find((l) => l.date === formatted);
                    let forecastLabel = "No workout logged";

                    if (log?.forecast) {
                        forecastLabel = `Planned: ${log.muscle_group || log.workout_name}`;
                    } else if (log) {
                        forecastLabel = "✓ Logged";
                    } else if (!log) {
                        const weekday = getWeekday(date).toLowerCase();
                        const templateForDay = workoutTemplates.find((t) => t.day_of_week === weekday);
                        if (templateForDay) {
                            forecastLabel = `Planned: ${templateForDay.workout_name}`;
                        } else {
                            forecastLabel = "No planned workout";
                        }
                    }
                    // --- Forecast logic block end ---

                    return (
                        <button
                            key={date.toISOString()}
                            ref={isTodayDate ? todayRef : null}
                            onClick={() => handleClick(date)}
                            className={`h-20 rounded-lg px-2 py-1 text-left flex flex-col justify-between
                  ${isTodayDate ? "bg-[#C63663] text-white" : "bg-[#343E44] text-gray-300"}
                  hover:ring-2 hover:ring-[#C63663]`}>
                            <div className={`text-xs font-bold uppercase ${isTodayDate ? "text-white" : "text-[#C63663]"}`}>
                                {dayOfWeek}
                            </div>
                            <div className="text-lg font-bold text-white">{dayNumber}</div>
                            <div className="text-xs mt-1 text-gray-300">
                                {forecastLabel}
                            </div>
                        </button>
                    );
                })}
            </motion.div>
        );
    };

    const renderStackedDays = (dates) => {
        // Reset forecast cache at the start of this render
        window._splitForecastCache = null;
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={`week-${formatDateWithOptions(selectedDate)}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3 relative"
                    style={{
                        minHeight: "420px", // give consistent height to reduce layout shift
                        overflowAnchor: "none"
                    }}>
                    {dates.map((date) => {
                        const isTodayDate = isToday(date);
                        const dayOfWeek = formatDateWithOptions(date, { weekday: "long" }).split(",")[0];
                        const monthDay = formatDateWithOptions(date).split(", ")[1];

                        // --- Forecast logic block start ---
                        const formatted = formatDateForDisplay(date);
                        const log = workoutLogs.find((l) => l.date === formatted);
                        let forecastLabel = "No workout logged";

                        if (log?.forecast) {
                            forecastLabel = `Planned: ${log.muscle_group || log.workout_name}`;
                        } else if (log) {
                            forecastLabel = "✓ Logged";
                        } else if (!log) {
                            const weekday = getWeekday(date).toLowerCase();
                            const templateForDay = workoutTemplates.find((t) => t.day_of_week === weekday);
                            if (templateForDay) {
                                forecastLabel = `Planned: ${templateForDay.workout_name}`;
                            } else {
                                forecastLabel = "No planned workout";
                            }
                        }
                        // --- Forecast logic block end ---

                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => handleClick(date)}
                                className={`w-full text-left p-4 rounded-lg shadow-md
                    ${isTodayDate ? "bg-[#C63663] text-white" : "bg-[#343E44] text-gray-300"}
                    hover:ring-2 hover:ring-[#C63663]`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-semibold text-sm uppercase">
                                            {dayOfWeek}, {monthDay}
                                        </div>
                                        <div className="text-xs text-gray-200">
                                            {forecastLabel}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <div className="min-h-screen bg-[#242B2F] text-white p-4 max-w-3xl mx-auto">
            {renderControls()}
            <div className="space-y-6 mt-2">
                {viewMode === "month"
                    ? renderGridDays(daysThisMonth)
                    : viewMode === "week"
                      ? renderStackedDays(daysThisWeek)
                      : Object.entries(groupedByMonth).map(([month, dates]) => (
                            <div key={month} ref={(el) => (monthRefs.current[month] = el)}>
                                <h2 className="text-lg font-semibold text-[#C63663] mb-2">{month}</h2>
                                {renderGridDays(dates)}
                            </div>
                        ))}
            </div>
        </div>
    );
}
