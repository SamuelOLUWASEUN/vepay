import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';

/**
 * Offline-First Sync Status Badge
 *
 * Communicates Vepay's local-first data resilience: transactions
 * recorded on the action grid are written to local storage immediately
 * and queued for sync, so connectivity gaps in market environments never
 * block a recording.
 */
export function OfflineSyncBadge() {
  const [syncing, setSyncing] = useState(false);

  // Periodically simulate a background sync pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncing(true);
      const timeout = setTimeout(() => setSyncing(false), 1400);
      return () => clearTimeout(timeout);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-express-border bg-express-surface px-3 py-1.5 shadow-sm">
      {syncing ? (
        <RefreshCw className="h-3.5 w-3.5 text-express-green animate-spin" />
      ) : (
        <CloudOff className="h-3.5 w-3.5 text-express-muted" />
      )}
      <span className="text-xs font-medium text-express-ink">
        {syncing ? 'Syncing 3 entries…' : 'Saved locally · synced'}
      </span>
    </div>
  );
}
