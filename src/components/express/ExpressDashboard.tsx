import { BannerStack } from '../shared/BannerStack';
import { WeeklyPlanCard } from '../shared/WeeklyPlanCard';
import { SpendForecast } from '../shared/SpendForecast';
import { TrafficLightRing } from './TrafficLightRing';
import { ActionGrid } from './ActionGrid';
import { VoiceWaveform } from './VoiceWaveform';
import { ExpressExpenseList } from './ExpressExpenseList';
import { DailySpendTracker } from './DailySpendTracker';
import { AjoGroupHub } from './AjoGroupHub';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onOpenProfile: () => void;
}

export function ExpressDashboard({ onOpenProfile }: Props) {
  const { user } = useAuth();

  return (
    <div style={{ width: '100%' }} className="min-h-screen bg-express-bg pb-24">

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'var(--express-bg)',
        borderBottom: '1px solid var(--express-border)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        // Extend behind the fixed hamburger button on mobile
        paddingLeft: '60px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
      }}
      className="sm:px-6 sm:py-3"
      >
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <p className="font-display font-extrabold text-express-ink" style={{ fontSize: '20px', margin: 0, lineHeight: 1.2 }}>Vepay</p>
            <p style={{ fontSize: '11px', color: 'var(--express-muted)', margin: 0 }}>Express Mode · Daily money</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{
              background: '#0f9d58', color: 'white',
              fontSize: '10px', fontWeight: 700,
              padding: '3px 8px', borderRadius: '9999px',
              letterSpacing: '0.05em',
            }}>EXPRESS</span>

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
      <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto', padding: '16px 16px 0', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: '16px' }}>
          <BannerStack mode="EXPRESS" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TrafficLightRing />
          <SpendForecast mode="EXPRESS" />
          <DailySpendTracker />
          <ActionGrid />
          <VoiceWaveform />
          <WeeklyPlanCard mode="EXPRESS" />
          <AjoGroupHub />
          <ExpressExpenseList />
        </div>
      </div>
    </div>
  );
}
