"use client";
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
  subMonths,
} from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/components/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  formatDateWithOptions,
  formatDateForDisplay,
  getWeekday,
} from "@/lib/utils";
import BackButton from "@/components/BackButton";

export default function CalendarView() {
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const today = new Date();
  const todayRef = useRef(null);
  const monthRefs = useRef({});

  // Touch swipe refs and handlers for week/month navigation (vertical swipe)
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (touchStartXRef.current == null || touchStartYRef.current == null)
      return;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    // only trigger on predominant vertical swipe
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
      if (diffY > 0) handlePrevious();
      else handleNext();
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [viewMode, setViewMode] = useState("week");
  const [selectedDate, setSelectedDate] = useState(today);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [workoutTemplates, setWorkoutTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const currentMonth = new Date(getYear(selectedDate), getMonth(selectedDate));

  const currentYear = getYear(today);
  const allDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfYear(new Date(currentYear, 0, 1)),
        end: endOfYear(new Date(currentYear, 11, 31)),
      }),
    [currentYear]
  );

  const groupedByMonth = useMemo(() => {
    return allDays.reduce((acc, date) => {
      const month = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      if (!acc[month]) acc[month] = [];
      acc[month].push(date);
      return acc;
    }, {});
  }, [allDays]);

  const daysThisMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate),
    });
  }, [selectedDate]);

  const daysThisWeek = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
      end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
    });
  }, [selectedDate]);

  const isTodayActive =
    (viewMode === "week" &&
      selectedDate.toDateString() === today.toDateString()) ||
    (viewMode === "month" &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear());

  // NOTE: The below useEffect relied on location.state, but Next.js's useRouter/usePathname
  // do not support navigation state. You may need to replace this logic with query params or context.
  /*
  useEffect(() => {
    if (
      location?.state?.previousViewMode &&
      location.state.previousViewMode !== "persist"
    ) {
      setViewMode(location.state.previousViewMode);
    }
    if (location?.state?.previousSelectedDate) {
      setSelectedDate(new Date(location.state.previousSelectedDate));
    }
  }, [location?.state]);
  */

  useEffect(() => {
    window.lastViewMode = viewMode;
  }, [viewMode]);

  /*
  useEffect(() => {
    if (location?.state?.showToast) {
      console.log(
        "[CalendarView] showToast triggered:",
        location.state.showToast
      );
      showToast(location.state.showToast);
    }
    // eslint-disable-next-line
  }, [location?.state, showToast]);
  */

  // Move fetchWorkoutLogs and fetchWorkoutTemplates outside useEffect for reuse
  async function fetchWorkoutLogs() {
    const { data, error } = await supabase.from("workout_logs").select("*");
    if (error) {
      console.error("Error fetching logs:", error);
    } else {
      setWorkoutLogs(data);
    }
  }
  async function fetchWorkoutTemplates() {
    const { data, error } = await supabase
      .from("workout_templates")
      .select("day_of_week, workout_name");
    if (!error) {
      setWorkoutTemplates(data);
    }
  }
  async function fetchCalendarData() {
    setLoading(true);

    const simulateSlowNetwork = true;
    if (simulateSlowNetwork) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    await Promise.all([fetchWorkoutLogs(), fetchWorkoutTemplates()]);
    setLoading(false);
  }
  useEffect(() => {
    fetchCalendarData();
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
    // NOTE: Next.js router does not support navigation state.
    // If you need to pass previousViewMode/previousSelectedDate, use query params or context.
    if (log?.skipped) {
      router.push(`/summary?date=${formatted}`);
    } else if (log && !log.forecast) {
      router.push(`/summary?date=${formatted}`);
    } else if (log?.forecast) {
      router.push(`/preview?date=${formatted}`);
    } else if (!log && isBefore(date, today) && !isToday(date)) {
      router.push(`/summary?date=${formatted}`);
    } else {
      router.push(`/preview?date=${formatted}`);
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
    <div className="sticky inset-x-0 top-0 z-10 bg-[#242B2F] pb-4">
      <div className="flex justify-between items-center pt-4 pb-2 flex-wrap gap-2 sm:flex-nowrap">
        <div className="flex items-center gap-2">
          <BackButton to="/" label="Home" />
        </div>

        {viewMode !== "year" && (
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={handlePrevious}
              className="p-2 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-pink-500 to-pink-700 text-white rounded-full shadow-glow hover:shadow-glow-hover transition duration-300"
              aria-label="Previous"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold text-[#C63663]">
              {viewMode === "week"
                ? `Week of ${currentWeekStart.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}`
                : currentMonth.toLocaleDateString("en-US", {
                    weekday: undefined,
                    month: "long",
                    year: "numeric",
                  })}
            </h2>
            <button
              onClick={handleNext}
              className="p-2 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-pink-500 to-pink-700 text-white rounded-full shadow-glow hover:shadow-glow-hover transition duration-300"
              aria-label="Next"
            >
              →
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleGoToToday}
            disabled={isTodayActive}
            className={`px-3 py-1 rounded-2xl text-sm transition duration-300 ${
              isTodayActive
                ? "bg-pink-700 text-gray-200 cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-pink-500 to-pink-700 text-white shadow-glow hover:shadow-glow-hover"
            }`}
          >
            Today
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-2 sm:flex-nowrap">
        <div className="flex gap-2 mt-2 sm:mt-0">
          {["week", "month"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`text-sm px-3 py-1 rounded-2xl font-medium transition duration-300 ${
                viewMode === mode
                  ? "bg-gradient-to-r from-pink-500 to-pink-700 text-white shadow-glow"
                  : "border border-pink-400 text-white hover:bg-white/10 hover:shadow-glow-hover"
              }`}
            >
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
        className="grid grid-cols-7 gap-3"
      >
        {dates.map((date) => {
          const isTodayDate = isToday(date);
          const dayOfWeek = formatDateWithOptions(date, {
            weekday: "short",
          }).split(",")[0];
          const dayNumber = new Date(date).getDate();

          // --- Forecast logic block start ---
          const formatted = formatDateForDisplay(date);
          const log = workoutLogs.find((l) => l.date === formatted);
          let forecastLabel = "—";

          if (log?.skipped) {
            forecastLabel = "⛔";
          } else if (log && !log.forecast) {
            forecastLabel = "✓";
          } else if (log?.forecast) {
            forecastLabel = "🏋️ ";
          } else if (!log && isBefore(date, today) && !isToday(date)) {
            forecastLabel = "❓";
          } else {
            const weekday = getWeekday(date).toLowerCase().trim();
            const templateForDay = workoutTemplates.find(
              (t) =>
                t.day_of_week && t.day_of_week.toLowerCase().trim() === weekday
            );
            if (templateForDay) {
              // Only show the icon for future dates in Grid View
              forecastLabel =
                viewMode === "month"
                  ? "🏋️"
                  : `🏋️ ${templateForDay.workout_name}`;
            }
          }
          // --- Forecast logic block end ---

          return (
            <button
              key={date.toISOString()}
              ref={isTodayDate ? todayRef : null}
              onClick={() => handleClick(date)}
              className={`h-20 rounded-lg px-2 py-1 text-left flex flex-col justify-between transition duration-200
                  ${
                    isTodayDate
                      ? "bg-[#C63663] text-white ring-2 ring-white"
                      : "bg-[#343E44] text-gray-300"
                  }
                  ${log?.skipped ? "border border-red-500" : ""}
                  hover:ring-2 hover:ring-[#C63663] hover:scale-[1.02]`}
            >
              <div
                className={`text-xs font-bold uppercase ${
                  isTodayDate ? "text-white" : "text-[#C63663]"
                }`}
              >
                {dayOfWeek}
              </div>
              <div className="text-lg font-bold text-white">{dayNumber}</div>
              <div className="text-xs mt-1 text-gray-300">{forecastLabel}</div>
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
            overflowAnchor: "none",
          }}
        >
          {dates.map((date) => {
            const isTodayDate = isToday(date);
            const dayOfWeek = formatDateWithOptions(date, {
              weekday: "long",
            }).split(",")[0];
            const monthDay = formatDateWithOptions(date).split(", ")[1];

            // --- Forecast logic block start ---
            const formatted = formatDateForDisplay(date);
            const log = workoutLogs.find((l) => l.date === formatted);
            let forecastLabel = "— No plan";

            if (log?.skipped) {
              forecastLabel = "⛔ Skipped";
            } else if (log && !log.forecast) {
              forecastLabel = "✓ Logged";
            } else if (log && log.forecast) {
              forecastLabel = `🏋️ ${log.muscle_group || log.workout_name}`;
            } else if (!log && isBefore(date, today) && !isToday(date)) {
              forecastLabel = "❓ Not logged";
            } else {
              const weekday = getWeekday(date).toLowerCase().trim();
              const templateForDay = workoutTemplates.find(
                (t) =>
                  t.day_of_week &&
                  t.day_of_week.toLowerCase().trim() === weekday
              );
              if (templateForDay) {
                forecastLabel = `🏋️ ${templateForDay.workout_name}`;
              }
            }
            // --- Forecast logic block end ---

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleClick(date)}
                className={`w-full text-left p-4 rounded-lg shadow-md transition duration-200
                    ${
                      isTodayDate
                        ? "bg-[#C63663] text-white ring-2 ring-white"
                        : "bg-[#343E44] text-gray-300"
                    }
                    ${log?.skipped ? "border border-red-500" : ""}
                    hover:ring-2 hover:ring-[#C63663] hover:scale-[1.02]`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-sm uppercase">
                      {dayOfWeek}, {monthDay}
                    </div>
                    <div className="text-xs text-gray-200">{forecastLabel}</div>
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
    <div
      className="min-h-screen bg-[#242B2F] text-white px-4 pt-0 pb-52 max-w-3xl mx-auto"
      onTouchStart={viewMode === "week" ? handleTouchStart : undefined}
      onTouchEnd={viewMode === "week" ? handleTouchEnd : undefined}
      style={{ touchAction: viewMode === "week" ? "none" : "auto" }}
    >
      {renderControls()}
      {loading ? (
        <div className="min-h-screen bg-[#242B2F] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-400"></div>
        </div>
      ) : (
        <motion.div
          className="space-y-6 mt-2"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y > 50) handlePrevious();
            else if (info.offset.y < -50) handleNext();
          }}
        >
          {viewMode === "week"
            ? renderStackedDays(daysThisWeek)
            : renderGridDays(daysThisMonth)}
        </motion.div>
      )}
    </div>
  );
}
