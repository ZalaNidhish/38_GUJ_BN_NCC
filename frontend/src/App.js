import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import CadetDashboard from "./pages/CadetDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import NoticesPage from "./pages/NoticesPage";
import EventsPage from "./pages/EventsPage";
import AttendancePage from "./pages/AttendancePage";
import AdminAttendancePage from "./pages/AdminAttendancePage";
import MarkAttendancePage from "./pages/MarkAttendancePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AdminCadetsPage from "./pages/AdminCadetsPage";
import DeveloperPage from "./pages/DeveloperPage";

import "./styles.css";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          {user?.role === "admin" ? <AdminDashboard /> : <CadetDashboard />}
        </ProtectedRoute>
      } />

      <Route path="/profile"           element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/notices"           element={<ProtectedRoute><NoticesPage /></ProtectedRoute>} />
      <Route path="/events"            element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
      <Route path="/attendance" element={
        <ProtectedRoute>
          {user?.role === "admin" ? <AdminAttendancePage /> : <AttendancePage />}
        </ProtectedRoute>
      } />
      <Route path="/change-password"   element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
      <Route path="/developer"         element={<ProtectedRoute><DeveloperPage /></ProtectedRoute>} />

      <Route path="/cadets" element={<ProtectedRoute adminOnly><AdminCadetsPage /></ProtectedRoute>} />
      <Route path="/mark-attendance/:eventId" element={<ProtectedRoute adminOnly><MarkAttendancePage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
