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
import { AuthProvider } from "./AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import LoginView from "./LoginView";
import AuthCallback from "./AuthCallback";
import SetupView from "./SetupView";

function App() {
  return (
    <ToastProvider>
      <ToastBanner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route
              path="/setup"
              element={
                <PrivateRoute>
                  <SetupView />
                </PrivateRoute>
              }
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <TodayView />
                </PrivateRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <PrivateRoute>
                  <CalendarView />
                </PrivateRoute>
              }
            />
            <Route
              path="/summary/:date"
              element={
                <PrivateRoute>
                  <SummaryView />
                </PrivateRoute>
              }
            />
            <Route
              path="/preview/:date"
              element={
                <PrivateRoute>
                  <PreviewView />
                </PrivateRoute>
              }
            />
            <Route
              path="/log"
              element={
                <PrivateRoute>
                  <LogWorkoutView />
                </PrivateRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <PrivateRoute>
                  <TemplateListView />
                </PrivateRoute>
              }
            />
            <Route
              path="/mission-complete"
              element={
                <PrivateRoute>
                  <MissionCompleteView />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
