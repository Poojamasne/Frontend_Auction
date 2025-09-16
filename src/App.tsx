import React, { ReactNode } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";

// Components
import LandingPageSimple from "./components/LandingPage/LandingPageSimple";
import LoginPage from "./components/Auth/LoginPage";
import OTPVerification from "./components/Auth/OTPVerification";
import ForgotPassword from "./components/Auth/ForgotPassword";
import Registration from "./components/Registration/Registration";
import Dashboard from "./components/Dashboard/Main/Dashboard";
import AdminDashboard from "./components/Admin/AdminDashboard/AdminDashboard";
import LoadingSpinner from "./components/Common/LoadingSpinner";
import LoadingGate from "./components/Common/LoadingGate";

/* ---------------- Protected Route ---------------- */
interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />; // keep instant spinner for route guard simplicity

  if (!user) return <Navigate to="/login" replace />;

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/* ---------------- Routes ---------------- */
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  // Use LoadingGate higher up instead of blocking here; but keep fallback
  if (loading) return <LoadingSpinner />;

  // helper → redirect logged-in users away from auth pages
  const redirectIfLoggedIn = (page: JSX.Element): JSX.Element => {
    if (!user) return page;
    return (
      <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />
    );
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={redirectIfLoggedIn(<LandingPageSimple />)} />
      <Route path="/login" element={redirectIfLoggedIn(<LoginPage />)} />
      <Route
        path="/verify-otp"
        element={redirectIfLoggedIn(<OTPVerification />)}
      />
      <Route path="/register" element={redirectIfLoggedIn(<Registration />)} />
      <Route
        path="/forgot-password"
        element={redirectIfLoggedIn(<ForgotPassword />)}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

/* ---------------- App ---------------- */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="App">
            {/* Loading gate wraps routes for smoother fade-in */}
            <LoadingGate ready={true}>
              <AppRoutes />
            </LoadingGate>
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "#fff",
                  color: "#333",
                  border: "1px solid #e1e5e9",
                  borderRadius: "8px",
                  fontSize: "14px",
                  padding: "12px 16px",
                  maxWidth: "400px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                },
                success: {
                  style: {
                    background: "#f0f9ff",
                    color: "#0369a1",
                    border: "1px solid #7dd3fc",
                  },
                  iconTheme: {
                    primary: "#0369a1",
                    secondary: "#f0f9ff",
                  },
                },
                error: {
                  style: {
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fca5a5",
                  },
                  iconTheme: {
                    primary: "#dc2626",
                    secondary: "#fef2f2",
                  },
                },
              }}
            />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
