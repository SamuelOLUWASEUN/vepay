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

  // Scroll to top whenever the user switches between Express and Pro mode
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentMode]);

  // ── Background scroll lock — single source of truth ─────────────────────────
  // When any overlay (sidebar drawer or a modal) is open, the page behind it
  // must not scroll. Locking `body` alone is unreliable on mobile because the
  // scroll often lives on the <html> element / viewport, which is exactly why
  // the page leaked behind the drawer before. So we lock BOTH html and body.
  //
  // We use `overflow: hidden` (not `position: fixed`) deliberately: position
  // fixed resets the scroll position to the top, and the desired behavior is
  // for the page to stay exactly where it was when the overlay closes.
  const anyOverlayOpen =
    savingsOpen || profileOpen || mobileSidebarOpen || settingsOpen || devToolsOpen || Boolean(inviteModal?.open) || fingerprintOpen;

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (anyOverlayOpen) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      html.style.overflow = '';
      body.style.overflow = '';
    }
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
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
    /* Root shell */
    <div style={{ width: '100%', display: 'flex', minHeight: '100vh' }}>
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

      {/* Main — NO overflow:hidden here, it breaks position:sticky */}
      <main style={{ flex: 1, minWidth: 0, width: '100%' }}
        className={sidebarExpanded ? 'sm:ml-56' : 'sm:ml-16'}>
        {currentMode === 'EXPRESS'
          ? <ExpressDashboard
              onOpenProfile={() => setProfileOpen(true)}
              onOpenMobile={() => setMobileSidebarOpen(true)}
            />
          : <ProDashboard
              onOpenProfile={() => setProfileOpen(true)}
              onOpenMobile={() => setMobileSidebarOpen(true)}
            />}
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
