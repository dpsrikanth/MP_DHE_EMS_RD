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
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {step === 1 ? 'First Access' : step === 2 ? 'Identity Check' : 'Create Access'}
            </h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">
              {step === 1 
                ? 'Enter your institutional email to claim your profile' 
                : step === 2 
                ? 'Enter the secure code sent to your email'
                : 'Set a strong password to secure your account'}
            </p>
          </div>

          {message && (
            <div className={`w-full mb-8 p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-4 duration-300 ${isSuccessMessage ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isSuccessMessage ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                {isSuccessMessage ? <CheckCircle2 size={18} /> : <Rocket size={18} className="rotate-45" />}
              </div>
              <p className="text-[11px] font-bold leading-tight">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-8">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 tracking-widest uppercase ml-1">Institutional Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@institution.edu"
                    className={`w-full bg-[#eef2ff] rounded-2xl py-4 px-6 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-bold ${errors.email ? 'ring-4 ring-rose-500/20' : ''}`}
                  />
                  {errors.email && <p className="text-[11px] font-bold text-rose-400 ml-1 uppercase tracking-wider">{errors.email}</p>}
                </div>
                
                <div className="p-5 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/10 text-[13px] font-medium leading-relaxed">
                  <strong>Note:</strong> You must have a pre-registered profile created by your administrator.
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in duration-500 text-center">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 tracking-widest uppercase">Enter Activation Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-[#eef2ff] rounded-2xl py-6 px-6 text-4xl tracking-[0.6em] text-slate-900 placeholder:text-slate-200 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-black text-center shadow-inner"
                  />
                  <p className="text-[11px] font-bold text-slate-500 mt-4 ">
                    Code sent to: <span className="text-white">{formData.email}</span>
                  </p>
                </div>

                <div className="flex flex-col gap-4 items-center">
                  {timer > 0 ? (
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                      Resend in <span className="text-sky-400 font-extrabold">{Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={loading}
                      className="text-[11px] font-black text-sky-400 hover:text-sky-300 transition-colors underline underline-offset-4 decoration-sky-400/30 uppercase tracking-widest"
                    >
                      Resend Code
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="text-[11px] font-black text-slate-500 hover:text-white flex items-center justify-center gap-2 transition-colors uppercase tracking-widest mt-2"
                  >
                    <ArrowLeft size={14} />
                    Change Email
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 tracking-widest uppercase ml-1">New Password</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full bg-[#eef2ff] rounded-2xl py-4 px-6 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-bold ${errors.password ? 'ring-4 ring-rose-500/20' : ''}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] font-bold text-rose-400 ml-1 uppercase tracking-wider">{errors.password}</p>}
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 tracking-widest uppercase ml-1">Confirm Password</label>
                  <div className="relative group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full bg-[#eef2ff] rounded-2xl py-4 px-6 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-bold ${errors.confirmPassword ? 'ring-4 ring-rose-500/20' : ''}`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[11px] font-bold text-rose-400 ml-1 uppercase tracking-wider">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{step === 1 ? 'Initiate' : step === 2 ? 'Verify' : 'Secure'}</span>
                  <Rocket size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-slate-400 font-medium">
            Already have an account?{' '}
            <button onClick={() => navigate("/")} className="text-sky-400 font-bold hover:underline underline-offset-4">Log In</button>
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

export default Register;
