import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = () => {
  // 🔥 FIX: Вместо loading используем !initialHydrated
  const { session, initialHydrated } = useAuth();

  if (!initialHydrated) {
    return null; // Ждем инициализацию
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};