import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { saveLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/login', { email, password });
      saveLogin(res.data);
      toast.success('Welcome back, ' + res.data.user.name + '!');
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Header accent */}
        <div className="bg-green-700 text-white text-center py-6 rounded-t-xl">
          <h1 className="text-2xl font-bold">🗑️ WasteNet</h1>
          <p className="text-green-200 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-b-xl shadow-lg dark:text-gray-100">
          {error && (
            <p className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-2 rounded mb-4 text-sm">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              disabled={loading}
              className="bg-green-700 text-white p-2 rounded font-medium hover:bg-green-600 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="text-sm mt-4 text-center text-gray-600 dark:text-gray-400">
            New here?{' '}
            <Link to="/register" className="text-green-700 dark:text-green-400 underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
