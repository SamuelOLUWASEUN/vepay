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

export function ProDashboard() {
  return (
    <div className="min-h-screen bg-pro-bg pb-16">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <header className="flex items-center justify-between mb-4 gap-3 flex-wrap pl-12 sm:pl-0">
          <div>
            <p className="font-display text-2xl font-extrabold text-pro-ink">Vepay</p>
            <p className="text-xs text-pro-muted">Pro Mode · Your subscription command center</p>
          </div>
          <CurrencySegmentToggle />
        </header>

        <div className="mb-4">
          <BannerStack mode="PRO" />
        </div>

        <div className="grid gap-4">
          {/* Cost overview */}
          <SpendForecast mode="PRO" />
          <BurnRateMeter />
          <ApiCostTracker />

          {/* Health + Calendar */}
          <HealthScore />
          <WeeklyPlanCard mode="PRO" />

          {/* ROI — the honest mirror */}
          <SoftwareROI />

          {/* Premium tools */}
          <PremiumOverlay />

          {/* Trial management */}
          <TrialCountdownCards />

          {/* Group split */}
          <SyndicateCard />

          {/* Subscription list */}
          <SaaSExpenseList />

          {/* Graveyard */}
          <SubscriptionGraveyard />
        </div>
      </div>
    </div>
  );
}
