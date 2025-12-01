import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import logoImage from '../../assets/logo_final.PNG';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await resetPassword(email);
      setMessage('Check your inbox for password reset instructions');
    } catch (error) {
      // Error is already handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4 font-nunito">
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md -mt-48">
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
            Reset Password
          </h1>
          <p className="text-neutral-600 font-semibold text-sm md:text-base tracking-wide mb-6">Enter your email to receive reset instructions</p>
        </div>

        {/* Enhanced Forgot Password Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 md:p-8 animate-slide-in-up relative overflow-hidden">
        {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
            {message}
          </div>
        )}

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

            {/* Enhanced Submit Button */}
          <button
            type="submit"
            disabled={loading}
              className="w-full bg-neutral-800 text-white py-4 rounded-xl font-extrabold text-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-base">Sending...</span>
                </div>
            ) : (
                <span className="text-lg">Send Reset Link</span>
            )}
          </button>
        </form>

          {/* Enhanced Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
              className="inline-flex items-center gap-2 text-neutral-900 font-extrabold text-base transition-all duration-300 hover:underline"
          >
              <FiArrowLeft size={18} />
              <span>Back to Sign In</span>
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

export default ForgotPassword;

