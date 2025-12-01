import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkAndCacheAdminStatus } from '../utils/adminCheck';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { auth } from '../config/firebase';
import logoImage from '../../assets/logo_final.PNG';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      
      // Check admin status after successful login
      const user = auth.currentUser;
      if (user) {
        const isAdmin = await checkAndCacheAdminStatus(user.uid);
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
      navigate('/');
      }
    } catch (error) {
      // Error is already handled in AuthContext with user-friendly messages
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4 font-nunito">

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md -mt-32">
        {/* Enhanced Logo/Brand Section */}
        <div className="text-center mb-2 animate-fade-in pt-0">
          <div className="inline-flex items-center justify-center mb-0 relative">
            <img 
              src={logoImage} 
              alt="Merry's Coffee Shop Logo" 
              className="w-48 h-48 md:w-56 md:h-56 object-contain relative z-10 mix-blend-multiply opacity-90 filter brightness-110"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-1 tracking-tight animate-slide-in-up mt-0" style={{ letterSpacing: '-0.02em' }}>
            Welcome Back
          </h1>
          <p className="text-neutral-600 font-semibold text-sm md:text-base tracking-wide mb-6">Sign in to continue to Merry's Coffee Shop</p>
        </div>

        {/* Enhanced Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 md:p-8 animate-slide-in-up relative overflow-hidden">
          
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Enhanced Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-bold text-neutral-900 tracking-wide">
              Email Address
            </label>
            <div className="relative">
            <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <FiMail className="text-neutral-500" size={18} />
                  </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium text-base"
                placeholder="your@email.com"
                required
              />
                </div>
            </div>
          </div>

            {/* Enhanced Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-bold text-neutral-900 tracking-wide">
              Password
            </label>
            <div className="relative">
            <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <FiLock className="text-neutral-500" size={18} />
                  </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium text-base"
                placeholder="••••••••"
                required
              />
            </div>
              </div>
            </div>

            {/* Enhanced Forgot Password Link */}
            <div className="flex justify-end -mt-1">
              <Link
                to="/forgot-password"
                 className="text-sm text-neutral-600 font-bold transition-all duration-200 hover:underline"
              >
                Forgot password?
              </Link>
          </div>

            {/* Enhanced Submit Button */}
          <button
            type="submit"
            disabled={loading}
              className="w-full bg-neutral-800 text-white py-4 rounded-xl font-extrabold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-base">Signing in...</span>
                </div>
            ) : (
              <>
                  <FiLogIn size={22} />
                  <span className="text-lg">Sign In</span>
              </>
            )}
          </button>
        </form>

          {/* Enhanced Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-neutral-600 font-bold">New to our shop?</span>
            </div>
          </div>

          {/* Enhanced Sign Up Link */}
          <div className="text-center">
          <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-neutral-900 font-extrabold text-base transition-all duration-300 hover:underline"
          >
              <span>Create an account</span>
              <span className="text-xl">→</span>
          </Link>
          </div>
        </div>

        {/* Enhanced Footer */}
        <p className="text-center text-neutral-500 text-xs mt-4 font-semibold">
          © 2024 Merry's Coffee Shop. All rights reserved.
          </p>
      </div>
    </div>
  );
};

export default Login;
