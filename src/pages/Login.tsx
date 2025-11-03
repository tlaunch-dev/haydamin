import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CedarBackground from '../components/CedarBackground';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Map username to email for Firebase
      const email = username === 'sadder' ? 'family@haydamin.com' : `${username}@haydamin.local`;
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <CedarBackground />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-card rounded-3xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-text text-center mb-8 font-sans">
            Hayda Min?
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-base font-medium text-text mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 border border-text/20 rounded-2xl focus:ring-2 focus:ring-accent focus:border-transparent transition-colors bg-background text-text"
                placeholder="Enter username"
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-base font-medium text-text mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-text/20 rounded-2xl focus:ring-2 focus:ring-accent focus:border-transparent transition-colors bg-background text-text"
                placeholder="Enter password"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-accent-text py-3 rounded-2xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
