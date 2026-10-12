import React, { useState } from 'react';
import {
  Pill,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Stethoscope,
  User,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  X,
  ChevronRight,
} from 'lucide-react';
import { loginUser } from '../services/api';

type LoginType = 'user' | 'doctor';
type UserSubRole = 'patient' | 'caregiver';
type DoctorSubRole = 'physician' | 'pharmacist';

interface Props {
  onLogin: (params: {
    loginType: LoginType;
    subRole: UserSubRole | DoctorSubRole;
    name: string;
    email: string;
    userId?: string;
    authProvider?: 'password' | 'google' | 'facebook';
    photoUrl?: string;
  }) => void;
  onBack: () => void;
  onNavigateToSignUp?: () => void;
  onNavigateToForgotPassword?: () => void;
}

const DEMO_USERS = {
  patient:    { email: 'patient@medbridge.app',    password: 'demo1234', name: 'Johnathan Doe' },
  caregiver:  { email: 'caregiver@medbridge.app',  password: 'demo1234', name: 'Elena Vance' },
  physician:  { email: 'physician@medbridge.app',  password: 'demo1234', name: 'Dr. Sarah Jenkins' },
  pharmacist: { email: 'pharmacist@medbridge.app', password: 'demo1234', name: 'Dr. Michael Chen' },
};

export const LoginPage: React.FC<Props> = ({ 
  onLogin, 
  onBack, 
  onNavigateToSignUp, 
  onNavigateToForgotPassword 
}) => {
  const [activeTab, setActiveTab]       = useState<LoginType>('user');
  const [userSubRole, setUserSubRole]   = useState<UserSubRole>('patient');
  const [doctorSubRole, setDoctorSubRole] = useState<DoctorSubRole>('physician');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  // ── Google Account Reflection State ──
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [storedGoogleAccount, setStoredGoogleAccount] = useState<{ name: string; email: string; avatarText: string; avatarBg: string } | null>(() => {
    try {
      const raw = localStorage.getItem('medbridge_stored_google_account');
      return raw ? JSON.parse(raw) : { name: 'Alex Morgan', email: 'alex.morgan@gmail.com', avatarText: 'AM', avatarBg: 'bg-indigo-600' };
    } catch {
      return { name: 'Alex Morgan', email: 'alex.morgan@gmail.com', avatarText: 'AM', avatarBg: 'bg-indigo-600' };
    }
  });
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  const currentSubRole    = activeTab === 'user' ? userSubRole : doctorSubRole;
  const demoCredentials   = DEMO_USERS[currentSubRole];

  const handleTabChange = (tab: LoginType) => {
    setActiveTab(tab);
    setError('');
    setEmail('');
    setPassword('');
  };

  const fillDemo = () => {
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    // Validate role-specific demo accounts to ensure single role integrity
    if (cleanEmail === 'patient@medbridge.app' && currentSubRole !== 'patient') {
      setError('This account is registered strictly as a Patient. Please select the Patient role.');
      return;
    }
    if (cleanEmail === 'caregiver@medbridge.app' && currentSubRole !== 'caregiver') {
      setError('This account is registered strictly as a Caregiver. Please select the Caregiver role.');
      return;
    }
    if (cleanEmail === 'physician@medbridge.app' && currentSubRole !== 'physician') {
      setError('This account is registered strictly as an Attending Physician. Please select the Doctor tab.');
      return;
    }
    if (cleanEmail === 'pharmacist@medbridge.app' && currentSubRole !== 'pharmacist') {
      setError('This account is registered strictly as a Pharmacist. Please select the Pharmacist role.');
      return;
    }

    setLoading(true);
    loginUser(cleanEmail, password)
      .then((res) => {
        setLoading(false);
        const loggedUser = res.user;
        const assignedRole = loggedUser.role || currentSubRole;
        const mappedLoginType = ['physician', 'pharmacist'].includes(assignedRole) ? 'doctor' : 'user';
        const displayName = loggedUser.full_name || loggedUser.name || cleanEmail.split('@')[0];
        onLogin({
          loginType: mappedLoginType,
          subRole: assignedRole as any,
          name: displayName,
          email: loggedUser.email || cleanEmail,
          userId: loggedUser.id,
          authProvider: 'password',
        });
      })
      .catch((err: any) => {
        setLoading(false);
        setError(err.message || 'Authentication failed. Please verify your credentials or sign up.');
      });
  };

  const handleConfirmGoogleLogin = (accName: string, accEmail: string, avatarText: string = 'G', avatarBg: string = 'bg-indigo-600') => {
    const acc = { name: accName, email: accEmail, avatarText, avatarBg };
    localStorage.setItem('medbridge_stored_google_account', JSON.stringify(acc));
    setStoredGoogleAccount(acc);
    setIsGoogleModalOpen(false);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onLogin({
        loginType: activeTab,
        subRole: currentSubRole as any,
        name: accName,
        email: accEmail,
        authProvider: 'google',
      });
    }, 600);
  };

  const handleSocial = (provider: 'google' | 'facebook') => {
    if (provider === 'google') {
      setIsGoogleModalOpen(true);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({
        loginType: activeTab,
        subRole:   currentSubRole as any,
        name:      'Facebook User',
        email:     'facebook@social.login',
        authProvider: 'facebook',
      });
    }, 800);
  };

  /* ── accent colours driven by tab ── */
  const accent = activeTab === 'user'
    ? { ring: 'focus:border-teal-500/60', btn: 'bg-teal-700 hover:bg-teal-600', chipActive: 'bg-teal-700/10 border-teal-600/40 text-teal-700' }
    : { ring: 'focus:border-slate-500/60', btn: 'bg-slate-700 hover:bg-slate-600', chipActive: 'bg-slate-700/10 border-slate-500/40 text-slate-700' };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Left decorative panel (hidden on mobile) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-slate-900 px-14 py-14 relative overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, #1e3a5f 0%, transparent 55%), radial-gradient(circle at 20% 80%, #0d2a2a 0%, transparent 50%)' }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center shadow-md">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            Med<span className="text-teal-400">Bridge</span>
          </span>
        </div>

        {/* Centre copy */}
        <div className="relative space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-teal-400 font-semibold">
              Healthcare & Wellness Platform
            </p>
            <h2 className="text-3xl font-black text-white leading-snug">
              Prescriptions made<br />clear, safe & managed.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Upload a prescription photo, let AI read it, get it verified by your doctor, and never miss a dose again.
            </p>
          </div>

          {/* Trust pills */}
          <div className="flex flex-col gap-3">
            {[
              { icon: '🔒', text: 'End-to-end secure data handling' },
              { icon: '✔️', text: 'Clinician-verified medication schedules' },
              { icon: '🔔', text: 'Intelligent reminders that actually help' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="text-base">{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom caption */}
        <p className="relative text-xs text-slate-600">
          © 2026 MedBridge · Google Hackathon Demo
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-slate-50">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center">
            <Pill className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Med<span className="text-teal-600">Bridge</span>
          </span>
        </div>

        <div className="w-full max-w-[400px]">

          {/* Back link */}
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium mb-6 transition-colors"
          >
            ← Back to home
          </button>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to MedBridge</h1>
            <p className="text-sm text-slate-500 mt-1">Choose your account type and continue.</p>
          </div>

          {/* User / Doctor tabs */}
          <div className="flex rounded-xl bg-slate-200/60 p-1 mb-6 gap-1">
            {(['user', 'doctor'] as LoginType[]).map((tab) => (
              <button
                key={tab}
                id={`login-tab-${tab}`}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'user' ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                {tab === 'user' ? 'Patient / Carer' : 'Doctor / Pharmacist'}
              </button>
            ))}
          </div>

          {/* Sub-role selector */}
          <div className="mb-5">
            <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
              {activeTab === 'user' ? 'I am a…' : 'My role is…'}
            </label>
            <div className="flex gap-2">
              {(activeTab === 'user'
                ? [{ id: 'patient',   label: '🧑 Patient' },   { id: 'caregiver',  label: '👩‍👧 Caregiver' }]
                : [{ id: 'physician', label: '🩺 Physician' }, { id: 'pharmacist', label: '💊 Pharmacist' }]
              ).map(({ id, label }) => {
                const isActive = currentSubRole === id;
                return (
                  <button
                    key={id}
                    id={`subrole-${id}`}
                    onClick={() => activeTab === 'user' ? setUserSubRole(id as UserSubRole) : setDoctorSubRole(id as DoctorSubRole)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      isActive
                        ? accent.chipActive
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Single role enforced: each account is locked to one role per session.</span>
            </div>
          </div>

          {/* Demo hint */}
          <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-amber-800 leading-relaxed flex-1">
              <span className="font-bold">Demo: </span>
              {demoCredentials.email} / {demoCredentials.password}
              <button
                onClick={fillDemo}
                className="ml-2 font-bold underline text-amber-700 hover:text-amber-900 transition-colors"
              >
                Auto-fill
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none ${accent.ring} focus:bg-white transition-all shadow-sm`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={onNavigateToForgotPassword}
                  className="text-[11px] text-teal-700 hover:text-teal-900 font-bold transition-colors cursor-pointer underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-11 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none ${accent.ring} focus:bg-white transition-all shadow-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg ${accent.btn} text-white font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <>
                  Continue as {currentSubRole.charAt(0).toUpperCase() + currentSubRole.slice(1)}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] text-slate-400 font-medium">or continue with</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Stored Google Account Reflection (Shown on Login if previously used or stored) */}
          {storedGoogleAccount && (
            <div className="mb-3.5 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-teal-400/80 transition-all flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-full ${storedGoogleAccount.avatarBg} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                  {storedGoogleAccount.avatarText}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">{storedGoogleAccount.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                      Google
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium truncate">{storedGoogleAccount.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleConfirmGoogleLogin(storedGoogleAccount.name, storedGoogleAccount.email, storedGoogleAccount.avatarText, storedGoogleAccount.avatarBg)}
                disabled={loading}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                Continue
              </button>
            </div>
          )}

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              id="login-google-btn"
              onClick={() => handleSocial('google')}
              disabled={loading}
              className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Google
            </button>

            <button
              id="login-facebook-btn"
              onClick={() => handleSocial('facebook')}
              disabled={loading}
              className="flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#1877F2" d="M48 24C48 10.74 37.26 0 24 0S0 10.74 0 24c0 11.98 8.77 21.91 20.25 23.71V30.94h-6.09V24h6.09v-5.29c0-6.01 3.58-9.33 9.06-9.33 2.63 0 5.38.47 5.38.47v5.91h-3.03c-2.99 0-3.92 1.86-3.92 3.76V24h6.67l-1.07 6.94H27.75V47.7C39.23 45.91 48 35.98 48 24z"/>
              </svg>
              Facebook
            </button>
          </div>

          {/* Sign up prompt */}
          <div className="mt-5 p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/90 text-center space-y-1.5">
            <p className="text-xs text-slate-700 font-bold">
              Don't have an account yet?
            </p>
            <button 
              type="button"
              onClick={onNavigateToSignUp} 
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
            >
              Sign Up (Register New Account) <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div className="pt-1">
              <button 
                type="button" 
                onClick={fillDemo} 
                className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold underline transition-colors cursor-pointer"
              >
                Or auto-fill {demoCredentials.email} credentials
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── GOOGLE SIGN-IN ACCOUNT SELECTOR MODAL ── */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Google Brand Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span className="text-base font-extrabold text-slate-900 tracking-tight">Sign in with Google</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Choose an account stored in Google to continue to MedBridge
                </p>
              </div>
              <button
                onClick={() => {
                  setIsGoogleModalOpen(false);
                  setShowCustomGoogleInput(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account List */}
            <div className="p-6 space-y-2.5 max-h-[60vh] overflow-y-auto">
              {[
                {
                  name: 'Alex Morgan',
                  email: 'alex.morgan@gmail.com',
                  avatarText: 'AM',
                  avatarBg: 'bg-indigo-600',
                  badge: 'Saved in Browser',
                },
                {
                  name: 'Dr. Aris Thorne, MD',
                  email: 'dr.thorne.clinical@gmail.com',
                  avatarText: 'AT',
                  avatarBg: 'bg-teal-700',
                  badge: 'Google Healthcare',
                },
                {
                  name: 'Elena Vance',
                  email: 'elena.vance.care@gmail.com',
                  avatarText: 'EV',
                  avatarBg: 'bg-rose-600',
                  badge: 'Family Proxy',
                },
              ].map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleConfirmGoogleLogin(acc.name, acc.email, acc.avatarText, acc.avatarBg)}
                  className="w-full p-3 rounded-2xl border border-slate-200/90 hover:border-teal-500 hover:bg-teal-50/40 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full ${acc.avatarBg} text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs`}>
                      {acc.avatarText}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 group-hover:text-teal-900 truncate">
                          {acc.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {acc.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate">{acc.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}

              {/* Custom Google Account Entry */}
              {!showCustomGoogleInput ? (
                <button
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="w-full p-3 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Use another Google account
                </button>
              ) : (
                <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900">Enter Your Google Account Details</h4>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Google Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Smith"
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Google Email Address</label>
                    <input
                      type="email"
                      placeholder="name@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomGoogleInput(false)}
                      className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!customGoogleName.trim() || !customGoogleEmail.trim()}
                      onClick={() => {
                        const initials = customGoogleName.trim().slice(0, 2).toUpperCase();
                        handleConfirmGoogleLogin(customGoogleName.trim(), customGoogleEmail.trim(), initials, 'bg-teal-700');
                      }}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                    >
                      Confirm Account
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Google Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Google Identity Services</span>
              <span>Privacy & Terms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
