import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center text-center p-8">
      <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-gray-500 mb-6">Page not found</p>
      <button onClick={() => navigate('/')} className="btn-primary flex items-center gap-2">
        <Home className="w-4 h-4" /> Back to Dashboard
      </button>
    </div>
  );
}
