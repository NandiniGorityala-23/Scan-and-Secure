import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/auth.store';
import Sidebar from './Sidebar';

export default function AppShell() {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
