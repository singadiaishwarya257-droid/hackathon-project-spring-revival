import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Lazy-load pages for code-splitting
const Landing       = lazy(() => import('@/pages/Landing'));
const Login         = lazy(() => import('@/pages/Login'));
const Register      = lazy(() => import('@/pages/Register'));
const Dashboard     = lazy(() => import('@/pages/Dashboard'));
const GISMap        = lazy(() => import('@/pages/GISMap'));
const SpringDetails = lazy(() => import('@/pages/SpringDetails'));
const VillageDetails = lazy(() => import('@/pages/VillageDetails'));
const AIAnalysis    = lazy(() => import('@/pages/AIAnalysis'));
const Survey        = lazy(() => import('@/pages/Survey'));
const AdminPanel    = lazy(() => import('@/pages/AdminPanel'));
const Reports       = lazy(() => import('@/pages/Reports'));
const Profile       = lazy(() => import('@/pages/Profile'));
const NotFound      = lazy(() => import('@/pages/NotFound'));

// ── Protected route wrapper ───────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected app routes */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard"        element={<Dashboard />} />
            <Route path="/map"              element={<GISMap />} />
            <Route path="/springs/:id"      element={<SpringDetails />} />
            <Route path="/villages/:id"     element={<VillageDetails />} />
            <Route path="/analysis"         element={<AIAnalysis />} />
            <Route path="/survey"           element={<Survey />} />
            <Route path="/reports"          element={<Reports />} />
            <Route path="/profile"          element={<Profile />} />
            <Route path="/admin"            element={
              <ProtectedRoute roles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
