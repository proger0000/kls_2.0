import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleRouteProps {
  allowedRoles: string[];
}

export const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { profile, initialHydrated } = useAuth();

  if (!initialHydrated) return null;

  // Если профиля еще нет (грузится), мы не должны редиректить.
  // Пускаем рендер, а DashboardLayout покажет Скелетон.
  if (!profile) return <Outlet />;

  if (!allowedRoles.includes(profile.role ?? '')) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};