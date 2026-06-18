import { useClearSpend } from '../../context/ClearSpendContext';

export function CurrencySegmentToggle() {
  const { displayCurrency, setDisplayCurrency } = useClearSpend();

  return (
    <div style={{ display: 'inline-flex', borderRadius: '9999px', border: '1px solid var(--pro-border)', background: 'var(--pro-surface-2)', padding: '4px', flexShrink: 0 }}>
      {(['USD', 'NGN'] as const).map((currency) => {
        const active = displayCurrency === currency;
        return (
          <button
            key={currency}
            type="button"
            onClick={() => setDisplayCurrency(currency)}
            style={{
              borderRadius: '9999px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: 'none',
              cursor: 'pointer',
              background: active ? '#7c5cff' : 'transparent',
              color: active ? '#ffffff' : 'var(--pro-muted)',
              transition: 'all 0.15s',
            }}
          >
            {currency === 'USD' ? '$ USD' : '₦ NGN'}
          </button>
        );
      })}
    </div>
  );
}
