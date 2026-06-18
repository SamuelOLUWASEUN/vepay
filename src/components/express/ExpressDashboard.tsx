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
    <div className="min-h-screen bg-express-bg pb-24 overflow-x-hidden w-full">
      <div className="w-full max-w-xl mx-auto px-4 pt-16 sm:pt-6">
        <header className="flex items-center justify-between mb-4 pl-14 sm:pl-0">
          <div>
            <p className="font-display text-2xl font-extrabold text-express-ink">Vepay</p>
            <p className="text-xs text-express-muted">Express Mode · Daily money, made simple</p>
          </div>
          <OfflineSyncBadge />
        </header>

        <div className="mb-4">
          <BannerStack mode="EXPRESS" />
        </div>

        <div className="grid gap-4">
          {/* 1. Status */}
          <TrafficLightRing />
          <SpendForecast mode="EXPRESS" />

          {/* 2. Daily spend analytics */}
          <DailySpendTracker />

          {/* 3. Action */}
          <ActionGrid />
          <VoiceWaveform />

          {/* 4. This Week's Plan — calendar + envelopes merged */}
          <WeeklyPlanCard mode="EXPRESS" />

          {/* 5. Ajo Group Hub */}
          <AjoGroupHub />

          {/* 6. Obligations */}
          <ExpressExpenseList />
        </div>
      </div>
    </div>
  );
}
