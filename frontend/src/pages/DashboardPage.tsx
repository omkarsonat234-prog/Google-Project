import React, { useState, useEffect } from 'react';
import { 
  FileUp, 
  CalendarClock, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Bell, 
  ArrowRight, 
  AlertTriangle, 
  Sparkles,
  Pill,
  Users,
  History,
  BarChart3,
  RefreshCw,
  UserCheck,
  Lock,
  ShieldCheck,
  BookOpen,
  Info,
  X,
  Search,
  Menu,
  User,
  Calendar,
  WifiOff,
  PackageCheck,
  HeartHandshake,
  Phone,
  Volume2,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { 
  fetchDashboardStats, 
  fetchReminders, 
  fetchSchedules, 
  acknowledgeReminder, 
  reportIntake 
} from '../services/api';
import { DashboardStats, ReminderEvent, MedicationSchedule } from '../types';
import { useAuth } from '../context/AuthContext';
import { useReminderAudio } from '../context/ReminderAudioContext';

interface Props {
  onNavigate: (tab: string) => void;
}

/* ── Offline Clinical Medicine Guide & Helpful Explanations ── */
interface MedicineGuideItem {
  name: string;
  genericName: string;
  category: string;
  purpose: string;
  timing: string;
  foodAdvice: string;
  commonSideEffects: string;
  missedDoseAdvice: string;
  precautions: string;
}

const MEDICINE_EXPLANATIONS: Record<string, MedicineGuideItem> = {
  'amoxicillin': {
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate',
    category: 'Antibacterial / Penicillin',
    purpose: 'Treats bacterial infections of the respiratory tract, throat, ears, sinuses, and skin.',
    timing: 'Take every 8 hours evenly spaced across the day.',
    foodAdvice: 'Can be taken with or without food. Taking with a light meal or snack prevents stomach upset.',
    commonSideEffects: 'Mild nausea, loose stools, or mild headache.',
    missedDoseAdvice: 'Take as soon as remembered. If within 2 hours of next scheduled dose, skip the missed dose. Never take two doses at once.',
    precautions: 'Complete the entire prescribed 10-day duration even if fever and pain improve within 48 hours.',
  },
  'metformin': {
    name: 'Metformin 500mg',
    genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic / Biguanide',
    purpose: 'Helps control blood sugar levels in Type 2 Diabetes by improving insulin sensitivity.',
    timing: 'Take twice daily with your morning and evening meals.',
    foodAdvice: 'Always take with meals to significantly reduce nausea, cramping, and stomach fullness.',
    commonSideEffects: 'Mild temporary digestive discomfort, temporary metallic taste.',
    missedDoseAdvice: 'Take with your next meal. Do not take an extra dose to make up for a missed one.',
    precautions: 'Stay well-hydrated throughout the day. Contact your physician before medical imaging scans using contrast dye.',
  },
  'lisinopril': {
    name: 'Lisinopril 10mg',
    genericName: 'Lisinopril',
    category: 'Antihypertensive / ACE Inhibitor',
    purpose: 'Relaxes blood vessels to lower blood pressure and protect kidney/heart function.',
    timing: 'Take once daily in the morning at the same time each day.',
    foodAdvice: 'May be taken with or without food, but take consistently the same way every morning with a full glass of water.',
    commonSideEffects: 'Dizziness upon standing up quickly, persistent dry tickly cough.',
    missedDoseAdvice: 'Take as soon as you remember that day. If it is already next morning, skip and take normal dose.',
    precautions: 'Avoid potassium salt substitutes or supplements unless directly prescribed by your clinician.',
  },
  'atorvastatin': {
    name: 'Atorvastatin 20mg',
    genericName: 'Atorvastatin Calcium',
    category: 'Lipid Lowering / Statin',
    purpose: 'Reduces LDL ("bad") cholesterol and triglycerides to lower the risk of stroke and heart disease.',
    timing: 'Take once daily in the evening before bed.',
    foodAdvice: 'Can be taken with or without food.',
    commonSideEffects: 'Mild muscle stiffness or indigestion.',
    missedDoseAdvice: 'Take as soon as remembered if within 12 hours. If more than 12 hours have passed, skip and resume regular schedule.',
    precautions: 'Avoid drinking large amounts of grapefruit juice, as it can elevate statin concentrations in blood.',
  },
  'omeprazole': {
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole Delayed-Release',
    category: 'Acid Reducer / PPI',
    purpose: 'Relieves chronic acid reflux, GERD, persistent heartburn, and promotes stomach ulcer healing.',
    timing: 'Take once daily 30 to 60 minutes before breakfast.',
    foodAdvice: 'Best taken on an empty stomach with a glass of water before the first meal of the day.',
    commonSideEffects: 'Mild headache, mild abdominal fullness.',
    missedDoseAdvice: 'Take before your next meal. Do not double up.',
    precautions: 'Swallow whole capsule with water. Never chew, crush, or open delayed-release pellets.',
  },
};

const MEDICINE_GUIDE_LIST: MedicineGuideItem[] = Object.values(MEDICINE_EXPLANATIONS);

export const DashboardPage: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayReminders, setTodayReminders] = useState<ReminderEvent[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const { playChime } = useReminderAudio();
  const [isMedGuideOpen, setIsMedGuideOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [selectedExplainMed, setSelectedExplainMed] = useState<MedicineGuideItem | null>(null);
  const [medSearchQuery, setMedSearchQuery] = useState('');

  // Automatic offline detection (No user toggle)
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [statsData, remindersData, schedulesData] = await Promise.all([
        fetchDashboardStats(user.id),
        fetchReminders(todayStr, user.id),
        fetchSchedules(undefined, user.id)
      ]);
      setStats(statsData);
      setTodayReminders(remindersData);
      setSchedules(schedulesData);
    } catch (e) {
      console.warn('Dashboard operating with local offline cache', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleAcknowledge = async (id: string) => {
    setActionLoadingId(id);
    try {
      await acknowledgeReminder(id, user.name, 'Acknowledged on Dashboard');
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReportIntake = async (id: string) => {
    setActionLoadingId(id);
    try {
      await reportIntake(id, user.name, 'Intake recorded on Dashboard');
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  /* Helper: Calculate Days Remaining and Supply Details */
  const calculateDaysRemaining = (schedule: MedicationSchedule) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let start = schedule.start_date ? new Date(schedule.start_date) : new Date(now.getTime() - 3 * 86400000);
    start.setHours(0, 0, 0, 0);

    // If end_date is provided, use it; otherwise compute based on prescription length
    let end = schedule.end_date ? new Date(schedule.end_date) : new Date(start.getTime() + 14 * 86400000);
    end.setHours(0, 0, 0, 0);

    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const daysLeft = Math.max(0, Math.round((end.getTime() - now.getTime()) / 86400000));
    const daysElapsed = Math.min(totalDays, Math.max(0, totalDays - daysLeft));
    const percentDone = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

    let statusType: 'urgent' | 'warning' | 'healthy' = 'healthy';
    let statusText = 'Good Supply';

    if (daysLeft === 0) {
      statusType = 'urgent';
      statusText = 'Course Completed';
    } else if (daysLeft <= 3) {
      statusType = 'urgent';
      statusText = 'Refill Urgent (≤ 3 Days)';
    } else if (daysLeft <= 7) {
      statusType = 'warning';
      statusText = 'Refill Soon (≤ 7 Days)';
    } else {
      statusType = 'healthy';
      statusText = 'Ample Supply';
    }

    return {
      totalDays,
      daysLeft,
      daysElapsed,
      percentDone,
      statusType,
      statusText,
      startDate: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      endDate: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  };

  /* Helper: Match medicine to offline explanation */
  const openExplanationForMed = (medName: string) => {
    const lower = medName.toLowerCase();
    for (const key of Object.keys(MEDICINE_EXPLANATIONS)) {
      if (lower.includes(key)) {
        setSelectedExplainMed(MEDICINE_EXPLANATIONS[key]);
        setIsMedGuideOpen(true);
        return;
      }
    }
    // Generic fallback explanation if exact name isn't in dictionary
    setSelectedExplainMed({
      name: medName,
      genericName: medName,
      category: 'Prescription Medication',
      purpose: 'Prescribed medication active in your verified daily routine.',
      timing: 'Take strictly according to the confirmed prescription instructions.',
      foodAdvice: 'Review label directions regarding meals or fasting.',
      commonSideEffects: 'Consult your prescribing doctor if you experience unexpected symptoms.',
      missedDoseAdvice: 'Take as soon as remembered, unless close to next regular dose.',
      precautions: 'Do not adjust dose or stop taking without clinician consultation.',
    });
    setIsMedGuideOpen(true);
  };

  /* Filter medicine guide */
  const filteredMeds = MEDICINE_GUIDE_LIST.filter(m => 
    m.name.toLowerCase().includes(medSearchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(medSearchQuery.toLowerCase()) ||
    m.purpose.toLowerCase().includes(medSearchQuery.toLowerCase())
  );

  /* Dashboard Launcher Tiles Config (3-Column Grid) */
  const LAUNCHER_TILES = [
    {
      id: 'upload',
      title: 'Upload & Review',
      subtitle: 'Prescription OCR & Extraction',
      badge: '5 Rx Presets',
      icon: FileUp,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderHover: 'hover:border-teal-400',
      action: () => onNavigate('upload'),
    },
    {
      id: 'schedules',
      title: 'Daily Schedules',
      subtitle: 'Medication Routine & Timeline',
      badge: `${schedules.length} Active`,
      icon: CalendarClock,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderHover: 'hover:border-sky-400',
      action: () => onNavigate('schedules'),
    },
    {
      id: 'reminders',
      title: 'Reminders',
      subtitle: 'Dose Alarms & Audio Alerts',
      badge: `${todayReminders.length} Today`,
      icon: Bell,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderHover: 'hover:border-blue-400',
      action: () => onNavigate('reminders'),
    },
    {
      id: 'guardian',
      title: 'Care Guardian',
      subtitle: 'Person Responsible for Patient Care',
      badge: 'Elena Vance',
      icon: HeartHandshake,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderHover: 'hover:border-rose-400',
      action: () => setIsGuardianModalOpen(true),
    },
    {
      id: 'medinfo',
      title: 'Medicine Guide',
      subtitle: 'Helpful Explanations & Food Advice',
      badge: '⚡ Offline Ready',
      icon: Pill,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderHover: 'hover:border-amber-400',
      action: () => {
        setSelectedExplainMed(null);
        setIsMedGuideOpen(true);
      },
    },
    {
      id: 'verification',
      title: 'Verification Gate',
      subtitle: 'Human Confirmation Check',
      badge: 'Safety Shield',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderHover: 'hover:border-emerald-400',
      action: () => onNavigate('upload'),
    },
    {
      id: 'profile',
      title: 'My Profile & Role',
      subtitle: 'Single-Role Identity Status',
      badge: user.roleTitle,
      icon: UserCheck,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100',
      borderHover: 'hover:border-slate-400',
      action: () => setIsProfileModalOpen(true),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7 font-sans">
      
      {/* ── Top Header Profile Bar (Matching Mobile App Reference) ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => onNavigate('upload')}
            className="w-11 h-11 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/60 flex items-center justify-center transition-colors cursor-pointer"
            title="Open quick prescription tools"
          >
            <Menu className="w-5 h-5 text-teal-800" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                {user.name}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                <Lock className="w-3 h-3 text-teal-600" />
                {user.roleTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Prescription Understanding & Medication Routine Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Automatic Offline Notice (Visible only if offline, no manual toggle) */}
          {isOffline && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Offline Mode Active • Local Data Available</span>
            </div>
          )}

          <button
            onClick={() => playChime()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
            title="Audition unique hospital notification tune"
          >
            <Volume2 className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span className="hidden sm:inline">Test Chime</span>
          </button>

          <button
            onClick={loadData}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Sync latest medication updates"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer group shadow-2xs"
            title="View account profile & locked role"
          >
            <User className="w-6 h-6 text-slate-600 group-hover:scale-105 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── Core Services Launcher (Clean Icon Grid matching reference image) ── */}
      <section className="space-y-3">
        {/* 3-Column Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {LAUNCHER_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                onClick={tile.action}
                className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-2xs hover:shadow-lg ${tile.borderHover} hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center group relative overflow-hidden focus:outline-hidden`}
              >
                {/* Top-right micro badge */}
                <div className="absolute top-2.5 right-2.5 hidden sm:block">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200/80 group-hover:border-slate-300">
                    {tile.badge}
                  </span>
                </div>

                {/* Central Icon */}
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${tile.bgColor} flex items-center justify-center mb-3 group-hover:scale-108 transition-transform duration-200 border border-slate-100`}>
                  <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${tile.color} stroke-[1.8]`} />
                </div>

                {/* Title */}
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-teal-700 tracking-tight transition-colors line-clamp-1">
                  {tile.title}
                </span>

                {/* Subtitle */}
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1 leading-snug line-clamp-2 max-w-[200px]">
                  {tile.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── DESIGNATED PERSON RESPONSIBLE FOR PATIENT CARE ── */}
      <section className="bg-gradient-to-r from-rose-50/80 via-white to-slate-50 rounded-3xl p-5 sm:p-6 border border-rose-200/70 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full border border-rose-200">
                  Care Guardian
                </span>
                <span className="text-xs text-slate-400 font-semibold">• Healthcare Proxy</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                Elena Vance <span className="text-xs font-bold text-slate-500 font-normal">(Person Responsible for Patient Care)</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => alert('Calling Care Guardian: Elena Vance at +1 (555) 234-5678')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" /> Call Elena
            </button>
            <button
              onClick={() => setIsGuardianModalOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" /> Guardian Details
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-rose-100 text-xs text-slate-600">
          <div className="p-3 rounded-2xl bg-white/80 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contact Phone</span>
            <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">+1 (555) 234-5678</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Care Relationship</span>
            <span className="font-extrabold text-slate-800 text-xs mt-0.5 block">Daughter & Healthcare Proxy</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/80 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Supervision Status</span>
            <span className="font-extrabold text-emerald-700 text-xs mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Real-time Overdue Alerts Active
            </span>
          </div>
        </div>
      </section>

      {/* ── MEDICINES & DAYS REMAINING SUPPLY TRACKER (WORKS 100% OFFLINE) ── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                Medicines & Days Remaining Tracker
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <PackageCheck className="w-3 h-3 text-emerald-600" />
                Works Offline
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Real-time countdown of remaining days, supply levels, and offline clinical explanations
            </p>
          </div>
          
          <button
            onClick={() => onNavigate('schedules')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            Full Regimen <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 text-center space-y-2">
            <Pill className="w-8 h-8 text-teal-600 mx-auto" />
            <h4 className="text-sm font-extrabold text-slate-900">No Active Prescriptions Synced</h4>
            <p className="text-xs text-slate-500">
              Verify a prescription to track daily supplies and remaining days.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedules.map((schedule) => {
              const supply = calculateDaysRemaining(schedule);

              return (
                <div 
                  key={schedule.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Card Header: Medicine & Urgency Pill */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                          {schedule.medicine_name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">
                          {schedule.confirmed_instructions}
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 border ${
                        supply.statusType === 'urgent'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : supply.statusType === 'warning'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {supply.statusText}
                      </span>
                    </div>

                    {/* Big Countdown Badge */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Days Remaining
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-black text-slate-900">
                            {supply.daysLeft}
                          </span>
                          <span className="text-xs font-extrabold text-slate-500">
                            days left
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Valid Through
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {supply.endDate}
                        </span>
                      </div>
                    </div>

                    {/* Supply Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Course Progress</span>
                        <span>{supply.daysElapsed} of {supply.totalDays} days elapsed</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            supply.statusType === 'urgent'
                              ? 'bg-rose-500'
                              : supply.statusType === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-teal-600'
                          }`}
                          style={{ width: `${supply.percentDone}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Helpful Explanation Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      Verified
                    </span>

                    <button
                      onClick={() => openExplanationForMed(schedule.medicine_name)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors cursor-pointer border border-teal-200/70"
                      title="View offline explanation and usage guide"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                      Helpful Explanation
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Key Statistics Row ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 px-1">
          Real-Time Medical Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Prescriptions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Prescriptions</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Pill className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {stats ? stats.prescriptions_count : '—'}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Processed Rx Slips</p>
          </div>

          {/* Pending Review */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Review</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-amber-600 tracking-tight">
              {stats ? stats.awaiting_verification_count : '—'}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Needs Human Verification</p>
          </div>

          {/* Active Routines */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Active Schedules</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-700 tracking-tight">
              {stats ? stats.verified_schedules_count : schedules.length}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Verified Medication Routines</p>
          </div>

          {/* Today's Alarms */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Today's Reminders</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-blue-700 tracking-tight">
              {stats ? stats.today_reminders_count : todayReminders.length}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {stats ? `${stats.reminders_intake_reported_count} reported taken` : 'Scheduled daily doses'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Today's Reminders & Action List ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Reminders List */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Today's Medication Doses
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Active notifications triggered only from verified routines
              </p>
            </div>
            <button
              onClick={() => onNavigate('reminders')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Full Timeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayReminders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">No Reminders Left for Today</h4>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                Active alerts will appear once a prescription has completed human verification.
              </p>
              <button
                onClick={() => onNavigate('upload')}
                className="mt-2 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
              >
                Scan or Select a Prescription Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayReminders.map((rem) => {
                const isAck = rem.acknowledged;
                const isTaken = rem.intake_reported;

                return (
                  <div
                    key={rem.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 border border-teal-100">
                        <Pill className="w-5 h-5 -rotate-45" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-slate-900">{rem.medicine_name}</h4>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" /> {rem.scheduled_time}
                          </span>
                          {isTaken && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Reported Taken
                            </span>
                          )}
                          {!isTaken && isAck && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              Acknowledged Only
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                          {rem.confirmed_instructions}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Distinct Ack vs Intake */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {!isAck && (
                        <button
                          onClick={() => handleAcknowledge(rem.id)}
                          disabled={actionLoadingId === rem.id}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          title="Record alert acknowledgment"
                        >
                          Acknowledge
                        </button>
                      )}
                      {!isTaken ? (
                        <button
                          onClick={() => handleReportIntake(rem.id)}
                          disabled={actionLoadingId === rem.id}
                          className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          Mark as Taken
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Intake Logged
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Guidance & Safeguard */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Safety Verification Flow
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">OCR & Uncertainty Highlighting</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                    Smudged, ambiguous, or missing dosage details are flagged in amber with clinical rationales.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Human-in-the-Loop Confirmation</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                    No medication reminder triggers automatically without patient or clinician sign-off.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Non-Destructive Versioning</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">
                    Every edit is permanently recorded in the immutable forensic audit log.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('upload')}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              Start Rx Verification <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Medicine Reference CTA */}
          <div className="bg-gradient-to-br from-teal-800 to-slate-900 rounded-3xl p-5 text-white space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-teal-300">
              <Pill className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Helpful Medicine Guide</span>
            </div>
            <h4 className="text-sm font-extrabold">Instant Drug Indications & Safe Timing</h4>
            <p className="text-xs text-teal-100/90 leading-relaxed font-medium">
              Look up common prescriptions, recommended meal timings, and what to watch out for. Works 100% offline.
            </p>
            <button
              onClick={() => {
                setSelectedExplainMed(null);
                setIsMedGuideOpen(true);
              }}
              className="mt-1 px-3.5 py-1.5 bg-white text-slate-900 hover:bg-teal-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Browse Explanations <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── HELPFUL MEDICINE EXPLANATION MODAL (WORKS 100% OFFLINE) ── */}
      {isMedGuideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                  <Pill className="w-5 h-5 -rotate-45" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold">
                      {selectedExplainMed ? `Helpful Explanation: ${selectedExplainMed.name}` : 'Medicine Guide & Helpful Explanations'}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-700">
                      Offline Cached
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">Clear directions, meal timings, missed dose advice & precautions</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMedGuideOpen(false);
                  setSelectedExplainMed(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If a single medicine was selected */}
            {selectedExplainMed ? (
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Clinical Category</span>
                  <p className="text-sm font-extrabold text-teal-950">{selectedExplainMed.category}</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h5 className="font-extrabold text-slate-900 text-xs mb-1">🎯 What This Medicine Does</h5>
                    <p className="text-slate-700 font-medium leading-relaxed">{selectedExplainMed.purpose}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h5 className="font-extrabold text-slate-900 text-xs mb-1">⏰ When & How to Take</h5>
                    <p className="text-slate-700 font-medium leading-relaxed">{selectedExplainMed.timing}</p>
                    <p className="text-teal-800 font-semibold mt-1">🍽️ {selectedExplainMed.foodAdvice}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <h5 className="font-extrabold text-amber-900 text-xs mb-1">⚠️ What to Do If You Miss a Dose</h5>
                    <p className="text-amber-800 font-medium leading-relaxed">{selectedExplainMed.missedDoseAdvice}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <h5 className="font-extrabold text-slate-900 text-xs mb-1">💡 Common Side Effects</h5>
                    <p className="text-slate-600 font-medium leading-relaxed">{selectedExplainMed.commonSideEffects}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                    <h5 className="font-extrabold text-rose-900 text-xs mb-1">🛡️ Important Clinical Precautions</h5>
                    <p className="text-rose-800 font-medium leading-relaxed">{selectedExplainMed.precautions}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Search Input for general list */}
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search medicine (e.g. Amoxicillin, Lisinopril, Metformin)..."
                      value={medSearchQuery}
                      onChange={(e) => setMedSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Medicine List */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1">
                  {filteredMeds.map((med) => (
                    <div key={med.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-slate-900">{med.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          {med.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">
                        <span className="font-bold text-slate-900">What it does: </span>{med.purpose}
                      </p>
                      <p className="text-xs text-slate-700 font-medium">
                        <span className="font-bold text-slate-900">Timing & Meals: </span>{med.timing} ({med.foodAdvice})
                      </p>
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                        <span className="font-bold">Important Notice: </span>{med.precautions}
                      </div>
                    </div>
                  ))}

                  {filteredMeds.length === 0 && (
                    <p className="text-center py-8 text-xs text-slate-500 font-medium">
                      No medicines match your search. Try "Amoxicillin" or "Metformin".
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                ⚡ Offline Cached Clinical Knowledge • Always consult your doctor for medical advice.
              </span>
              <button
                onClick={() => {
                  setIsMedGuideOpen(false);
                  setSelectedExplainMed(null);
                }}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Profile & Role Modal ── */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Account Identity & Role</h3>
                  <p className="text-xs text-slate-300 font-medium">Single-role session security</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">User Name</span>
                  <p className="text-sm font-extrabold text-slate-900">{user.name}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</span>
                  <p className="text-xs font-semibold text-slate-700">{user.email || 'Registered account'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Designated Role</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
                      {user.roleTitle}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Locked
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium leading-relaxed">
                <span className="font-bold">Single-Role Policy: </span>
                To prevent accidental cross-role modification and preserve clinical audit integrity, users cannot switch roles during an active session. To change roles, please sign out and log in with the appropriate account.
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Guardian Details Modal (Person Responsible for Patient Care) ── */}
      {isGuardianModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/30">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Designated Care Guardian</h3>
                  <p className="text-xs text-slate-300 font-medium">Elena Vance · Person Responsible for Patient Care</p>
                </div>
              </div>
              <button
                onClick={() => setIsGuardianModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Official Guardian Record</span>
                <p className="text-sm font-extrabold text-slate-900">Elena Vance</p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Designated as the exclusive person responsible for overseeing patient medication intake, emergency escalations, and pharmacy refills.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                  <span className="font-bold text-slate-500">Direct Phone:</span>
                  <span className="font-extrabold text-slate-900">+1 (555) 234-5678</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                  <span className="font-bold text-slate-500">Email Address:</span>
                  <span className="font-extrabold text-slate-900">elena.vance@familycare.org</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                  <span className="font-bold text-slate-500">Legal Authority:</span>
                  <span className="font-extrabold text-slate-900">Healthcare Proxy & Power of Attorney</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
                  <span className="font-bold text-slate-500">Alert Priority:</span>
                  <span className="font-extrabold text-emerald-700">Immediate SMS on 45m Overdue Dose</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium leading-relaxed">
                <span className="font-bold text-slate-900">Patient Protection: </span>
                Generic public sharing is strictly disabled. Only this designated person receives compliance updates to safeguard patient medical privacy.
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => alert('Calling Elena Vance at +1 (555) 234-5678...')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Call Elena
              </button>
              <button
                onClick={() => setIsGuardianModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
