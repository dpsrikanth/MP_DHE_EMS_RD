import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  School,
  Sparkles,
  Target,
  Rocket,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
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
      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'Activation Failed');
        return;
      }

      setMessage('A 6-digit verification code has been sent to your email.');
      setStep(2);
      setTimer(300);
      setOtp('');
    } catch (error) {
      setMessage('Network error. Please try again.');
      console.error('Error:', error);
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
        const response = await fetch('http://localhost:8080/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, otp: otp })
        });

        const data = await response.json();
        if (!response.ok) {
          setMessage(data.message || 'Verification Failed');
          if (data.message && data.message.toLowerCase().includes('expire')) {
            setTimer(0);
          }
          return;
        }

        setMessage('Identity Verified! Please set your new password.');
        setStep(3); // Move to Set Password step
      } catch (error) {
        setMessage('Verification error. Please try again.');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    } else if (step === 3) {
      if (!validateForm()) return;
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8080/api/set-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });

        const data = await response.json();
        if (!response.ok) {
          setMessage(data.message || 'Failed to set password');
          return;
        }

        setMessage('Password Set Successfully! Redirecting to Portal...');
        setTimeout(() => navigate('/'), 2000);
      } catch (error) {
        setMessage('Error setting password. Please try again.');
        console.error('Error:', error);
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
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Left Panel: Information & Branding */}
      <div className="relative flex-1 bg-slate-900 overflow-hidden hidden lg:flex flex-col justify-center p-16 xl:p-24 overflow-y-auto">
        {/* Abstract Background Design */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-sky-500 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-xl">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 font-bold text-sm tracking-widest uppercase group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Back to Login</span>
          </button>

          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <School size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight italic leading-none mb-1">EMS<span className="text-sky-400 not-italic ml-1">Admin</span></h1>
              <p className="text-sky-400/80 font-bold text-[10px] tracking-[0.2em] uppercase">Enterprise Suite</p>
            </div>
          </div>

          <h2 className="text-5xl font-black text-white leading-[1.1] mb-8 tracking-tight">
            Design your <span className="text-sky-400 underline decoration-sky-500/30 underline-offset-8">Ideal</span> Academic Ecosystem.
          </h2>

          <p className="text-lg text-slate-400 font-medium mb-12 leading-relaxed">
            Join the elite network of educational institutions utilizing our cloud-native management platform for unmatched institutional efficiency.
          </p>

          <div className="grid grid-cols-2 gap-8 mb-16">
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5">
              <CheckCircle2 className="text-sky-400 mb-4" size={24} />
              <h4 className="text-white font-bold mb-1">Pre-Authorized</h4>
              <p className="text-sm text-slate-500 leading-snug">Synced with official institution records.</p>
            </div>
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5">
              <ShieldCheck className="text-indigo-400 mb-4" size={24} />
              <h4 className="text-white font-bold mb-1">OTP Verified</h4>
              <p className="text-sm text-slate-500 leading-snug">Secure activation for your student identity.</p>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-[2rem] p-8 border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 100}`} alt="avatar" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-slate-300">Trusted by 200+ Institutions</p>
            </div>
            <p className="text-slate-400 text-xs italic leading-relaxed">
              "The transition was seamless. EMSAdmin has redefined how we handle our semesterly examinations and grading."
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Registration Form */}
      <div className="w-full lg:w-[600px] bg-white flex flex-col p-8 sm:p-12 lg:p-20 relative overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-white">
              <School size={24} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight italic">EMS<span className="text-sky-500">Admin</span></h1>
          </div>
          <button onClick={() => navigate('/')} className="text-sm font-bold text-sky-500">Login</button>
        </div>

        <div className="max-w-md mx-auto lg:mx-0 w-full my-auto py-10">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              {step === 1 ? 'First Time Access' : step === 2 ? 'Identity Check' : 'Create Credentials'}
            </h2>
            <p className="text-slate-500 font-medium">
              {step === 1 
                ? 'Enter your institutional email to claim your profile' 
                : step === 2 
                ? 'Enter the secure code sent to your email'
                : 'Set a strong password to secure your account'}
            </p>
          </div>

          {message && (
            <div className={`mb-8 p-5 rounded-2xl flex items-center gap-4 border animate-in slide-in-from-top-4 duration-300 ${isSuccessMessage ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSuccessMessage ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {isSuccessMessage ? <CheckCircle2 size={20} /> : <Rocket size={20} className="rotate-45" />}
              </div>
              <p className="text-sm font-bold leading-tight">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Email</label>
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
                      className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-14 pr-6 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm ${errors.email ? 'border-red-200 bg-red-50/50' : 'border-slate-100'}`}
                    />
                  </div>
                  {errors.email && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.email}</p>}
                </div>
                
                <div className="p-4 bg-sky-50 text-sky-800 rounded-2xl border border-sky-100/50 text-sm font-medium">
                  <strong>Note:</strong> You must have a pre-registered profile created by your administrator before you can claim your account.
                </div>
              </div>
            )}

            {step === 2 && (

              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 py-4">
                <div className="space-y-2 text-center">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Enter Activation Code</label>
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
                  <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">
                    Code sent to: <span className="text-slate-900">{formData.email}</span>
                  </p>
                </div>

                <div className="flex justify-center my-4">
                  {timer > 0 ? (
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Resend code in <span className="text-slate-700 font-extrabold">{Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={loading}
                      className="text-xs font-black text-sky-500 hover:text-sky-600 transition-colors underline underline-offset-4 decoration-sky-200 uppercase tracking-wider"
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>

                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="text-xs font-bold text-sky-500 hover:text-sky-600 flex items-center justify-center gap-2 w-full transition-colors group"
                >
                  <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                  Change Email Address
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
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
                      className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-14 pr-12 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm ${errors.password ? 'border-red-200 bg-red-50/50' : 'border-slate-100'}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.password}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
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
                      className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-14 pr-12 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm ${errors.confirmPassword ? 'border-red-200 bg-red-50/50' : 'border-slate-100'}`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}


            <div className="pt-4">
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
                      <span>{step === 1 ? 'Initiate Activation' : step === 2 ? 'Verify & Continue' : 'Secure Account'}</span>
                      <Rocket size={18} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>

          <p className="mt-12 text-center text-slate-500 text-sm font-medium">
            Already have an account?{' '}
            <button
              onClick={() => navigate("/")}
              className="text-sky-500 font-black hover:text-sky-600 underline underline-offset-4 decoration-sky-200"
            >
              Log In Instead
            </button>
          </p>

          <div className="mt-16 pt-8 border-t border-slate-50 flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <CheckCircle2 size={16} className="text-sky-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Enterprise grade institutional security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
