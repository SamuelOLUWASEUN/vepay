import { useMemo, useState, useEffect } from 'react';
import { ClearSpendProvider, useClearSpend } from './context/ClearSpendContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpressDashboard } from './components/express/ExpressDashboard';
import { ProDashboard } from './components/pro/ProDashboard';
import { Sidebar, DevToolsModal } from './components/shared/Sidebar';
import { Toast } from './components/shared/Toast';
import { AgenticOptimizerModal } from './components/shared/AgenticOptimizerModal';
import { InviteLinkModal } from './components/shared/InviteLinkModal';
import { FinancialFingerprintModal } from './components/shared/FinancialFingerprintModal';
import { SettingsModal } from './components/shared/SettingsModal';
import { SavingsPage } from './components/shared/SavingsPage';
import { ProfilePage } from './components/shared/ProfilePage';
import { SignInPage } from './components/auth/SignInPage';
import { QuickLogFAB } from './components/express/QuickLogFAB';
import { formatConverted } from './lib/currency';

function VepayApp() {
  const {
    currentMode, inviteModal, closeInviteModal,
    expenses, displayCurrency, fingerprintOpen,
  } = useClearSpend();
  const { isAuthenticated } = useAuth();

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Lock body scroll when any full-screen overlay is open
  const anyOverlayOpen = savingsOpen || profileOpen || mobileSidebarOpen;
  useEffect(() => {
    if (anyOverlayOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [anyOverlayOpen]);

  const inviteProps = useMemo(() => {
    if (!inviteModal?.open) return null;
    const expense = expenses.find((e) => e.id === inviteModal.expenseId);
    if (!expense || !expense.sharedGroup) return null;
    const memberCount = expense.sharedGroup.pendingMembers.length + 2;
    const perPerson = expense.amount / memberCount;
    return {
      groupName: expense.sharedGroup.name,
      totalAmount: formatConverted(expense.amount, expense.currency, displayCurrency),
      perPersonAmount: formatConverted(perPerson, expense.currency, displayCurrency),
      pendingCount: expense.sharedGroup.pendingMembers.length,
    };
  }, [inviteModal, expenses, displayCurrency]);

  if (!isAuthenticated) return <SignInPage />;

  return (
    <div className="flex min-h-screen font-sans">
      <Sidebar
        expanded={sidebarExpanded}
        mobileOpen={mobileSidebarOpen}
        onToggleExpanded={() => setSidebarExpanded((v) => !v)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onOpenMobile={() => setMobileSidebarOpen(true)}
        onOpenDevTools={() => setDevToolsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSavings={() => setSavingsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main className={[
        'flex-1 transition-[margin] duration-300 min-w-0',
        sidebarExpanded ? 'sm:ml-56' : 'sm:ml-16',
      ].join(' ')}>
        {currentMode === 'EXPRESS' ? <ExpressDashboard /> : <ProDashboard />}
      </main>

      {/* Global overlays */}
      <Toast />
      <AgenticOptimizerModal />
      <DevToolsModal open={devToolsOpen} onClose={() => setDevToolsOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {fingerprintOpen && <FinancialFingerprintModal />}
      {savingsOpen && <SavingsPage onClose={() => setSavingsOpen(false)} />}
      {profileOpen && <ProfilePage onClose={() => setProfileOpen(false)} />}

      {/* Floating quick-log — Express only */}
      {currentMode === 'EXPRESS' && <QuickLogFAB />}

      {inviteModal?.open && inviteProps && (
        <InviteLinkModal
          open
          link={inviteModal.link}
          groupName={inviteProps.groupName}
          totalAmount={inviteProps.totalAmount}
          perPersonAmount={inviteProps.perPersonAmount}
          pendingCount={inviteProps.pendingCount}
          onClose={closeInviteModal}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ClearSpendProvider>
        <VepayApp />
      </ClearSpendProvider>
    </AuthProvider>
  );
}
