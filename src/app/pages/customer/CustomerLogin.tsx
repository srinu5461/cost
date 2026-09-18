import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { User, UserPlus, Loader2, Mail, Lock, Phone, ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, Home } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;
const SUPABASE_URL = `https://${projectId}.supabase.co`;

export function CustomerLogin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback`;
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  };

  // Password visibility state
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/payment/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Login failed');
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Store customer data in localStorage
      localStorage.setItem('customer', JSON.stringify(data.customer));

      // Dispatch custom event to update header
      window.dispatchEvent(new Event('customerLogin'));

      navigate('/customer/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/payment/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          phone: registerData.phone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Store customer data in localStorage
      localStorage.setItem('customer', JSON.stringify(data.customer));

      // Dispatch custom event to update header
      window.dispatchEvent(new Event('customerLogin'));

      setSuccess('Account created successfully! Redirecting...');

      // Navigate immediately
      navigate('/customer/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
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
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-200/90 relative z-20">
          {/* Header Section Inside Card */}
          <div className="text-center mb-5 sm:mb-6 flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight mb-1">Customer Portal</h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mb-2.5">Sign in to manage your orders and account</p>
            <div className="w-12 h-1 bg-[#E31837] rounded-full"></div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl h-11 mb-4">
              <TabsTrigger
                value="login"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#E31837] data-[state=active]:shadow-sm data-[state=active]:font-bold text-slate-500 font-medium transition-all text-xs sm:text-sm py-2"
              >
                <User className="w-4 h-4 mr-1.5" />
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#E31837] data-[state=active]:shadow-sm data-[state=active]:font-bold text-slate-500 font-medium transition-all text-xs sm:text-sm py-2"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Register
              </TabsTrigger>
            </TabsList>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl mb-4 text-xs text-center font-medium shadow-xs">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-3 rounded-xl mb-4 text-xs text-center font-medium shadow-xs">
                {success}
              </div>
            )}

            {/* Login Tab */}
            <TabsContent value="login" className="mt-0 outline-none">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="login-email" className="text-xs font-bold text-[#0f172a] block">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-[#E31837]" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      placeholder="Enter your email address"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-3 pl-10 pr-3 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-sm font-medium"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="login-password" className="text-xs font-bold text-[#0f172a] block">Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-[#E31837]" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-3 pl-10 pr-10 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-sm font-medium tracking-widest placeholder:tracking-normal"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <Link to="/customer/forgot-password" className="text-xs font-semibold text-[#E31837] hover:underline">
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E31837] hover:bg-[#c41530] text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 mt-2 disabled:opacity-70 text-sm sm:text-base"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Sign In</span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs text-slate-400 uppercase">
                    <span className="bg-white px-3 font-semibold">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60 active:scale-[0.99]"
                >
                  {googleLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <svg className="size-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continue with Google
                </button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="mt-0 outline-none">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="firstName" className="text-xs font-bold text-[#0f172a] block">First Name</label>
                    <input
                      id="firstName"
                      required
                      placeholder="First name"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 px-3 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-sm"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="lastName" className="text-xs font-bold text-[#0f172a] block">Last Name</label>
                    <input
                      id="lastName"
                      required
                      placeholder="Last name"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 px-3 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-sm"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-email" className="text-xs font-bold text-[#0f172a] block">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-4 h-4 text-[#E31837]" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      placeholder="Email address"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-sm"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="phone" className="text-xs font-bold text-[#0f172a] block">Phone Number</label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3 w-4 h-4 text-[#E31837]" />
                    <input
                      id="phone"
                      type="tel"
                      required
                      placeholder="Phone number"
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-sm"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="reg-password" className="text-xs font-bold text-[#0f172a] block">Password</label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 w-4 h-4 text-[#E31837]" />
                      <input
                        id="reg-password"
                        type={showRegPassword ? "text" : "password"}
                        required
                        placeholder="Password"
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-9 pr-9 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-sm"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                        aria-label={showRegPassword ? "Hide password" : "Show password"}
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="confirm-password" className="text-xs font-bold text-[#0f172a] block">Confirm Password</label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 w-4 h-4 text-[#E31837]" />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Confirm"
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-2.5 pl-9 pr-9 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-sm"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E31837] hover:bg-[#c41530] text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 mt-2 disabled:opacity-70 text-sm sm:text-base"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Account
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs text-slate-400 uppercase">
                    <span className="bg-white px-3 font-semibold">or sign up with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60 active:scale-[0.99]"
                >
                  {googleLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <svg className="size-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Continue with Google
                </button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer Security Text */}
      <footer className="w-full text-center mt-4 sm:mt-6 py-2 flex items-center justify-center gap-2 text-slate-600 text-xs font-medium shrink-0 z-10">
        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <span>Your data is 100% safe and encrypted.</span>
      </footer>
    </div>
  );
}