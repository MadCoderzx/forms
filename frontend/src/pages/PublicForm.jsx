import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/apiClient';

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none';
const choiceTypes = ['dropdown', 'radio', 'checkbox'];

export default function PublicForm() {
  const { publicId } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await api.get(`/public/forms/${publicId}`);
        setForm(response.data.form);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Form not found.' : 'Unable to load form.');
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [publicId]);

  useEffect(() => {
    if (!form) return;

    const initialAnswers = {};
    form.questions.forEach((question) => {
      if (question.question_type === 'checkbox') {
        initialAnswers[question.id] = [];
      } else {
        initialAnswers[question.id] = '';
      }
    });
    setAnswers(initialAnswers);
  }, [form]);

  const hasQuestions = useMemo(() => form && form.questions.length > 0, [form]);

  function updateAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleCheckboxAnswer(questionId, optionId) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const exists = current.includes(optionId);
      return {
        ...prev,
        [questionId]: exists ? current.filter((id) => id !== optionId) : [...current, optionId],
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = { answers: [] };
    form.questions.forEach((question) => {
      const answerValue = answers[question.id];

      if (choiceTypes.includes(question.question_type)) {
        if (question.question_type === 'checkbox') {
          (answerValue || []).forEach((optionId) => {
            payload.answers.push({ question_id: question.id, option_id: optionId });
          });
        } else if (answerValue !== '' && answerValue != null) {
          payload.answers.push({ question_id: question.id, option_id: Number(answerValue) });
        }
      } else if (String(answerValue || '').trim() !== '') {
        payload.answers.push({ question_id: question.id, value: String(answerValue) });
      }
    });

    try {
      await api.post(`/public/forms/${publicId}/responses`, payload);
      setSuccess('Your response has been submitted. Thank you!');
      setAnswers((prev) => {
        const reset = {};
        Object.entries(prev).forEach(([key, value]) => {
          reset[key] = Array.isArray(value) ? [] : '';
        });
        return reset;
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to submit response.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="rounded-xl bg-white p-8 shadow-sm text-center text-slate-600">Loading form…</div>;
  }

  if (error && !form) {
    return <div className="rounded-xl bg-white p-8 shadow-sm text-center text-rose-700">{error}</div>;
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">{form.title}</h1>
      <p className="mt-2 text-slate-600">{form.description || 'Please complete the form below.'}</p>

      {success && <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-emerald-700">{success}</div>}
      {error && form && <div className="mt-6 rounded-xl bg-rose-50 p-4 text-rose-700">{error}</div>}

      <div className="mt-8">
        {!hasQuestions ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">This form has no questions yet.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {form.questions.map((question) => (
              <div key={question.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    {question.label}
                    {question.required && <span className="ml-1 text-rose-600">*</span>}
                  </label>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{question.question_type.replace('_', ' ')}</span>
                </div>

                {renderField(question, answers[question.id], updateAnswer, toggleCheckboxAnswer)}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? 'Submitting…' : 'Submit response'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function renderField(question, value, updateAnswer, toggleCheckboxAnswer) {
  switch (question.question_type) {
    case 'short_text':
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          className={inputClass}
        />
      );
    case 'long_text':
      return (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          className={inputClass}
        />
      );
    case 'email':
      return (
        <input
          type="email"
          value={value}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          className={inputClass}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          className={inputClass}
        />
      );
    case 'dropdown':
      return (
        <select
          value={value}
          onChange={(e) => updateAnswer(question.id, e.target.value)}
          className={inputClass}
        >
          <option value="">Select an option</option>
          {question.options.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      );
    case 'radio':
      return (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label key={option.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={Number(value) === option.id}
                onChange={() => updateAnswer(question.id, option.id)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    case 'checkbox':
      return (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label key={option.id} className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                value={option.id}
                checked={Array.isArray(value) && value.includes(option.id)}
                onChange={() => toggleCheckboxAnswer(question.id, option.id)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    default:
      return <div className="text-sm text-slate-500">Unsupported question type.</div>;
  }
}
