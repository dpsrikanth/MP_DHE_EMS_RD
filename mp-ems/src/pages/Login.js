import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  School,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import authUtils from "../utils/authUtils";
import { authApi } from "../api/authApi";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    if (error) setError(null);
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!window.EMS_CONFIG || !window.EMS_CONFIG.API_BASE_URL) {
        setError("Configuration error: Application config not found. Please refresh the page.");
        setLoading(false);
        return;
      }

      const data = await authApi.login({ email: formData.email, password: formData.password, rememberMe: formData.rememberMe });

      if (data && data.token) {
        authUtils.setAuth(
          data.token,
          data.user.role || "",
          data.user.id || "",
          data.user.college_id || "",
          data.user,
          data.user.department_id || "",
          data.user.university_id || ""
        );

        console.log("Login successful, user role:", data.user.role);
        if (authUtils.isAdmin()) {
          console.log("Navigating to Admin Dashboard");
          navigate("/dashboard");
        } else if (authUtils.isCollegeAdmin()) {
          console.log("Navigating to College Admin Dashboard");
          navigate("/college-admin/dashboard");
        } else if (authUtils.isHOD()) {
          console.log("Navigating to HOD Dashboard");
          navigate("/hod/dashboard");
        } else if (authUtils.isFaculty()) {
          console.log("Navigating to Faculty Dashboard");
          navigate("/faculty/dashboard");
        } else if (authUtils.isStudent()) {
          console.log("Navigating to Student Dashboard");
          navigate("/student/dashboard");
        } else if (authUtils.isExternalFaculty()) {
          console.log("Navigating to External Faculty Marks Entry");
          navigate("/external-faculty/marks-entry");
        } else if (authUtils.isSecrecy()) {
          console.log("Navigating to Secrecy Dashboard");
          navigate("/secrecy/dashboard");
        } else if (authUtils.isPaperSetter()) {
          console.log("Navigating to Paper Setter Dashboard");
          navigate("/paper-setter/dashboard");
        } else {
          console.log("Access denied, role:", data.user.role);
          setError("Access denied. Appropriate role required.");
          authUtils.logout();
        }
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const highlights = [
    "Role-based secure access",
    "End-to-end encrypted question papers",
    "Real-time results & analytics"
  ];

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans">
      {/* ── Brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-sky-600">
        {/* Decorative glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-sky-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-14 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center ring-1 ring-white/25">
              <School size={26} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">Intense</h1>
              <p className="text-[10px] font-semibold text-indigo-200 tracking-[0.25em] uppercase mt-1">MP DHE EMS</p>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-6 max-w-md">
            <h2 className="text-4xl font-black leading-tight tracking-tight">
              Examination management,<br />simplified.
            </h2>
            <p className="text-indigo-100/80 text-base leading-relaxed font-medium">
              A unified portal for universities, colleges, and faculty to manage
              exams, question papers, and results — securely, end to end.
            </p>
            <ul className="space-y-3 pt-2">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-semibold text-indigo-50">
                  <CheckCircle2 size={18} className="text-sky-300 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-indigo-200/70">
            <Lock size={13} />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Secured by Intense Infrastructure</span>
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <School size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">Intense</h1>
              <p className="text-[9px] font-bold text-indigo-500 tracking-[0.25em] uppercase mt-1">MP DHE EMS</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@institution.edu"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, rememberMe: !formData.rememberMe })}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ${formData.rememberMe ? 'bg-indigo-600' : 'bg-slate-300'}`}
                aria-pressed={formData.rememberMe}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${formData.rememberMe ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm font-medium text-slate-600">Keep me signed in</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3.5 rounded-xl active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
            New to the system?{' '}
            <button onClick={() => navigate("/register")} className="text-indigo-600 font-bold hover:underline underline-offset-4">
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
