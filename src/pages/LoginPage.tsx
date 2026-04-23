import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  const setToken = useAuthStore(state => state.setToken);
  const addNotification = useNotificationStore(state => state.add);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await login(email, password);
      setToken(response.token);
      navigate('/', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      addNotification(message);
      // Email is preserved by not clearing it
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-end pr-16"
      style={{
        backgroundImage: 'url(/login-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Login panel — floats on right with space around it */}
      <div className="relative w-96 bg-white flex flex-col items-center justify-center px-10 py-12 rounded-2xl shadow-2xl">
        
        {/* Logo */}
        <img src="/login-logo.png" alt="Flow Master Logo" className="w-full object-contain mb-4" />

        {/* Tagline */}
        <p className="text-base font-semibold text-gray-700 mb-1">See your money flow.</p>
        <p className="text-base font-semibold text-green-600 mb-8">Live your best life. <span>♡</span></p>

        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          {/* Email field */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={isLoading}
            />
          </div>

          {/* Password field */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={isLoading}
            />
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
