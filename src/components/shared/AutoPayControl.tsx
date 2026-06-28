import { useClearSpend } from '../../context/ClearSpendContext';
import type { Expense } from '../../types';

/**
 * AutoPayControl — the per-expense control for turning a Nomba mandate on or off.
 *
 * A mandate is the authorization that lets Nomba pull a recurring payment
 * automatically instead of the user paying manually each cycle. This control
 * reads as "Auto-pay" to the user because that's the outcome they care about;
 * "mandate" is the payments-industry term, not the user's word.
 *
 * Shared by both modes. Visual treatment is passed in so it sits correctly in
 * the warm Express surfaces and the dark Pro surfaces without a second variant.
 */

interface Props {
  expense: Expense;
  tone: 'express' | 'pro';
}

const CADENCE_LABEL: Record<string, string> = {
  daily: 'every day',
  weekly: 'every week',
  monthly: 'every month',
};

export function AutoPayControl({ expense, tone }: Props) {
  const { enableMandate, cancelMandateForExpense, mandatePending } = useClearSpend();

  const status = expense.mandateStatus ?? 'none';
  const pending = Boolean(mandatePending[expense.id]);
  const isOn = status === 'active' || status === 'pending_authorization';

  const cadence = CADENCE_LABEL[
    expense.frequency === 'daily' ? 'daily'
    : expense.frequency === 'weekly' ? 'weekly'
    : 'monthly'
  ];

  // Tone-aware colors pulled from the existing CSS variables so this control
  // never introduces a new palette.
  const accent = tone === 'express' ? 'var(--express-green)' : 'var(--pro-violet)';
  const ink = tone === 'express' ? 'var(--express-ink)' : 'var(--pro-ink)';
  const muted = tone === 'express' ? 'var(--express-muted)' : 'var(--pro-muted)';
  const trackOff = tone === 'express' ? 'var(--express-border)' : 'var(--pro-border)';

  function toggle() {
    if (pending) return;
    if (isOn) {
      void cancelMandateForExpense(expense.id);
    } else {
      void enableMandate(expense.id);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: ink }}>
          Auto-pay
        </p>
        <p style={{ margin: 0, fontSize: '11px', color: muted }}>
          {status === 'active' && `Nomba charges this ${cadence}`}
          {status === 'pending_authorization' && 'Waiting for your approval'}
          {status === 'cancelled' && 'Cancelled — pay manually'}
          {status === 'none' && `Let Nomba charge this ${cadence}`}
        </p>
      </div>

      {/* Accessible switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={isOn ? 'Turn off auto-pay' : 'Turn on auto-pay'}
        onClick={toggle}
        disabled={pending}
        style={{
          position: 'relative',
          width: '46px',
          height: '28px',
          flexShrink: 0,
          borderRadius: '9999px',
          border: 'none',
          cursor: pending ? 'wait' : 'pointer',
          background: isOn ? accent : trackOff,
          opacity: pending ? 0.6 : 1,
          transition: 'background 0.2s ease',
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '3px',
            left: isOn ? '21px' : '3px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            transition: 'left 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </button>
    </div>
  );
}
