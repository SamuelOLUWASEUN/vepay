import { useClearSpend } from '../../context/ClearSpendContext';

/**
 * Elegant segment controller for switching the Pro Dashboard's display
 * currency. Toggling this recalculates the Digital Burn Rate and every
 * mixed-currency entry into the selected baseline instantly.
 */
export function CurrencySegmentToggle() {
  const { displayCurrency, setDisplayCurrency } = useClearSpend();

  return (
    <div className="inline-flex w-fit rounded-full border border-pro-border bg-pro-surface-2 p-1 shrink-0">
      {(['USD', 'NGN'] as const).map((currency) => {
        const active = displayCurrency === currency;
        return (
          <button
            key={currency}
            type="button"
            onClick={() => setDisplayCurrency(currency)}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-semibold font-display transition-colors whitespace-nowrap',
              active
                ? 'bg-pro-violet text-white shadow'
                : 'text-pro-muted hover:text-pro-ink',
            ].join(' ')}
          >
            {/* Short on mobile, full label on desktop */}
            <span className="sm:hidden">{currency === 'USD' ? '$ USD' : '₦ NGN'}</span>
            <span className="hidden sm:inline">{currency === 'USD' ? 'View in USD ($)' : 'View in NGN (₦)'}</span>
          </button>
        );
      })}
    </div>
  );
}
