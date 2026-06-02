import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/dashboard" className="text-xl font-semibold">Form Builder</Link>
          <nav className="space-x-4 text-sm">
            <Link to="/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
            <Link to="/responses" className="text-slate-600 hover:text-slate-900">Responses</Link>
            {!user ? (
              <>
                <Link to="/login" className="text-slate-600 hover:text-slate-900">Login</Link>
                <Link to="/register" className="text-slate-600 hover:text-slate-900">Register</Link>
              </>
            ) : (
              <button onClick={logout} className="text-slate-600 hover:text-slate-900">Logout</button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
