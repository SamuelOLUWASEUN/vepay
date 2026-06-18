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
    <div style={{ width: '100%', overflowX: 'hidden' }} className="min-h-screen bg-pro-bg pb-16">
      <div style={{ width: '100%', maxWidth: '672px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ paddingTop: '72px' }} className="sm:pt-6">

          <header style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <p className="font-display text-2xl font-extrabold text-pro-ink">Vepay</p>
                <p className="text-xs text-pro-muted">Pro Mode · Your subscription command center</p>
              </div>
              <div style={{ flexShrink: 0 }}>
                <CurrencySegmentToggle />
              </div>
            </div>
          </header>

          <div style={{ marginBottom: '16px' }}>
            <BannerStack mode="PRO" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <SpendForecast mode="PRO" />
            <BurnRateMeter />
            <ApiCostTracker />
            <HealthScore />
            <WeeklyPlanCard mode="PRO" />
            <SoftwareROI />
            <PremiumOverlay />
            <TrialCountdownCards />
            <SyndicateCard />
            <SaaSExpenseList />
            <SubscriptionGraveyard />
          </div>
        </div>
      </div>
    </div>
  );
}
