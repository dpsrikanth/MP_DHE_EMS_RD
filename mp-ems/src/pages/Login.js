import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  School,
  ArrowRight
} from "lucide-react";
import authUtils from "../utils/authUtils";
import { getApiUrl } from "../config";

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

      const response = await fetch(getApiUrl('/login'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
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
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full relative flex items-center justify-center font-sans overflow-hidden bg-slate-950 p-6">
      {/* Immersive Background Design (Full Screen) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[70%] h-[70%] bg-sky-500/20 rounded-full blur-[160px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[140px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '4s' }} />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.1]" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '64px 64px' }} />
        
        {/* Decorative Glass Elements */}
        <div className="absolute top-[10%] left-[15%] w-64 h-64 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl animate-float transform -rotate-12" />
        <div className="absolute bottom-[10%] right-[15%] w-80 h-48 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl animate-float-slow transform rotate-6" />
        <div className="absolute top-[40%] right-[5%] w-16 h-16 bg-sky-500/20 rounded-2xl border border-sky-400/30 blur-[1px] animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[30%] left-[10%] w-12 h-12 bg-indigo-500/20 rounded-full border border-indigo-400/30 animate-float-slow" style={{ animationDelay: '3s' }} />
      </div>

      {/* Centered Portal Card (Solid White) */}
      <div className="w-full max-w-[480px] bg-white rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-8 sm:px-10 lg:px-12 sm:py-8 lg:py-10 relative z-10">
        {/* Header with Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/40">
            <School size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">Intense</h1>
            <p className="text-[10px] text-sky-500 font-black tracking-[0.2em] uppercase mt-1">Institution Portal</p>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Portal Access</h2>
          <p className="text-slate-500 font-medium text-xs">Please enter your administrative credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-2xl flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
                <Mail size={18} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@institution.edu"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-14 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex justify-end pr-1">
              <button type="button" onClick={() => navigate("/forgot-password", { state: { email: formData.email } })} className="text-xs font-bold text-sky-500 hover:text-sky-600 hover:underline transition-colors mt-1">Forgot Password?</button>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, rememberMe: !formData.rememberMe })}
              className={`w-10 h-6 rounded-full transition-all duration-300 relative ${formData.rememberMe ? 'bg-sky-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${formData.rememberMe ? 'translate-x-4' : ''}`} />
            </button>
            <span className="text-sm font-bold text-slate-600">Keep me logged in</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full group relative overflow-hidden bg-slate-900 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-slate-900/10 hover:shadow-sky-500/20 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </div>
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 text-sm font-medium">
          New to the system?{' '}
          <button
            onClick={() => navigate("/register", { state: { email: formData.email } })}
            className="text-sky-500 font-black hover:text-sky-600 underline underline-offset-4 decoration-sky-100"
          >
            Register Students
          </button>
        </p>

        {/* Security Badge */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <CheckCircle2 size={16} className="text-sky-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center leading-tight">Secured by Intense-Cloud Architecture</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
