import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/apiClient';

export default function Responses() {
  const location = useLocation();
  const formId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('formId');
  }, [location.search]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [stats, setStats] = useState({ totalResponses: 0, latestResponse: null });
  const [forms, setForms] = useState([]);
  const [formsLoading, setFormsLoading] = useState(false);

  useEffect(() => {
    if (!formId) {
      setFormsLoading(true);
      setError(null);

      async function loadForms() {
        try {
          const response = await api.get('/forms');
          setForms(response.data.forms || []);
        } catch (err) {
          setError('Unable to load your forms.');
        } finally {
          setFormsLoading(false);
        }
      }

      loadForms();
      return;
    }

    async function loadResponses() {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/forms/${formId}/responses`);
        setForm(response.data.form);
        setResponses(response.data.responses || []);
        setStats(response.data.stats || { totalResponses: 0, latestResponse: null });
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load responses.');
      } finally {
        setLoading(false);
      }
    }

    loadResponses();
  }, [formId]);

  const summary = useMemo(() => {
    if (!responses.length) return null;

    const questionStats = {};

    responses.forEach((response) => {
      response.answers.forEach((answer) => {
        const key = `${answer.question_id}-${answer.question_label}`;
        if (!questionStats[key]) {
          questionStats[key] = {
            question_label: answer.question_label,
            question_type: answer.question_type,
            totals: {},
          };
        }

        if (['dropdown', 'radio', 'checkbox'].includes(answer.question_type)) {
          const optionLabel = answer.option_label || 'Unknown';
          questionStats[key].totals[optionLabel] = (questionStats[key].totals[optionLabel] || 0) + 1;
        } else {
          questionStats[key].totals['Answered'] = (questionStats[key].totals['Answered'] || 0) + 1;
        }
      });
    });

    return Object.values(questionStats);
  }, [responses]);

  return (
    <div className="space-y-6 rounded-xl bg-white p-8 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">Responses</h1>
        <p className="mt-2 text-slate-600">
          {formId
            ? `Viewing responses for form ${formId}.`
            : 'Select a form from your dashboard to view collected responses.'}
        </p>
      </div>

      {!formId ? (
        <div className="space-y-4 rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">
          <div>Select a form below to view its responses.</div>

          {formsLoading ? (
            <div className="text-slate-600">Loading your forms…</div>
          ) : error ? (
            <div className="text-rose-700">{error}</div>
          ) : forms.length === 0 ? (
            <div className="text-slate-600">No forms available yet. Create a form from the dashboard to start collecting responses.</div>
          ) : (
            <div className="space-y-3">
              {forms.map((formItem) => (
                <Link
                  key={formItem.id}
                  to={`/responses?formId=${formItem.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm transition hover:border-indigo-500 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">{formItem.title}</div>
                      <div className="text-sm text-slate-600">{formItem.description || 'No description'}</div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                      {formItem.response_count ?? 0} responses
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-slate-300 p-6 text-slate-600">Loading responses…</div>
      ) : error ? (
        <div className="rounded-xl bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Total responses</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalResponses}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Latest submission</div>
              <div className="mt-2 text-slate-700">
                {stats.latestResponse ? new Date(stats.latestResponse).toLocaleString() : 'No responses yet'}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Form</div>
              <div className="mt-2 text-slate-700">{form?.title || 'Unknown form'}</div>
            </div>
          </div>

          {summary && summary.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Response summary</h2>
              <div className="mt-4 space-y-4">
                {summary.map((item) => (
                  <div key={item.question_label}>
                    <div className="text-sm font-medium text-slate-700">{item.question_label}</div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {Object.entries(item.totals).map(([label, count]) => (
                        <div key={label} className="rounded-xl bg-white p-3 text-sm text-slate-700 shadow-sm">
                          <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
                          <div className="mt-1 text-xl font-semibold text-slate-900">{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {responses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">
              No responses have been submitted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {responses.map((response) => (
                <div key={response.id} className="rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm uppercase tracking-wide text-slate-500">Submission</div>
                      <div className="mt-1 text-slate-900">{new Date(response.created_at).toLocaleString()}</div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                      Response #{response.id}
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    {response.answers.length === 0 ? (
                      <div className="rounded-xl bg-slate-50 p-4 text-slate-700">
                        No answers were submitted for this response.
                      </div>
                    ) : (
                      response.answers.map((answer) => (
                        <div key={answer.answer_id} className="rounded-xl bg-slate-50 p-4">
                          <div className="text-sm font-medium text-slate-700">{answer.question_label}</div>
                          <div className="mt-2 text-slate-900">
                            {['dropdown', 'radio', 'checkbox'].includes(answer.question_type)
                              ? answer.option_label || 'No selection'
                              : answer.value || 'No answer'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
