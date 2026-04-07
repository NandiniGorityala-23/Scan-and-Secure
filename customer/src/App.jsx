import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Home as HomeIcon, ShieldCheck, ScanLine } from 'lucide-react';
import useAuthStore from './store/auth.store';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import ClaimPage from './pages/claim/ClaimPage';
import Warranties from './pages/Warranties';

function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

const NAV_ITEMS = [
  { to: '/', icon: HomeIcon, label: 'Home', exact: true },
  { to: '/scan', icon: ScanLine, label: 'Scan' },
  { to: '/warranties', icon: ShieldCheck, label: 'Warranties' },
];

function BottomNav() {
  const location = useLocation();
  const noNavRoutes = ['/login', '/register'];
  if (noNavRoutes.includes(location.pathname) || location.pathname.startsWith('/claim/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-t border-white/10 z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto px-4 py-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors"
            >
              <Icon
                size={22}
                className={active ? 'text-indigo-400' : 'text-slate-500'}
              />
              <span className={`text-xs font-medium ${active ? 'text-indigo-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <BottomNav />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/claim/:uuid" element={<ClaimPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/scan"
            element={
              <RequireAuth>
                <Scanner />
              </RequireAuth>
            }
          />
          <Route
            path="/warranties"
            element={
              <RequireAuth>
                <Warranties />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '10px', fontSize: '14px' },
        }}
      />
    </>
  );
}
