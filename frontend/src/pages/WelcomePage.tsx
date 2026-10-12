import React from 'react';
import {
  Pill,
  ShieldCheck,
  BellRing,
  Camera,
  ArrowRight,
  Clock,
  HeartPulse,
  CheckCircle2,
  Star,
  Users,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

interface Props {
  onGetStarted: () => void;
}

export const WelcomePage: React.FC<Props> = ({ onGetStarted }) => {

  const features = [
    {
      icon: <Camera className="w-6 h-6" />,
      bg: 'bg-teal-50',
      iconColor: 'text-teal-700',
      border: 'border-teal-100',
      title: 'Snap & Extract',
      desc: 'Upload prescription photos — AI reads handwriting instantly.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      bg: 'bg-slate-100',
      iconColor: 'text-slate-700',
      border: 'border-slate-200',
      title: 'Verified Safety',
      desc: 'Every dosage is cross-checked before your routine is activated.',
    },
    {
      icon: <BellRing className="w-6 h-6" />,
      bg: 'bg-amber-50',
      iconColor: 'text-amber-700',
      border: 'border-amber-100',
      title: 'Smart Reminders',
      desc: 'Timely alerts that distinguish acknowledgment from actual intake.',
    },
    {
      icon: <Stethoscope className="w-6 h-6" />,
      bg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      border: 'border-slate-200',
      title: 'Doctor Portal',
      desc: 'Physicians verify schedules and oversee patient medication routines.',
    },
  ];

  const stats = [
    { value: '99%',  label: 'Extraction accuracy' },
    { value: '< 5s', label: 'Processing time' },
    { value: '24/7', label: 'Reminder uptime' },
    { value: '4',    label: 'Supported roles' },
  ];

  const steps = [
    { n: '01', icon: <Camera className="w-5 h-5" />,      title: 'Upload Rx',    desc: 'Photo or PDF of your prescription',     bg: 'bg-teal-700' },
    { n: '02', icon: <Sparkles className="w-5 h-5" />,    title: 'AI Reads It',  desc: 'OCR + AI extract every field precisely', bg: 'bg-slate-700' },
    { n: '03', icon: <ShieldCheck className="w-5 h-5" />, title: 'Verify',       desc: 'Doctor or pharmacist confirms accuracy',  bg: 'bg-amber-600' },
    { n: '04', icon: <BellRing className="w-5 h-5" />,    title: 'Reminders',    desc: 'Smart alerts keep you on schedule',       bg: 'bg-slate-600' },
  ];

  const testimonials = [
    { quote: "Finally I understand my mother's prescription without calling the clinic.",     name: 'Priya S.',     role: 'Caregiver',           avatar: '👩' },
    { quote: 'The verification gate caught a dosing ambiguity I would have otherwise missed.', name: 'Dr. Arjun M.', role: 'Clinical Pharmacist', avatar: '👨‍⚕️' },
    { quote: 'Reminders keep me on track even on my busiest days.',                           name: 'Rohit K.',     role: 'Patient',             avatar: '🧑' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center shadow-sm">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Med<span className="text-teal-600">Bridge</span>
            </span>
          </div>

          <nav className="hidden sm:flex items-center gap-7 text-sm text-slate-500 font-medium">
            <a href="#features"      className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works"  className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#testimonials"  className="hover:text-slate-900 transition-colors">Reviews</a>
          </nav>

          <button
            onClick={onGetStarted}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold transition-all shadow-sm"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 pt-20 pb-24 flex flex-col lg:flex-row items-center gap-14">

        {/* Left copy */}
        <div className="flex-1 text-center lg:text-left space-y-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-200 bg-teal-50 text-teal-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            AI-Powered Healthcare & Wellness
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-slate-900">
            From prescription<br />
            to a{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-teal-700">clearer routine.</span>
              <span className="absolute inset-x-0 bottom-0 h-2.5 bg-teal-100 rounded -z-10" />
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
            MedBridge turns handwritten prescriptions into verified daily medication schedules —
            with source-linked extraction, uncertainty detection, and smart reminders for
            <strong className="text-slate-900"> patients, caregivers, and doctors alike.</strong>
          </p>

          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            <button
              id="welcome-get-started-btn"
              onClick={onGetStarted}
              className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-bold text-sm shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#features"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-semibold text-sm transition-all hover:-translate-y-0.5 shadow-sm"
            >
              Learn more
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-5 justify-center lg:justify-start">
            {['Free to use', 'No credit card', 'HIPAA-ready design'].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Right — prescription preview card */}
        <div className="flex-shrink-0">
          <div className="relative w-72 sm:w-80">
            {/* Drop shadow card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-700 flex items-center justify-center shadow-sm">
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Prescription processed</p>
                  <p className="text-sm font-bold text-slate-900">Amoxicillin 500 mg</p>
                </div>
                <span className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  ✓ Verified
                </span>
              </div>

              <div className="h-px bg-slate-100" />

              {[
                { label: 'Dosage',    value: '500 mg',   color: 'text-teal-700' },
                { label: 'Frequency', value: '3× daily', color: 'text-slate-700' },
                { label: 'Duration',  value: '7 days',   color: 'text-slate-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className={`text-xs font-bold ${color}`}>{value}</span>
                </div>
              ))}

              <div className="h-px bg-slate-100" />

              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Next reminder</p>
                  <p className="text-xs font-bold text-amber-700">Today at 8:00 PM</p>
                </div>
                <BellRing className="w-4 h-4 text-amber-500 ml-auto" />
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md">
              ✓ AI Verified
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white text-slate-700 text-[10px] font-semibold px-3 py-1.5 rounded-full shadow-md border border-slate-200">
              <HeartPulse className="w-3 h-3 inline mr-1 text-rose-500" />
              Health-safe
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map(({ value, label }) => (
            <div key={label} className="space-y-1">
              <p className="text-3xl font-black text-white">{value}</p>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 sm:px-10 py-24">
        <div className="text-center mb-14 space-y-3">
          <p className="text-xs font-bold text-teal-700 uppercase tracking-widest">Features</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Everything you need for safer medication
          </h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            From prescription photo to confirmed daily schedule — with human verification at every critical step.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon, bg, iconColor, border, title, desc }) => (
            <div
              key={title}
              className={`group bg-white border ${border} rounded-2xl p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 space-y-4`}
            >
              <div className={`w-12 h-12 rounded-xl ${bg} ${iconColor} flex items-center justify-center`}>
                {icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-slate-50 border-y border-slate-100 py-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <div className="text-center mb-12 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">How it works</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">4 steps to a safe routine</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
            <div className="hidden sm:block absolute top-9 left-[12.5%] right-[12.5%] h-px bg-slate-200" />
            {steps.map(({ n, icon, title, desc, bg }) => (
              <div key={n} className="flex flex-col items-center text-center space-y-3">
                <div className={`relative w-16 h-16 rounded-2xl ${bg} flex items-center justify-center text-white shadow-md`}>
                  {icon}
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-slate-200 text-[9px] font-black text-slate-600 flex items-center justify-center shadow-sm">
                    {n}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="max-w-6xl mx-auto px-6 sm:px-10 py-24">
        <div className="text-center mb-12 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Testimonials</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Loved by patients & doctors</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name, role, avatar }) => (
            <div key={name} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:shadow-md transition-all">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">"{quote}"</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{avatar}</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{name}</p>
                  <p className="text-[11px] text-slate-500">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-5">
          <div className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">For Patients & Doctors</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Your prescription.<br />Understood. Verified. Managed.
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Join MedBridge and experience prescription clarity like never before. Create your free account in seconds.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-slate-900 font-extrabold text-sm shadow-md hover:bg-slate-100 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-8 text-center text-slate-400 text-xs bg-white">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-teal-700 flex items-center justify-center">
            <Pill className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-700">MedBridge</span>
        </div>
        <p>© 2026 MedBridge · Google Healthcare & Wellness Hackathon Project</p>
        <p className="mt-1 text-slate-300">Not a substitute for professional medical advice.</p>
      </footer>
    </div>
  );
};

export default WelcomePage;
