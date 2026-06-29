import { BannerStack } from '../shared/BannerStack';
import { WeeklyPlanCard } from '../shared/WeeklyPlanCard';
import { SpendForecast } from '../shared/SpendForecast';
import { CurrencySegmentToggle } from './CurrencySegmentToggle';
import { BurnRateMeter } from './BurnRateMeter';
import { ApiCostTracker } from './ApiCostTracker';
import { SoftwareROI } from './SoftwareROI';
import { HealthScore } from './HealthScore';
import { PremiumOverlay } from './PremiumOverlay';
import { TrialCountdownCards } from './TrialCountdownCards';
import { SyndicateCard } from './SyndicateCard';
import { SaaSExpenseList } from './SaaSExpenseList';
import { SubscriptionGraveyard } from './SubscriptionGraveyard';
import { ReconciliationPanel } from './ReconciliationPanel';
import { MobileMenuButton } from '../shared/Sidebar';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onOpenProfile: () => void;
  onOpenMobile: () => void;
}

export function ProDashboard({ onOpenProfile, onOpenMobile }: Props) {
  const { user } = useAuth();

  return (
    <div style={{ width: '100%' }} className="min-h-screen bg-pro-bg pb-16">

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'var(--pro-bg)',
        borderBottom: '1px solid var(--pro-border)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.2)',
      }}
      className="vepay-sticky-header"
      >
        <div style={{ maxWidth: '672px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <MobileMenuButton onClick={onOpenMobile} tone="pro" />
            <div style={{ minWidth: 0 }}>
              <p className="font-display font-extrabold text-pro-ink" style={{ fontSize: '20px', margin: 0, lineHeight: 1.2 }}>Vepay</p>
              <p style={{ fontSize: '11px', color: 'var(--pro-muted)', margin: 0 }}>Pro Mode · Subscription OS</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <CurrencySegmentToggle />
            {user && (
              <button
                type="button"
                onClick={onOpenProfile}
                style={{
                  width: '34px', height: '34px',
                  borderRadius: '10px',
                  background: user.avatarColor,
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-label="View profile"
              >
                {user.initials}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: '672px', margin: '0 auto', padding: '16px 16px 0', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '16px' }}>
          <BannerStack mode="PRO" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SpendForecast mode="PRO" />
          <ApiCostTracker />
          <HealthScore />
          <WeeklyPlanCard mode="PRO" />
          <SoftwareROI />
          <PremiumOverlay />
          <TrialCountdownCards />
          <SyndicateCard />
          {/* Burn rate sits directly above the subscription list — same story */}
          <BurnRateMeter />
          <SaaSExpenseList />
          <ReconciliationPanel />
          <SubscriptionGraveyard />
        </div>
      </div>
    </div>
  );
}
