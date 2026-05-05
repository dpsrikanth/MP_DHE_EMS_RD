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
  Zap,
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[rgb(42_105_192)] p-4 font-sans selection:bg-indigo-500/30">

      <div className="w-full max-w-[460px] relative z-10 animate-in fade-in duration-700">
        {/* Brand Section */}
        <div className="flex flex-col items-center gap-2 mb-12">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mb-2">
            <School size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Intense</h1>
          <p className="text-[10px] font-black text-sky-400 tracking-[0.3em] uppercase">Institutional Portal</p>
        </div>

        {/* The Card */}
        <div className="bg-[#0f172a] rounded-[3rem] shadow-[0_0_50px_-12px_rgba(79,70,229,0.25)] border border-white/10 p-8 sm:p-12 flex flex-col items-center">
          <div className="w-full mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">Portal Login</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">Authenticate to manage your institution</p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-8">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-3 animate-in shake duration-300">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-500 tracking-widest uppercase ml-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="collegeadmin@test.com"
                required
                className="w-full bg-[#eef2ff] rounded-2xl py-4 px-6 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-bold"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-black text-slate-500 tracking-widest uppercase">Password</label>
                <button 
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[10px] font-black text-sky-500 hover:text-sky-400 transition-colors uppercase tracking-widest"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••"
                  required
                  className="w-full bg-[#eef2ff] rounded-2xl py-4 px-6 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Switch Toggle */}
            <div className="flex items-center gap-4 px-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, rememberMe: !formData.rememberMe })}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative ${formData.rememberMe ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${formData.rememberMe ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-xs font-bold text-slate-500">Keep me logged in</span>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-slate-400 font-medium">
            New to the system?{' '}
            <button onClick={() => navigate("/register")} className="text-sky-400 font-bold hover:underline underline-offset-4">Create Account</button>
          </p>
        </div>

        {/* Security Badge */}
        <div className="mt-10 flex items-center justify-center gap-2 opacity-30">
          <CheckCircle2 size={14} className="text-slate-400" />
          <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Secured by Intense Infrastructure</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
