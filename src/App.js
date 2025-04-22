import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TodayView from "./TodayView";
import CalendarView from "./CalendarView";
import SummaryView from "./SummaryView";
import PreviewView from "./PreviewView";
import LogWorkoutView from "./LogWorkoutView";


function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TodayView />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/summary/:date" element={<SummaryView />} />
          <Route path="/preview/:date" element={<PreviewView />} />
          <Route path="/log/:date" element={<LogWorkoutView />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
