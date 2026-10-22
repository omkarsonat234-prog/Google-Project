import React from 'react';
import { 
  Pill, 
  LayoutDashboard, 
  FileUp, 
  CalendarClock, 
  Bell, 
  Users, 
  History, 
  BarChart3, 
  UserCheck, 
  Lock,
  LogOut,
  WifiOff,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab, onLogout }) => {
  const { user } = useAuth();
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isDoctor = user.loginType === 'doctor' || user.role === 'physician' || user.role === 'pharmacist';

  const navItems = isDoctor
    ? [
        { id: 'dashboard',    label: 'Clinical Dashboard', icon: LayoutDashboard },
        { id: 'upload',       label: 'Rx Review Queue',    icon: FileUp },
        { id: 'schedules',    label: 'Patient Regimens',   icon: CalendarClock },
        { id: 'formulary',    label: 'Formulary',          icon: BarChart3 },
        { id: 'ipd-discharge',label: 'IPD Discharge',      icon: Users },
        { id: 'followups',    label: 'Follow-ups',         icon: UserCheck },
        { id: 'history',      label: 'Audit Trail',        icon: History },
      ]
    : [
        { id: 'dashboard',    label: 'Dashboard',          icon: LayoutDashboard },
        { id: 'upload',       label: 'Upload & Review',    icon: FileUp },
        { id: 'schedules',    label: 'Schedules',          icon: CalendarClock },
        { id: 'reminders',    label: 'Reminders',          icon: Bell },
        { id: 'caregiver',    label: 'Caregiver',          icon: HeartHandshake },
        { id: 'followups',    label: 'Follow-ups',         icon: UserCheck },
        { id: 'diabetes',     label: 'Sugar Tracker',      icon: BarChart3 },
        { id: 'wound-care',   label: 'Wound Care',         icon: History },
        { id: 'formulary',    label: 'Medicines',          icon: Users },
        { id: 'ipd-discharge',label: 'IPD Discharge',      icon: FileUp },
      ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Pill className="w-5 h-5 -rotate-45" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                  Med<span className="text-brand-600">Bridge</span>
                </span>
                <span className="hidden md:block text-[11px] text-slate-400 font-medium leading-none">
                  Prescription Understanding & Medication Routine Assistant
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Side: Offline status, Locked Role badge, User info & Logout */}
          <div className="flex items-center gap-2">
            {isOffline && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold"
                title="Working offline. Local schedules, days remaining, and medicine explanations are available."
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Offline Mode</span>
              </div>
            )}

            {/* Locked Single Role Badge */}
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium select-none"
              title={`Role locked to ${user.roleTitle}. A user can only play one role in this session. Sign out to switch roles.`}
            >
              <UserCheck className="w-4 h-4 text-brand-600" />
              <div className="hidden sm:block text-left">
                <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Account Role</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  {user.roleTitle}
                  <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
                </span>
              </div>
              <span className="sm:hidden font-bold text-slate-800 flex items-center gap-1">
                {user.role === 'physician' ? 'Physician' : user.role === 'pharmacist' ? 'Pharmacist' : user.role === 'caregiver' ? 'Caregiver' : 'Patient'}
                <Lock className="w-3 h-3 text-slate-400" />
              </span>
            </div>

            {/* Logged-in user name */}
            {user.isLoggedIn && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                {user.authProvider === 'google' ? (
                  <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-teal-700 text-white text-[10px] font-bold flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900 max-w-[110px] truncate leading-tight">{user.name}</span>
                  {user.authProvider === 'google' && (
                    <span className="text-[9px] font-bold text-teal-700 uppercase tracking-wider">Google Acct</span>
                  )}
                </div>
              </div>
            )}

            {/* Logout button */}
            {onLogout && (
              <button
                id="navbar-logout-btn"
                onClick={onLogout}
                title="Sign out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 text-slate-600 text-xs font-semibold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
