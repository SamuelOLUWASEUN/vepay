import { X, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';

interface ProfilePageProps { onClose: () => void; }

export function ProfilePage({ onClose }: ProfilePageProps) {
  const { user } = useAuth();
  const { ledgerVolumeNGN, ledgerFeesNGN, expenses, contributionLog, dailySpendEntries } = useClearSpend();

  const totalExpenses = expenses.filter((e) => e.type === 'local').length;
  const activeExpenses = expenses.filter((e) => e.type === 'local' && e.status === 'active').length;
  const totalDailySpend = dailySpendEntries.reduce((s, e) => s + e.amountNGN, 0);
  const joinedDate = user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Today';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-express-bg overflow-y-auto animate-backdrop-in">
      <div className="sticky top-0 z-10 bg-express-bg border-b border-express-border px-4 py-4 flex items-center justify-between">
        <p className="font-display font-bold text-lg text-express-ink">My Account</p>
        <button type="button" onClick={onClose} className="p-2 rounded-full text-express-muted">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-w-xl mx-auto w-full px-4 py-5 flex flex-col gap-5 pb-16">
        {/* Avatar + name */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center font-display font-black text-xl text-white"
              style={{ backgroundColor: user.avatarColor }}>
              {user.initials}
            </div>
            <div>
              <p className="font-display font-bold text-express-ink text-lg">{user.name}</p>
              <p className="text-sm text-express-muted">{user.email}</p>
              <p className="text-xs text-express-muted mt-0.5">Member since {joinedDate}</p>
            </div>
          </div>
        )}

        {/* Personal stats */}
        <div className="rounded-2xl border border-express-border bg-express-surface shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-express-border bg-express-bg">
            <p className="font-display text-sm font-bold text-express-ink">Your Activity</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-express-border">
            {[
              { label: 'Active obligations', value: String(activeExpenses) },
              { label: 'Total obligations', value: String(totalExpenses) },
              { label: 'Entries logged', value: String(contributionLog.length) },
              { label: 'Daily spend tracked', value: formatCurrency(totalDailySpend, 'NGN') },
            ].map(({ label, value }) => (
              <div key={label} className="px-5 py-3">
                <p className="font-mono font-bold text-express-ink">{value}</p>
                <p className="text-[11px] text-express-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Activity — moved here from main dashboard */}
        <div className="rounded-2xl border border-express-border bg-express-ink shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-express-green" />
            <p className="font-display text-sm font-bold text-express-bg">Platform Activity</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-white/10 px-0">
            <div className="px-5 py-4">
              <p className="text-[10px] text-express-bg/60 uppercase tracking-wide mb-1">Total Volume Handled</p>
              <p className="font-mono font-black text-xl text-express-bg">{formatCurrency(ledgerVolumeNGN, 'NGN')}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] text-express-bg/60 uppercase tracking-wide mb-1">Platform Fees (1%)</p>
              <p className="font-mono font-black text-xl text-express-green">{formatCurrency(ledgerFeesNGN, 'NGN')}</p>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-white/10">
            <p className="text-[11px] text-express-bg/50 leading-relaxed">
              These figures reflect real transaction volume flowing through Vepay on your device. Fees support the platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
