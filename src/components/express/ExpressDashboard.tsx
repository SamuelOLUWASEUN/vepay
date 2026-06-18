import { BannerStack } from '../shared/BannerStack';
import { WeeklyPlanCard } from '../shared/WeeklyPlanCard';
import { SpendForecast } from '../shared/SpendForecast';
import { TrafficLightRing } from './TrafficLightRing';
import { ActionGrid } from './ActionGrid';
import { OfflineSyncBadge } from './OfflineSyncBadge';
import { VoiceWaveform } from './VoiceWaveform';
import { ExpressExpenseList } from './ExpressExpenseList';
import { DailySpendTracker } from './DailySpendTracker';
import { AjoGroupHub } from './AjoGroupHub';

export function ExpressDashboard() {
  return (
    <div style={{ width: '100%' }} className="min-h-screen bg-express-bg pb-24">
      {/* Safe area — 72px top padding on mobile to clear fixed hamburger */}
      <div style={{ width: '100%', maxWidth: '560px', margin: '0 auto', padding: '0 16px', boxSizing: 'border-box' }}>
        <div style={{ paddingTop: '72px' }} className="sm:pt-6">

          <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '16px' }}>
            <div style={{ minWidth: 0 }}>
              <p className="font-display text-2xl font-extrabold text-express-ink">Vepay</p>
              <p className="text-xs text-express-muted">Express Mode · Daily money, made simple</p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <OfflineSyncBadge />
            </div>
          </header>

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
    </div>
  );
}
