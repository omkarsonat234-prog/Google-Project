import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReminderAudioProvider } from './context/ReminderAudioContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DemoRunnerBar } from './components/DemoRunnerBar';
import { ReminderNotification } from './components/ReminderNotification';
import { UserRole } from './types';

// Pages
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { UploadPage } from './pages/UploadPage';
import { SchedulePage } from './pages/SchedulePage';
import { RemindersPage } from './pages/RemindersPage';
import { CaregiverPage } from './pages/CaregiverPage';
import { HistoryPage } from './pages/HistoryPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// New clinical feature pages
import { FollowUpPage } from './pages/FollowUpPage';
import { IPDDischargePage } from './pages/IPDDischargePage';
import { DiabetesTrackerPage } from './pages/DiabetesTrackerPage';
import { WoundCarePage } from './pages/WoundCarePage';
import { FormularyPage } from './pages/FormularyPage';

/* ─── App shell shown after login ─── */
function AppShell() {
  const { user, login, logout } = useAuth();
  const [screen, setScreen] = useState<'welcome' | 'login' | 'signup' | 'forgot_password' | 'app'>('welcome');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isDoctor = user.loginType === 'doctor' || user.role === 'physician' || user.role === 'pharmacist';

  const handleRefresh = () => setRefreshTrigger((prev) => prev + 1);

  // ── Welcome screen ──
  if (screen === 'welcome') {
    return <WelcomePage onGetStarted={() => setScreen('login')} />;
  }

  // ── Sign Up screen ──
  if (screen === 'signup') {
    return (
      <SignUpPage
        onSignUpSuccess={(regUser) => {
          const userRole = (regUser.role || 'patient') as UserRole;
          const mappedLoginType = ['physician', 'pharmacist'].includes(userRole) ? 'doctor' : 'user';
          login({
            name: regUser.full_name || regUser.name,
            email: regUser.email,
            role: userRole,
            loginType: mappedLoginType
          });
          setActiveTab('dashboard');
          setScreen('app');
        }}
        onNavigateToLogin={() => setScreen('login')}
        onBackToWelcome={() => setScreen('welcome')}
      />
    );
  }

  // ── Forgot Password screen ──
  if (screen === 'forgot_password') {
    return (
      <ForgotPasswordPage
        onBackToLogin={() => setScreen('login')}
        onPasswordResetSuccess={() => setScreen('login')}
      />
    );
  }

  // ── Login screen ──
  if (screen === 'login') {
    return (
      <LoginPage
        onBack={() => setScreen('welcome')}
        onNavigateToSignUp={() => setScreen('signup')}
        onNavigateToForgotPassword={() => setScreen('forgot_password')}
        onLogin={({ loginType, subRole, name, email, authProvider, photoUrl }) => {
          login({ name, email, role: subRole as UserRole, loginType, authProvider, photoUrl });
          setActiveTab('dashboard');
          setScreen('app');
        }}
      />
    );
  }

  // ── Main app ──
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-12">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={() => {
          logout();
          setScreen('welcome');
        }}
      />

      <main className="flex-1">
        {activeTab === 'landing' && (
          <LandingPage
            onGetStarted={() => setActiveTab('dashboard')}
            onExplorePresets={() => setActiveTab('upload')}
          />
        )}
        {activeTab === 'dashboard' && (
          user.loginType === 'doctor' || user.role === 'physician' || user.role === 'pharmacist' ? (
            <DoctorDashboardPage onNavigate={setActiveTab} key={refreshTrigger} />
          ) : (
            <DashboardPage onNavigate={setActiveTab} key={refreshTrigger} />
          )
        )}
        {activeTab === 'upload' && (
          <UploadPage
            onScheduleActivated={() => setActiveTab('schedules')}
            key={refreshTrigger}
          />
        )}
        {activeTab === 'schedules' && <SchedulePage key={refreshTrigger} />}
        {activeTab === 'reminders' && <RemindersPage key={refreshTrigger} />}
        {activeTab === 'history' && isDoctor && <HistoryPage key={refreshTrigger} />}
        {activeTab === 'caregiver' && <CaregiverPage key={refreshTrigger} />}
        {activeTab === 'evaluation' && <EvaluationPage key={refreshTrigger} />}

        {/* ── New Clinical Feature Pages ── */}
        {activeTab === 'followups' && <FollowUpPage key={refreshTrigger} />}
        {activeTab === 'ipd-discharge' && <IPDDischargePage key={refreshTrigger} />}
        {activeTab === 'diabetes' && <DiabetesTrackerPage key={refreshTrigger} />}
        {activeTab === 'wound-care' && <WoundCarePage key={refreshTrigger} />}
        {activeTab === 'formulary' && <FormularyPage key={refreshTrigger} />}
      </main>

      <ReminderNotification />

      <DemoRunnerBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleRefresh}
      />

      <Footer />
    </div>
  );
}

/* ─── Root ─── */
export function App() {
  return (
    <AuthProvider>
      <ReminderAudioProvider>
        <AppShell />
      </ReminderAudioProvider>
    </AuthProvider>
  );
}

export default App;
