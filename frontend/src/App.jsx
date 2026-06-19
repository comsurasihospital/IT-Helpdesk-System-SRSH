// src/App.jsx
// ============================================================
// Main App — Router + Protected Routes
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider }        from 'react-query';
import { Toaster }                                 from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage         from './pages/LoginPage';
import HomePage          from './pages/HomePage';
import CreateTicketPage  from './pages/CreateTicketPage';
import TicketDetailPage  from './pages/TicketDetailPage';
import AdminTicketsPage  from './pages/AdminTicketsPage';
import DashboardPage     from './pages/DashboardPage';
import ProfilePage       from './pages/ProfilePage';

// ─── Query Client ─────────────────────────────────────────
const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry:              1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Protected Route ──────────────────────────────────────
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return (
    <div className="loading-screen">
      <div style={{ fontSize: '3rem' }}>🏥</div>
      <div className="spinner" />
      <p style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}>กำลังโหลด...</p>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;

  return children;
}

// ─── App Routes ───────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      {/* Public — ไม่ต้อง login */}
      <Route path="/public-dashboard" element={<DashboardPage />} />  

      {/* USER routes */}
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'ADMIN' ? <Navigate to="/admin/tickets" replace />
          : user?.role === 'SUPERVISOR' ? <Navigate to="/dashboard" replace />
          : <HomePage />}
        </ProtectedRoute>
      } />

      <Route path="/create" element={
        <ProtectedRoute roles={['USER', 'ADMIN']}>
          <CreateTicketPage />
        </ProtectedRoute>
      } />

      <Route path="/tickets/:id" element={
        <ProtectedRoute>
          <TicketDetailPage />
        </ProtectedRoute>
      } />

      {/* Rating page (linked from LINE) */}
      <Route path="/rate/:id" element={
        <ProtectedRoute roles={['USER']}>
          <TicketDetailPage autoOpenRate />
        </ProtectedRoute>
      } />

      {/* ADMIN routes */}
      <Route path="/admin/tickets" element={
        <ProtectedRoute roles={['ADMIN']}>
          <AdminTicketsPage />
        </ProtectedRoute>
      } />

      {/* ADMIN + SUPERVISOR */}
      <Route path="/dashboard" element={
        <ProtectedRoute roles={['ADMIN', 'SUPERVISOR']}>
          <DashboardPage />
        </ProtectedRoute>
      } />

      {/* All authenticated */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── Root ─────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'Sarabun, sans-serif',
              fontSize: '0.85rem',
              borderRadius: '12px',
              padding: '12px 16px',
              maxWidth: '360px',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
