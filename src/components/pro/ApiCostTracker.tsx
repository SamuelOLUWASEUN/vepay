import { useState, useMemo } from 'react';
import { Trash2, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, convertCurrency } from '../../lib/currency';
import { useClearSpend } from '../../context/ClearSpendContext';

// ─────────────────────────────────────────────────────────────────────────────
// ApiEntryInput — OUTSIDE component to prevent remount
// ─────────────────────────────────────────────────────────────────────────────

interface ApiEntryInputProps {
  amountStr: string;
  label: string;
  onAmountChange: (v: string) => void;
  onLabelChange: (v: string) => void;
  onSubmit: () => void;
  inputBg: string;
}

function ApiEntryInput({ amountStr, label, onAmountChange, onLabelChange, onSubmit, inputBg }: ApiEntryInputProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative w-full sm:w-28 sm:shrink-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pro-muted text-sm font-mono">$</span>
        <input
          type="number"
          value={amountStr}
          onChange={(e) => onAmountChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
          placeholder="0.00"
          step="0.01"
          min="0"
          className={['w-full rounded-xl border pl-7 pr-3 py-2.5 text-sm font-mono outline-none transition-colors', inputBg].join(' ')}
        />
      </div>
      <input
        type="text"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
        placeholder="OpenAI API call, Claude prompt…"
        maxLength={50}
        className={['flex-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors', inputBg].join(' ')}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!amountStr || parseFloat(amountStr) <= 0}
        className="w-full sm:w-auto shrink-0 rounded-xl bg-pro-violet text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40 transition-colors hover:bg-pro-violet/90"
      >
        Log
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ApiCostEntry {
  id: string;
  label: string;
  amountUSD: number;
  timestamp: number;
  dayKey: string;
}

const API_COST_KEY = 'vepay.apicosts.v1';

function loadApiCosts(): ApiCostEntry[] {
  try {
    const raw = localStorage.getItem(API_COST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveApiCosts(entries: ApiCostEntry[]) {
  try { localStorage.setItem(API_COST_KEY, JSON.stringify(entries.slice(0, 200))); }
  catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * API Cost Tracker — Pro Mode
 *
 * Developers have a specific version of the "I spent more than I thought"
 * problem: variable API usage (OpenAI, Claude, Gemini, Pinecone) bills
 * unpredictably and doesn't show up in subscription tracking. This lets
 * them log individual API calls/batches and see a running daily + monthly
 * total that feeds into the burn rate display.
 */
export function ApiCostTracker() {
  const { displayCurrency } = useClearSpend();
  const [entries, setEntries] = useState<ApiCostEntry[]>(loadApiCosts);
  const [amountStr, setAmountStr] = useState('');
  const [label, setLabel] = useState('');
  const [showAll, setShowAll] = useState(false);

  const todayKey = new Date().toISOString().slice(0, 10);

  const todayEntries = useMemo(() => entries.filter((e) => e.dayKey === todayKey), [entries, todayKey]);
  const todayUSD = useMemo(() => todayEntries.reduce((s, e) => s + e.amountUSD, 0), [todayEntries]);

  const monthCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const monthlyUSD = useMemo(() =>
    entries.filter((e) => e.timestamp >= monthCutoff).reduce((s, e) => s + e.amountUSD, 0),
    [entries, monthCutoff],
  );

  function fmt(usd: number) {
    if (displayCurrency === 'NGN') return formatCurrency(convertCurrency(usd, 'USD', 'NGN'), 'NGN');
    return formatCurrency(usd, 'USD');
  }

  function handleLog() {
    const val = parseFloat(amountStr);
    if (!val || val <= 0) return;
    const entry: ApiCostEntry = {
      id: `api_${Date.now().toString(36)}`,
      label: label.trim() || 'API call',
      amountUSD: val,
      timestamp: Date.now(),
      dayKey: todayKey,
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    saveApiCosts(updated);
    setAmountStr('');
    setLabel('');
  }

  function remove(id: string) {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveApiCosts(updated);
  }

  function formatTime(ms: number) {
    return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  const inputBg = 'bg-pro-bg border-pro-border text-pro-ink placeholder-pro-muted focus:border-pro-violet';

  const displayEntries = showAll ? entries.slice(0, 50) : todayEntries;

  return (
    <div className="rounded-2xl border border-pro-border bg-pro-surface shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-pro-border bg-pro-surface-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-pro-violet/15 p-2">
              <Zap className="h-4 w-4 text-pro-violet" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-pro-ink">API Cost Tracker</p>
              <p className="text-xs text-pro-muted">Variable usage — OpenAI, Claude, Pinecone…</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono font-black text-xl text-pro-ink leading-none">{fmt(todayUSD)}</p>
            <p className="text-[10px] text-pro-muted mt-0.5">today</p>
          </div>
        </div>

        {/* Monthly rollup */}
        <div className="mt-3 rounded-xl border border-pro-border bg-pro-bg px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-pro-muted">30-day API spend</span>
          <span className="font-mono font-bold text-sm text-pro-cyan">{fmt(monthlyUSD)}</span>
        </div>
      </div>

      {/* Log entry */}
      <div className="px-5 py-4 border-b border-pro-border">
        <p className="text-[10px] font-bold uppercase tracking-widest text-pro-muted mb-2">Log API usage</p>
        <ApiEntryInput
          amountStr={amountStr}
          label={label}
          onAmountChange={setAmountStr}
          onLabelChange={setLabel}
          onSubmit={handleLog}
          inputBg={inputBg}
        />
      </div>

      {/* Entry list */}
      {entries.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-pro-surface-2 transition-colors"
          >
            <span className="text-sm font-semibold text-pro-ink">
              {showAll ? `All entries (${Math.min(entries.length, 50)})` : `Today (${todayEntries.length})`}
            </span>
            {showAll
              ? <ChevronUp className="h-4 w-4 text-pro-muted" />
              : <ChevronDown className="h-4 w-4 text-pro-muted" />}
          </button>

          <div className="max-h-52 overflow-y-auto divide-y divide-pro-border">
            {displayEntries.length === 0 ? (
              <p className="px-5 py-4 text-sm text-pro-muted text-center">No entries today</p>
            ) : (
              displayEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-pro-surface-2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-pro-ink truncate">{entry.label}</p>
                    <p className="text-[11px] text-pro-muted">{formatTime(entry.timestamp)}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-pro-ink shrink-0">
                    {fmt(entry.amountUSD)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(entry.id)}
                    className="shrink-0 p-1.5 rounded-lg text-pro-muted hover:text-pro-red hover:bg-pro-red-soft transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
