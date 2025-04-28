import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TemplateListView from "./TemplateView";
import TodayView from "./TodayView";
import CalendarView from "./CalendarView";
import SummaryView from "./SummaryView";
import PreviewView from "./PreviewView";
import LogWorkoutView from "./LogWorkoutView";
import MissionCompleteView from "./MissionCompleteView";
import { ToastProvider } from "./components/ToastContext";
import ToastBanner from "./components/ToastBanner";

function App() {
  return (
    <ToastProvider>
      <ToastBanner /> {/* <-- Make sure this is right here */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TodayView />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/summary/:date" element={<SummaryView />} />
          <Route path="/preview/:date" element={<PreviewView />} />
          <Route path="/log" element={<LogWorkoutView />} />
          <Route path="/templates" element={<TemplateListView />} />
          <Route path="/mission-complete" element={<MissionCompleteView />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
