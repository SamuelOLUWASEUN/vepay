import { Link2, Users } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatConverted } from '../../lib/currency';

/**
 * Syndicate Mode — viral split-billing mechanic. Generates a shareable
 * invite link for a shared subscription (e.g. Netflix Premium) and copies
 * it to the clipboard. Each accepted invite reduces the user's share and
 * accrues a small platform fee, visible on the group's expense card.
 */
export function SyndicateCard() {
  const { expenses, displayCurrency, generateInviteLink } = useClearSpend();

  const group = expenses.find((e) => e.sharedGroup);
  if (!group || !group.sharedGroup) return null;

  const perPersonShare = group.amount / (group.sharedGroup.pendingMembers.length + 2);

  return (
    <div className="rounded-2xl border border-pro-cyan/30 bg-pro-cyan/5 px-5 py-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-4 w-4 text-pro-cyan" />
        <p className="font-display text-sm font-semibold text-pro-ink">
          Syndicate Mode — {group.sharedGroup.name}
        </p>
      </div>

      <p className="text-xs text-pro-muted mb-3 leading-relaxed">
        Split <span className="font-mono text-pro-ink">{formatConverted(group.amount, group.currency, displayCurrency)}</span> for{' '}
        {group.name} between {group.sharedGroup.pendingMembers.length + 2} people — each pays{' '}
        <span className="font-mono text-pro-cyan font-semibold">
          {formatConverted(perPersonShare, group.currency, displayCurrency)}
        </span>
        .
      </p>

      <div className="flex items-center justify-between text-xs text-pro-muted mb-3">
        <span>{group.sharedGroup.pendingMembers.length} invites pending</span>
        <span>
          Fee accrued:{' '}
          <span className="font-mono text-pro-cyan">
            {formatConverted(group.sharedGroup.platformFeeAccrued, 'USD', displayCurrency)}
          </span>
        </span>
      </div>

      <button
        type="button"
        onClick={() => generateInviteLink(group.id)}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-pro-cyan/15 border border-pro-cyan/30 text-pro-cyan text-sm font-semibold py-2.5 hover:bg-pro-cyan/25 transition-colors"
      >
        <Link2 className="h-4 w-4" />
        Generate Group Invitation Link
      </button>
    </div>
  );
}
