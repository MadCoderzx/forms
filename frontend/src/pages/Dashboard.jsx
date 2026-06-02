import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/apiClient';

export default function Dashboard() {
  const { user } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadForms() {
      try {
        const response = await api.get('/forms');
        setForms(response.data.forms || []);
      } catch (err) {
        setError('Unable to load forms.');
      } finally {
        setLoading(false);
      }
    }

    loadForms();
  }, []);

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
          <h2 className="text-lg font-semibold">Responses</h2>
          <p className="mt-2 text-sm text-slate-600">View collected submissions.</p>
        </Link>
      </div>

      <div className="rounded-xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Forms</h2>
          <Link to="/forms/new/edit" className="text-indigo-600 hover:text-indigo-800">New form</Link>
        </div>

        {loading ? (
          <p className="mt-4 text-slate-600">Loading forms…</p>
        ) : error ? (
          <p className="mt-4 text-red-600">{error}</p>
        ) : forms.length === 0 ? (
          <p className="mt-4 text-slate-600">No forms yet. Create your first form.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {forms.map((form) => (
              <div key={form.id} className="rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{form.title}</h3>
                    <p className="text-sm text-slate-600">{form.description || 'No description yet'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/forms/${form.id}/edit`}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/forms/${form.id}`}
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Public
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
