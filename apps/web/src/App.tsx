import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "./components/layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { queryClient } from "./lib/queryClient";
import {
  AdminDashboardPage,
  AgentBuilderPage,
  AgentDetailsPage,
  AnalyticsPage,
  AuthPage,
  DeveloperDashboardPage,
  HomePage,
  HistoryPage,
  MarketplacePage,
  PaymentsPage,
  ProfilePage,
  SettingsPage,
  UserDashboardPage,
  WalletPage,
} from "./pages";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:id" element={<AgentDetailsPage />} />
            <Route path="/wallet" element={<WalletPage />} />

            {/* Role: USER, DEVELOPER, ADMIN */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["user", "developer", "admin"]}>
                  <UserDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute allowedRoles={["user", "developer", "admin"]}>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={["user", "developer", "admin"]}>
                  <PaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["user", "developer", "admin"]}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={["user", "developer", "admin"]}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Role: DEVELOPER, ADMIN */}
            <Route
              path="/developer"
              element={
                <ProtectedRoute allowedRoles={["developer", "admin"]}>
                  <DeveloperDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/:id"
              element={
                <ProtectedRoute allowedRoles={["developer", "admin"]}>
                  <DeveloperDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/builder"
              element={
                <ProtectedRoute allowedRoles={["developer", "admin"]}>
                  <DeveloperDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/builder/:id"
              element={
                <ProtectedRoute allowedRoles={["developer", "admin"]}>
                  <DeveloperDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Role: ADMIN */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={["developer", "admin"]}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
