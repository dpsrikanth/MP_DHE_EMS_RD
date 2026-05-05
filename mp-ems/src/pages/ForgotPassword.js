import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowRight, ArrowLeft, School, CheckCircle2 } from "lucide-react";
import { authApi } from '../api/authApi';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const data = await authApi.forgotPassword(email);
      setMessage(data.message || "Email sent successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Left Panel: Brand */}
      <div className="relative flex-1 bg-slate-900 overflow-hidden hidden lg:flex flex-col justify-center p-8 xl:p-16">
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
              <h1 className="text-3xl font-black text-white tracking-tight italic">Intense</h1>
              <p className="text-sky-400/80 font-bold text-sm tracking-widest ">Institution Portal</p>
            </div>
          </div>
          <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            Account <span className="text-sky-400">Recovery</span>
          </h2>
          <p className="text-base xl:text-lg text-slate-400 font-medium mb-8 leading-relaxed">
            Enter your email to receive instructions on how to reset your administrative credentials and regain access to the portal.
          </p>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="w-full lg:w-[540px] bg-white flex flex-col justify-center p-6 sm:p-8 lg:p-12 xl:p-16 relative">
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white">
            <School size={24} />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight italic">Intense</h1>
        </div>

        <div className="max-w-sm mx-auto lg:mx-0 w-full">
          <button 
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-slate-400 hover:text-sky-500 font-bold text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Login
          </button>
          
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl xl:text-3xl font-black text-slate-900 mb-2 tracking-tight">Forgot Password</h2>
            <p className="text-slate-500 font-medium text-sm xl:text-base">We'll send you an email with a reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium rounded-xl">
                {message}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400  tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@institution.edu"
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-slate-900 text-white rounded-[1.5rem] py-4 font-black text-sm  tracking-[0.15em] shadow-xl shadow-slate-900/10 hover:shadow-sky-500/20 active:scale-[0.98] transition-all disabled:opacity-70 mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 xl:mt-12 pt-6 xl:pt-8 border-t border-slate-50 flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <CheckCircle2 size={16} className="text-sky-500" />
            <span className="text-[12px] font-black  tracking-widest text-slate-500">Secured by Intense-Cloud Architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
