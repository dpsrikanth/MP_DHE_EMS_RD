import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  School,
  Rocket,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/authApi';

const Register = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.email || '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Email Check, 2: OTP, 3: Set Password
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(300);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer <= 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const validateForm = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.email.trim()) newErrors.email = 'Institutional email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email format';
      }
    } else if (step === 3) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const sendOtp = async () => {
    setLoading(true);
    try {
      const data = await authApi.register(formData.email);
      setMessage('A 6-digit verification code has been sent to your email.');
      setStep(2);
      setTimer(300);
      setOtp('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Activation Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 1) {
      if (!validateForm()) return;
      await sendOtp();
    } else if (step === 2) {
      if (!otp || otp.length !== 6) {
        setMessage('Please enter a valid 6-digit code');
        return;
      }
      setLoading(true);
      try {
        await authApi.verifyOtp(formData.email, otp);
        setMessage('Identity Verified! Please set your new password.');
        setStep(3); // Move to Set Password step
      } catch (error) {
        setMessage(error.response?.data?.message || 'Verification Failed');
        if (error.response?.data?.message?.toLowerCase().includes('expire')) {
          setTimer(0);
        }
      } finally {
        setLoading(false);
      }
    } else if (step === 3) {
      if (!validateForm()) return;
      setLoading(true);
      try {
        await authApi.setPassword(formData.email, formData.password);
        setMessage('Password Set Successfully! Redirecting to Portal...');
        setTimeout(() => navigate('/'), 2000);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Failed to set password');
      } finally {
        setLoading(false);
      }
    }
  };

  const isSuccessMessage = message && (
    message.includes('sent to your email') || 
    message.includes('Identity Verified') || 
    message.includes('Successfully')
  );

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

      {/* Centered Registration Card (Solid White) */}
      <div className="w-full max-w-[540px] bg-white rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] px-8 sm:px-10 lg:px-12 sm:py-6 lg:py-8 relative z-10 overflow-y-auto max-h-[82vh] no-scrollbar">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-bold text-[13px] tracking-widest  group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Login</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center text-white">
              <School size={20} />
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight italic">Intense</h1>
          </div>
        </div>

        <div className="mb-6 text-center lg:text-left">
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
            {step === 1 ? 'First Access' : step === 2 ? 'Identity Check' : 'Create Access'}
          </h2>
          <p className="text-slate-500 font-medium text-[13px] leading-relaxed">
            {step === 1 
              ? 'Enter your institutional email to claim your profile' 
              : step === 2 
              ? 'Enter the secure code sent to your email'
              : 'Set a strong password to secure your account'}
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-4 duration-300 ${isSuccessMessage ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isSuccessMessage ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {isSuccessMessage ? <CheckCircle2 size={18} /> : <Rocket size={18} className="rotate-45" />}
            </div>
            <p className="text-[11px] font-bold leading-tight">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <label className="text-[13px] font-black text-slate-400  tracking-widest ml-1">Institutional Email</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@institution.edu"
                    className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm ${errors.email ? 'border-red-100 bg-red-50/30' : 'border-slate-100'}`}
                  />
                </div>
                {errors.email && <p className="text-[12px] font-bold text-red-500 ml-1 ">{errors.email}</p>}
              </div>
              
              <div className="p-4 bg-sky-50 text-sky-700 rounded-2xl border border-sky-100 text-sm font-medium">
                <strong>Note:</strong> You must have a pre-registered profile created by your administrator.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 py-4">
              <div className="space-y-2 text-center">
                <label className="text-[13px] font-black text-slate-400  tracking-widest">Enter Activation Code</label>
                <div className="relative group mt-4">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-sky-500 transition-colors pointer-events-none">
                    <ShieldCheck size={24} />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-slate-50 border-4 border-sky-50 rounded-3xl py-6 pl-16 pr-6 text-4xl tracking-[0.6em] text-slate-800 placeholder:text-slate-100 focus:bg-white focus:border-sky-500 outline-none transition-all font-black shadow-inner text-center"
                  />
                </div>
                <p className="text-[12px] font-bold text-slate-400 mt-4 ">
                  Code sent to: <span className="text-slate-900">{formData.email}</span>
                </p>
              </div>

              <div className="flex justify-center my-4">
                {timer > 0 ? (
                  <p className="text-[13px] font-bold text-slate-400  tracking-wider">
                    Resend in <span className="text-slate-700 font-extrabold">{Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={loading}
                    className="text-[13px] font-black text-sky-500 hover:text-sky-600 transition-colors underline underline-offset-4 decoration-sky-200  tracking-wider"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="text-[13px] font-bold text-sky-500 hover:text-sky-600 flex items-center justify-center gap-2 w-full transition-colors group"
              >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                Change Email
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-2">
                <label className="text-[13px] font-black text-slate-400  tracking-widest ml-1">New Password</label>
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
                    className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-14 pr-12 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm ${errors.password ? 'border-red-100 bg-red-50/30' : 'border-slate-100'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-[12px] font-bold text-red-500 ml-1 ">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-black text-slate-400  tracking-widest ml-1">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
                    <ShieldCheck size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-14 pr-12 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm ${errors.confirmPassword ? 'border-red-100 bg-red-50/30' : 'border-slate-100'}`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-[12px] font-bold text-red-500 ml-1 ">{errors.confirmPassword}</p>}
              </div>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full group relative overflow-hidden bg-slate-900 text-white rounded-[1.5rem] py-4 font-black text-sm  tracking-[0.15em] shadow-xl shadow-slate-900/10 hover:shadow-sky-500/20 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{step === 1 ? 'Initiate' : step === 2 ? 'Verify' : 'Secure'}</span>
                    <Rocket size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </>
                )}
              </div>
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-slate-500 text-sm font-medium">
          Already have an account?{' '}
          <button
            onClick={() => navigate("/")}
            className="text-sky-500 font-black hover:text-sky-600 underline underline-offset-4 decoration-sky-100"
          >
            Log In
          </button>
        </p>

        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-2 opacity-50 hover:opacity-100 transition-all duration-500">
          <CheckCircle2 size={16} className="text-sky-500" />
          <span className="text-[12px] font-black  tracking-widest text-slate-400">Institutional Security Grade</span>
        </div>
      </div>
    </div>
  );
};

export default Register;
