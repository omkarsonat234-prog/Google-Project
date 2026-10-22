import React, { useState } from 'react';
import { 
  Pill, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Calendar, 
  Scale, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { signUpUser, SignupPayload } from '../services/api';
import { UserRole } from '../types';

interface Props {
  onSignUpSuccess: (user: any) => void;
  onNavigateToLogin: () => void;
  onBackToWelcome: () => void;
}

export const SignUpPage: React.FC<Props> = ({ 
  onSignUpSuccess, 
  onNavigateToLogin, 
  onBackToWelcome 
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Health & Demographic details requested by user
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState('Male');
  const [weight, setWeight] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  
  // Single Role selection
  const [role, setRole] = useState<UserRole>('patient');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validation
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please provide your full name, email, and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    if (!birthDate) {
      setError('Please provide your date of birth.');
      return;
    }

    setLoading(true);
    try {
      const payload: SignupPayload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: role,
        age: age ? parseInt(age, 10) : undefined,
        gender: gender,
        weight: weight ? parseFloat(weight) : undefined,
        phone_number: phoneNumber.trim() || undefined,
        birth_date: birthDate || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        allergies: allergies.trim() || undefined,
        medical_conditions: medicalConditions.trim() || undefined,
      };

      const res = await signUpUser(payload);
      setSuccessMsg('Account registered successfully in the database! Signing you in...');
      setTimeout(() => {
        onSignUpSuccess(res.user);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Pill className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Create Patient / Clinician Account</h1>
              <p className="text-xs text-slate-300 font-medium">Register your profile to access verified prescription management</p>
            </div>
          </div>
          <button
            onClick={onNavigateToLogin}
            className="text-xs text-teal-300 hover:text-white font-bold flex items-center gap-1 transition-colors"
          >
            Sign In <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRegister} className="p-6 sm:p-8 space-y-6">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Role Selection (Single Role Policy) */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2">
              Select Your Role in MedBridge (Locked to this account)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'patient', label: '🧑 Patient', desc: 'Personal Routines & Safe Schedule Management' },
                { id: 'physician', label: '🩺 Physician / Doctor', desc: 'Attending MD & Clinical Reviews' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setRole(r.id as UserRole)}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    role === r.id
                      ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-extrabold">{r.label}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{r.desc}</p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1.5">
              🛡️ Single Role Policy: Each account is registered with one permanent role to guarantee HIPAA compliance and forensic audit trails.
            </p>
          </div>

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. johnathan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Demographic & Medical Specs: Age, Gender, Weight, Birth Date */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min="1"
                max="125"
                placeholder="Years"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-hidden focus:border-teal-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
              <div className="relative">
                <Scale className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="number"
                  step="0.1"
                  min="2"
                  max="400"
                  placeholder="e.g. 70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full pl-8 pr-2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Birth Date *</label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-teal-500"
              />
            </div>
          </div>

          {/* Contact Details: Phone Number & Emergency Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                placeholder="e.g. Jane Doe (+1 555-0199)"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
              />
            </div>
          </div>

          {/* Known Medical Conditions & Allergies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Known Medical Conditions (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Hypertension, Asthma"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Drug Allergies (Important for Safety)</label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Sulfa, None"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
              />
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Already registered? Sign In
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-black tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Registering in Database...' : 'Complete Sign Up'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
