import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { Layout } from './components/layout/Layout';
import { FullPageLoader } from './components/ui/FullPageLoader';
import { Dashboard } from './pages/Dashboard';
import { ItemsPage } from './pages/ItemsPage';
import { StockInPage } from './pages/StockInPage';
import { StockOutPage } from './pages/StockOutPage';
import { HistoryPage } from './pages/HistoryPage';
import { UsersPage } from './pages/UsersPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';

// Halaman laporan memuat library chart (recharts) yang cukup besar,
// jadi dimuat terpisah saat pertama kali dibuka.
const ReportsPage = React.lazy(() =>
  import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage }))
);

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullPageLoader message="Memeriksa sesi login..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <>{children}</>;
};

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, initializing } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          initializing ? <FullPageLoader message="Memuat..." /> : user ? <Navigate to="/" replace /> : <LoginPage />
        }
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="barang" element={<ItemsPage />} />
        <Route path="barang-masuk" element={<StockInPage />} />
        <Route path="barang-keluar" element={<StockOutPage />} />
        <Route path="riwayat" element={<HistoryPage />} />
        <Route
          path="laporan"
          element={
            <Suspense fallback={<div className="bg-white border border-slate-200 rounded-xl shadow-2xs"><div className="py-16 text-center text-sm text-slate-500">Memuat modul laporan...</div></div>}>
              <ReportsPage />
            </Suspense>
          }
        />
        <Route
          path="pengguna"
          element={
            <RequireAdmin>
              <UsersPage />
            </RequireAdmin>
          }
        />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </InventoryProvider>
    </AuthProvider>
  );
}
