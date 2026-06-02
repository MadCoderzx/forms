import { useParams } from 'react-router-dom';

export default function FormEditor() {
  const { formId } = useParams();

  return (
    <div className="rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Form Editor</h1>
      <p className="mt-2 text-slate-600">Editing form ID: {formId}</p>
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">
        This page is the beginning of the form builder UI.
      </div>
    </div>
  );
}
