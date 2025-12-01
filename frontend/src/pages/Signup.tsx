import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import logoImage from '../../assets/logo_final.PNG';

const Signup = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!displayName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, displayName);
      navigate('/');
    } catch (error) {
      // Error is already handled in AuthContext
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
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-1 tracking-tight animate-slide-in-up -mt-2" style={{ letterSpacing: '-0.02em' }}>
            Join Us Today
          </h1>
          <p className="text-neutral-600 font-semibold text-sm md:text-base tracking-wide mb-6">Create your account at Merry's Coffee Shop</p>
        </div>

        {/* Enhanced Signup Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 md:p-8 animate-slide-in-up relative overflow-hidden">
          
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
             {/* Enhanced Full Name Field */}
             <div className="space-y-1.5">
               <label htmlFor="displayName" className="block text-sm font-bold text-neutral-900 tracking-wide">
              Full Name
            </label>
            <div className="relative">
            <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <FiUser className="text-neutral-500" size={18} />
                  </div>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                     className="w-full pl-11 pr-4 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium text-base"
                placeholder="John Doe"
                required
              />
                </div>
            </div>
          </div>

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
                minLength={6}
              />
            </div>
              </div>
              <p className="text-xs text-neutral-600 font-semibold ml-1">Must be at least 6 characters</p>
          </div>

             {/* Enhanced Confirm Password Field */}
             <div className="space-y-1.5 mb-8">
               <label htmlFor="confirmPassword" className="block text-sm font-bold text-neutral-900 tracking-wide">
              Confirm Password
            </label>
            <div className="relative">
            <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                    <FiLock className="text-neutral-500" size={18} />
                  </div>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                     className="w-full pl-11 pr-4 py-3 bg-white border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-400 focus:border-neutral-400 outline-none transition-all duration-300 text-neutral-900 placeholder-neutral-400 font-medium text-base"
                placeholder="••••••••"
                required
                minLength={6}
              />
                </div>
            </div>
          </div>

            {/* Enhanced Submit Button */}
          <div>
          <button
            type="submit"
            disabled={loading}
              className="w-full bg-neutral-800 text-white py-4 rounded-xl font-extrabold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-base">Creating account...</span>
                </div>
            ) : (
              <>
                  <FiUserPlus size={22} />
                  <span className="text-lg">Create Account</span>
              </>
            )}
          </button>
          </div>
        </form>

          {/* Enhanced Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-neutral-600 font-bold">Already have an account?</span>
            </div>
          </div>

          {/* Enhanced Sign In Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-neutral-900 font-extrabold text-base transition-all duration-300 hover:underline"
            >
              <span>Sign in instead</span>
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

export default Signup;
