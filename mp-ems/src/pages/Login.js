import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  School,
  Calendar,
  Award,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import authUtils from "../utils/authUtils";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
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
      const response = await fetch(window["config"].login_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        authUtils.setAuth(data.token, data.user.role || "", data.user.id || "");
        
        if (authUtils.isAdmin()) {
          navigate("/dashboard");
        } else {
          alert("Access denied. Admin role required.");
          authUtils.logout();
        }
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Left Panel: Brand & Stats */}
      <div className="relative flex-1 bg-slate-900 overflow-hidden hidden lg:flex flex-col justify-center p-16 xl:p-24 overflow-y-auto">
        {/* Abstract Background Design */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <School size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight italic">EMS<span className="text-sky-400 not-italic ml-1">Admin</span></h1>
              <p className="text-sky-400/80 font-bold text-sm tracking-widest uppercase">Institution Portal</p>
            </div>
          </div>

          <h2 className="text-5xl font-black text-white leading-[1.1] mb-8 tracking-tight">
            Streamlining <span className="text-sky-400">Academic</span> Governance and Management.
          </h2>
          
          <p className="text-lg text-slate-400 font-medium mb-12 leading-relaxed">
            The next generation of Educational Management Systems. Intuitive, robust, and designed for high-performance administrative excellence.
          </p>

          <div className="grid grid-cols-2 gap-8 mb-16">
            <div className="space-y-4 p-6 bg-slate-800/40 rounded-[2rem] border border-slate-700/50 backdrop-blur-sm">
              <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400">
                <Calendar size={20} />
              </div>
              <h3 className="text-white font-bold text-lg leading-none">Smart Scheduling</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Automated timetables and exam planning engines.</p>
            </div>
            <div className="space-y-4 p-6 bg-slate-800/40 rounded-[2rem] border border-slate-700/50 backdrop-blur-sm">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                <Award size={20} />
              </div>
              <h3 className="text-white font-bold text-lg leading-none">Result Analytics</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">In-depth performance tracking and reporting.</p>
            </div>
          </div>

          <div className="flex items-center gap-12 border-t border-slate-800 pt-12">
            <div className="text-center">
              <p className="text-3xl font-black text-white leading-none mb-2">500+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Colleges</p>
            </div>
            <div className="text-center border-l border-slate-800 pl-12">
              <p className="text-3xl font-black text-white leading-none mb-2">2.5M</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Students</p>
            </div>
            <div className="text-center border-l border-slate-800 pl-12">
              <p className="text-3xl font-black text-white leading-none mb-2">99.9%</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-[540px] bg-white flex flex-col justify-center p-8 sm:p-12 lg:p-20 relative overflow-hidden">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white">
            <School size={24} />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight italic">EMS<span className="text-sky-500">Admin</span></h1>
        </div>

        <div className="max-w-sm mx-auto lg:mx-0 w-full">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Portal Access</h2>
            <p className="text-slate-500 font-medium">Please enter your administrative credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-xs font-bold text-sky-500 hover:text-sky-600 hover:underline">Forgot?</button>
              </div>
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
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-14 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, rememberMe: !formData.rememberMe })}
                className={`w-10 h-6 rounded-full transition-all duration-300 relative ${formData.rememberMe ? 'bg-sky-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${formData.rememberMe ? 'translate-x-4' : ''}`} />
              </button>
              <span className="text-sm font-bold text-slate-600">Keep me logged in</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-slate-900 text-white rounded-[1.5rem] py-4 font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-slate-900/10 hover:shadow-sky-500/20 active:scale-[0.98] transition-all disabled:opacity-70"
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

          <p className="mt-12 text-center text-slate-500 text-sm font-medium">
            New to the system?{' '}
            <button 
              onClick={() => navigate("/register")}
              className="text-sky-500 font-black hover:text-sky-600 underline underline-offset-4 decoration-sky-200"
            >
              Register Institution
            </button>
          </p>

          {/* Social Proof / Security Badge */}
          <div className="mt-16 pt-8 border-t border-slate-50 flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <CheckCircle2 size={16} className="text-sky-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secured by EMS-Cloud Architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
