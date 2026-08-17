import { useState } from "react";
import { Mail, Lock, User, Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import { login, signup, type UserSession } from "../../services/authService";
import logoWithoutBg from "../../../logowithoutbg.png";

interface AuthPageProps {
  onAuthSuccess: (session: UserSession) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("admin");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let session: UserSession;
      if (isLogin) {
        session = await login(email, password);
      } else {
        session = await signup(name, email, password, role);
      }
      onAuthSuccess(session);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setIsLogin(!isLogin);
    setError("");
    setEmail("");
    setPassword("");
    setName("");
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans">
      
      {/* Left Column - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-12 text-white items-center justify-center">
        <div className="absolute right-0 top-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute left-0 bottom-0 -ml-24 -mb-24 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
              <img src={logoWithoutBg} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Flex Pay</h1>
          </div>
          <h2 className="text-3xl font-bold leading-tight text-white mb-6">
            Secure Admin <br/> Control Center
          </h2>
          <p className="text-slate-300 text-lg mb-12">
            Monitor transactions, manage user security, and access real-time multi-currency analytics in one unified dashboard.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
              <CheckCircle2 className="text-emerald-400 h-5 w-5 flex-shrink-0" />
              Advanced Data Analytics & Insights
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
              <CheckCircle2 className="text-emerald-400 h-5 w-5 flex-shrink-0" />
              Real-time User Security Monitoring
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
              <CheckCircle2 className="text-emerald-400 h-5 w-5 flex-shrink-0" />
              Multi-Currency Wallet Management
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Forms */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 lg:p-24 relative bg-white">
        
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100">
               <img src={logoWithoutBg} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Flex Pay</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
              {isLogin ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-slate-500 text-sm">
              {isLogin 
                ? "Enter your credentials to access the admin dashboard." 
                : "Register a new admin or sub-admin account."}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="admin@flexpay.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                {isLogin && (
                  <button type="button" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Admin Role</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="sub-admin">Sub-Admin (View Only)</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {isLogin ? "Sign In to Dashboard" : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an admin account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              {isLogin ? "Sign up here" : "Sign in here"}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
