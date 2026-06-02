import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/apiClient';

const questionTypes = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio' },
  { value: 'checkbox', label: 'Checkbox' },
];
const choiceTypes = ['dropdown', 'radio', 'checkbox'];

export default function FormEditor() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const isNew = formId === 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [newQuestion, setNewQuestion] = useState({ question_type: 'short_text', label: '', required: false });
  const [newOptionLabel, setNewOptionLabel] = useState('');

  const formTitle = isNew ? 'Create new form' : `Edit form #${formId}`;

  useEffect(() => {
    async function loadForm() {
      if (isNew) {
        setLoading(false);
        setTitle('');
        setDescription('');
        setQuestions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/forms/${formId}`);
        const form = response.data.form;
        setTitle(form.title || '');
        setDescription(form.description || '');
        setQuestions(form.questions || []);
      } catch (err) {
        setError('Unable to load form.');
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [formId, isNew]);

  const hasChoices = useMemo(
    () => choiceTypes.includes(newQuestion.question_type),
    [newQuestion.question_type]
  );

  async function handleSaveForm() {
    if (!title.trim()) {
      setError('Form title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        const response = await api.post('/forms', { title: title.trim(), description: description.trim() });
        navigate(`/forms/${response.data.form.id}/edit`);
        return;
      }

      await api.put(`/forms/${formId}`, { title: title.trim(), description: description.trim() });
      setMessage('Form saved successfully.');
    } catch (err) {
      setError('Unable to save form.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddQuestion() {
    if (!newQuestion.label.trim()) {
      setError('Question label is required.');
      return;
    }

    if (isNew) {
      setError('Save the form first before adding questions.');
      return;
    }

    if (hasChoices && !newOptionLabel.trim()) {
      setError('Choice questions require at least one option.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await api.post(`/forms/${formId}/questions`, {
        question_type: newQuestion.question_type,
        label: newQuestion.label.trim(),
        required: newQuestion.required,
        options: hasChoices ? [{ label: newOptionLabel.trim() }] : [],
      });

      setQuestions((current) => [...current, response.data.question]);
      setNewQuestion({ question_type: 'short_text', label: '', required: false });
      setNewOptionLabel('');
      setMessage('Question added.');
    } catch (err) {
      setError('Unable to add question.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateQuestion(questionId, updates) {
    setSaving(true);
    setError(null);

    try {
      const response = await api.put(`/forms/${formId}/questions/${questionId}`, updates);
      setQuestions((current) =>
        current.map((question) => (question.id === questionId ? response.data.question : question))
      );
      setMessage('Question updated.');
    } catch (err) {
      setError('Unable to update question.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuestion(questionId) {
    if (!window.confirm('Delete this question?')) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.delete(`/forms/${formId}/questions/${questionId}`);
      setQuestions((current) => current.filter((question) => question.id !== questionId));
      setMessage('Question deleted.');
    } catch (err) {
      setError('Unable to delete question.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddOption(questionId, label) {
    if (!label.trim()) {
      setError('Option label is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await api.post(`/forms/${formId}/questions/${questionId}/options`, {
        label: label.trim(),
      });
      setQuestions((current) =>
        current.map((question) =>
          question.id === questionId
            ? { ...question, options: [...(question.options || []), response.data.option] }
            : question
        )
      );
      setMessage('Option added.');
    } catch (err) {
      setError('Unable to add option.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateOption(questionId, optionId, label) {
    if (!label.trim()) {
      setError('Option label is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await api.put(`/forms/${formId}/questions/${questionId}/options/${optionId}`, {
        label: label.trim(),
      });
      setQuestions((current) =>
        current.map((question) =>
          question.id === questionId
            ? {
                ...question,
                options: question.options.map((option) =>
                  option.id === optionId ? response.data.option : option
                ),
              }
            : question
        )
      );
      setMessage('Option updated.');
    } catch (err) {
      setError('Unable to update option.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOption(questionId, optionId) {
    setSaving(true);
    setError(null);

    try {
      await api.delete(`/forms/${formId}/questions/${questionId}/options/${optionId}`);
      setQuestions((current) =>
        current.map((question) =>
          question.id === questionId
            ? {
                ...question,
                options: question.options.filter((option) => option.id !== optionId),
              }
            : question
        )
      );
      setMessage('Option deleted.');
    } catch (err) {
      setError('Unable to delete option.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteForm() {
    if (!window.confirm('Delete this form permanently?')) {
      return;
    }

    try {
      await api.delete(`/forms/${formId}`);
      navigate('/dashboard');
    } catch (err) {
      setError('Unable to delete form.');
    }
  }

  async function handleDuplicateForm() {
    try {
      const response = await api.post(`/forms/${formId}/duplicate`);
      navigate(`/forms/${response.data.form.id}/edit`);
    } catch (err) {
      setError('Unable to duplicate form.');
    }
  }

  return (
    <div className="space-y-6 rounded-xl bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{formTitle}</h1>
          <p className="mt-2 text-slate-600">Build the form structure here and save your changes.</p>
        </div>
        {!isNew && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDuplicateForm}
              className="rounded-md bg-slate-100 px-4 py-2 text-sm text-slate-800 hover:bg-slate-200"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={handleDeleteForm}
              className="rounded-md bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-slate-600">Loading form…</p>
      ) : (
        <>
          {error && <p className="rounded-md bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
          {message && <p className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}

          <div className="space-y-6">
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Form title</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Form title"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional form description"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                  rows={4}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveForm}
                  disabled={saving}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isNew ? 'Create form' : 'Save form'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="rounded-md bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
                >
                  Back to dashboard
                </button>
              </div>
            </div>

            {!isNew && (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Add a question</h2>
                    <p className="text-sm text-slate-600">Add questions and optional choices for dropdown, radio, and checkbox fields.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Question type</label>
                    <select
                      value={newQuestion.question_type}
                      onChange={(event) =>
                        setNewQuestion((current) => ({ ...current, question_type: event.target.value }))
                      }
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      {questionTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Question label</label>
                    <input
                      value={newQuestion.label}
                      onChange={(event) => setNewQuestion((current) => ({ ...current, label: event.target.value }))}
                      placeholder="Question text"
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={newQuestion.required}
                      onChange={(event) =>
                        setNewQuestion((current) => ({ ...current, required: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Required
                  </label>
                </div>
                {hasChoices && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Default option label</label>
                    <input
                      value={newOptionLabel}
                      onChange={(event) => setNewOptionLabel(event.target.value)}
                      placeholder="First option"
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  disabled={saving}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Add question
                </button>
              </div>
            )}

            {!isNew && (
              <div className="space-y-6">
                {questions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">
                    No questions yet. Add one to begin building your form.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
                        onDelete={() => handleDeleteQuestion(question.id)}
                        onAddOption={handleAddOption}
                        onUpdateOption={handleUpdateOption}
                        onDeleteOption={handleDeleteOption}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function QuestionCard({ question, onUpdate, onDelete, onAddOption, onUpdateOption, onDeleteOption }) {
  const [label, setLabel] = useState(question.label);
  const [required, setRequired] = useState(question.required);
  const [questionType, setQuestionType] = useState(question.question_type);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    setLabel(question.label);
    setRequired(question.required);
    setQuestionType(question.question_type);
  }, [question]);

  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Question #{question.id}</h3>
          <p className="text-sm text-slate-600">{question.question_type.replace('_', ' ')}</p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md bg-rose-100 px-3 py-2 text-sm text-rose-700 hover:bg-rose-200"
        >
          Delete
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Type</label>
          <select
            value={questionType}
            onChange={(event) => setQuestionType(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {questionTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Label</label>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={required}
            onChange={(event) => setRequired(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Required
        </label>
        <button
          type="button"
          onClick={() => onUpdate({ question_type: questionType, label: label.trim(), required })}
          className="rounded-md bg-slate-100 px-4 py-2 text-sm text-slate-800 hover:bg-slate-200"
        >
          Save question
        </button>
      </div>

      {choiceTypes.includes(questionType) && (
        <div className="mt-6 space-y-4 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Options</h4>
          </div>
          {(question.options || []).map((option) => (
            <div key={option.id} className="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <input
                value={option.label}
                onChange={(event) => onUpdateOption(question.id, option.id, event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onDeleteOption(question.id, option.id)}
                className="rounded-md bg-rose-100 px-3 py-2 text-sm text-rose-700 hover:bg-rose-200"
              >
                Remove
              </button>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newOption}
              onChange={(event) => setNewOption(event.target.value)}
              placeholder="New option label"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                onAddOption(question.id, newOption);
                setNewOption('');
              }}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Add option
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
