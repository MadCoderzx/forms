import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FormEditor from './pages/FormEditor';
import PublicForm from './pages/PublicForm';
import Responses from './pages/Responses';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route
            path="dashboard"
            element={<ProtectedRoute redirectTo="/login"><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="forms/:formId/edit"
            element={<ProtectedRoute redirectTo="/login"><FormEditor /></ProtectedRoute>}
          />
          <Route path="forms/:publicId" element={<PublicForm />} />
          <Route
            path="responses"
            element={<ProtectedRoute redirectTo="/login"><Responses /></ProtectedRoute>}
          />
          <Route path="*" element={<div className="p-8 text-center">Page not found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
