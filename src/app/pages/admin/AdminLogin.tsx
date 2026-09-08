import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { useCMS } from '../../context/CMSContext';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { AlertCircle, Loader2, Home, Eye, EyeOff, ShieldCheck, Lock, User, Mail } from 'lucide-react';
import { logger } from '../../utils/logger';

/**
 * Admin Login Page - Styled consistently with Customer Login Page
 */
export function AdminLogin() {
  const navigate = useNavigate();
  const { login, signup } = useAdmin();

  let initializeData: (() => Promise<void>) | undefined;
  try {
    const { initializeData: init } = useCMS();
    initializeData = init;
  } catch (e) {
    logger.warn('AdminLogin: CMSProvider not available, skipping data initialization');
    initializeData = async () => {
      logger.debug('Fallback: Data initialization not available without CMSProvider');
    };
  }

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let success = false;

      if (isSignup) {
        if (!name.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }

        logger.debug('Attempting signup', { email, name });
        success = await signup(email, password, name);
        logger.info('Signup result', { success });

        if (success && initializeData) {
          try {
            logger.info('Initializing database...');
            await initializeData();
            logger.info('Database initialized successfully');
          } catch (initError) {
            logger.warn('Data initialization error (may already exist)', initError);
          }
        }
      } else {
        logger.debug('Attempting login', { email });
        success = await login(email, password);
        logger.info('Login result', { success });
      }

      if (success) {
        navigate('/admin');
      } else {
        setError(isSignup ? 'Signup failed. Email may already be in use.' : 'Invalid email or password');
      }
    } catch (err: any) {
      logger.error('Form submission error', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] w-full relative overflow-y-auto font-sans flex flex-col justify-between items-center py-4 sm:py-8 px-3 sm:px-6 bg-cover bg-center bg-no-repeat bg-[#faf5ef]"
      style={{ backgroundImage: "url('/images/loginbackgrund.png')" }}
    >
      {/* Top Navigation Outside Box */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 px-1 sm:px-4 mb-4 sm:mb-6 z-30 shrink-0">
        {/* Top Left: Logo */}
        <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <svg
            className="h-8 sm:h-11 w-auto"
            viewBox="0 0 350 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Costplus100 Logo"
          >
            <circle cx="40" cy="40" r="34" fill="#2D3748" />
            <text
              x="40"
              y="52"
              fontSize="34"
              fontWeight="900"
              fill="white"
              textAnchor="middle"
              fontFamily="Arial, Helvetica, sans-serif"
              letterSpacing="-2"
            >
              C+
            </text>
            <rect x="52" y="16" width="40" height="22" rx="11" fill="#E31837" />
            <text
              x="72"
              y="32"
              fontSize="14"
              fontWeight="900"
              fill="white"
              textAnchor="middle"
              fontFamily="Arial, Helvetica, sans-serif"
            >
              100
            </text>
            <text
              x="85"
              y="54"
              fontSize="28"
              fontWeight="900"
              fill="#2D3748"
              fontFamily="Arial, Helvetica, sans-serif"
              letterSpacing="1"
            >
              COST
            </text>
            <text
              x="170"
              y="54"
              fontSize="28"
              fontWeight="900"
              fill="#E31837"
              fontFamily="Arial, Helvetica, sans-serif"
              letterSpacing="1"
            >
              PLUS
            </text>
            <text
              x="255"
              y="54"
              fontSize="28"
              fontWeight="900"
              fill="#2D3748"
              fontFamily="Arial, Helvetica, sans-serif"
              letterSpacing="1"
            >
              100
            </text>
            <text
              x="85"
              y="70"
              fontSize="9"
              fontWeight="700"
              fill="#E31837"
              fontFamily="Arial, Helvetica, sans-serif"
              letterSpacing="2"
            >
              TOTAL TRANSPARENCY - NO CATCH
            </text>
          </svg>
        </Link>

        {/* Top Right: Home Page Button */}
        <Link
          to="/"
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-[#E31837] font-bold text-xs sm:text-sm shadow-md border border-slate-200/80 transition-all hover:shadow-lg active:scale-95"
        >
          <Home className="w-4 h-4 text-[#E31837]" />
          <span>Home Page</span>
        </Link>
      </header>

      {/* Main Content Card Container */}
      <div className="w-full max-w-md relative z-10 my-auto px-1">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-200/90 relative z-20">
          {/* Header Section Inside Card */}
          <div className="text-center mb-5 sm:mb-6 flex flex-col items-center">
            <div className="size-11 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-3">
              <ShieldCheck className="size-6 text-[#E31837]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight mb-1">
              {isSignup ? 'Create Admin Account' : 'CMS Admin Portal'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mb-2.5">
              {isSignup ? 'Secure access setup for Costplus100 CMS' : 'Sign in to access management dashboard'}
            </p>
            <div className="w-12 h-1 bg-[#E31837] rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <Label htmlFor="admin-name" className="text-xs font-bold text-[#0f172a] block">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="admin-name"
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    className="pl-9 h-11 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837]"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs font-bold text-[#0f172a] block">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="admin-email"
                  type="email"
                  required
                  placeholder="admin@costplus100.com.au"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="pl-9 h-11 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837]"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-xs font-bold text-[#0f172a] block">
                Password
              </Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="pl-9 pr-10 h-11 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837]"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-[#E31837]" />
                <p className="text-xs font-semibold text-rose-800 leading-tight">{error}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#E31837] hover:bg-[#C41230] disabled:bg-slate-300 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {isSignup ? 'Creating Account...' : 'Authenticating...'}
                  </>
                ) : (
                  isSignup ? 'Create Admin Account' : 'Sign In to Admin Portal'
                )}
              </button>
            </div>

            <div className="text-center mt-5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-[#E31837] transition-colors cursor-pointer"
                disabled={loading}
              >
                {isSignup ? 'Already have an admin account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>

            {isSignup && (
              <div className="bg-slate-50 p-3.5 border border-slate-200/80 rounded-xl mt-3">
                <p className="mb-0.5 text-xs font-extrabold text-[#0f172a]">First Time Setup:</p>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">
                  Creating an admin account initializes the CMS with products and settings.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Footer Outside Card */}
      <footer className="w-full text-center py-3 text-xs text-slate-500 font-medium z-10 shrink-0">
        &copy; {new Date().getFullYear()} <span className="font-bold text-slate-700">Costplus100</span>. All rights reserved.
      </footer>
    </div>
  );
}