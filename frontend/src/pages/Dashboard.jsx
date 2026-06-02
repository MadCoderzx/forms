import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome back, {user?.email || 'User'}.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/forms/new/edit" className="rounded-xl bg-white p-6 shadow-sm hover:border hover:border-indigo-500">
          <h2 className="text-lg font-semibold">Create Form</h2>
          <p className="mt-2 text-sm text-slate-600">Start building a new form.</p>
        </Link>
        <Link to="/responses" className="rounded-xl bg-white p-6 shadow-sm hover:border hover:border-indigo-500">
          <h2 className="text-lg font-semibold">View Responses</h2>
          <p className="mt-2 text-sm text-slate-600">See form submissions and export data.</p>
        </Link>
        <Link to="/forms/123" className="rounded-xl bg-white p-6 shadow-sm hover:border hover:border-indigo-500">
          <h2 className="text-lg font-semibold">Public Form</h2>
          <p className="mt-2 text-sm text-slate-600">Open a public preview page for your form.</p>
        </Link>
      </div>
    </div>
  );
}
