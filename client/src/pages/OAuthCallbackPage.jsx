import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const success = params.get('success');
    const error = params.get('error');
    if (success) {
      toast.success('Finansia account connected!');
    } else {
      toast.error(`Connection failed: ${error || 'unknown error'}`);
    }
    const timer = setTimeout(() => navigate('/set'), 2000);
    return () => clearTimeout(timer);
  }, []);

  const success = params.get('success');
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <div className={`text-4xl ${success ? '✅' : '❌'}`}>{success ? '✅' : '❌'}</div>
        <p className="text-lg font-medium text-gray-100">
          {success ? 'Finansia connected successfully!' : 'Connection failed'}
        </p>
        <p className="text-sm text-gray-400">Redirecting to SET Portfolio…</p>
      </div>
    </div>
  );
}
