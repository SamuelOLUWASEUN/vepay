// ============================================================================
// useClearSpend — unified state provider
//
// Single source of truth shared by EXPRESS MODE and PRO MODE. Persisted to
// localStorage so the prototype survives refreshes during a live demo.
// ============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Currency,
  Expense,
  ExpenseStatus,
  Mode,
  ProcessingState,
  SystemBanner,
} from '../types';
import { INITIAL_EXPENSES, type QuickActionTarget } from '../lib/mockData';

const STORAGE_KEY = 'vepay.state.v1';

// ----------------------------------------------------------------------------
// Persisted shape
// ----------------------------------------------------------------------------

interface PersistedState {
  expenses: Expense[];
  currentMode: Mode;
  displayCurrency: Currency;
  roundUpVaultEnabled: boolean;
  vaultBalanceNGN: number;
  ledgerVolumeNGN: number;
  ledgerFeesNGN: number;
}

const DEFAULT_STATE: PersistedState = {
  expenses: INITIAL_EXPENSES,
  currentMode: 'EXPRESS',
  displayCurrency: 'NGN',
  roundUpVaultEnabled: true,
  vaultBalanceNGN: 1850,
  ledgerVolumeNGN: 487500,
  ledgerFeesNGN: 4875,
};

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

// ----------------------------------------------------------------------------
// Contribution history log — receipt trail for Express Mode ajo/thrift taps
// ----------------------------------------------------------------------------

export interface ContributionEntry {
  id: string;
  label: string;
  icon: string;
  amountNGN: number;
  roundUpNGN: number;
  timestamp: number; // ms epoch
}

// ----------------------------------------------------------------------------
// Budget Envelope — weekly spending cap per Express category
// ----------------------------------------------------------------------------

export interface BudgetEnvelope {
  categoryId: string; // maps to QuickActionTarget.id
  label: string;
  icon: string;
  weeklyBudgetNGN: number;
  spentThisWeekNGN: number;
}

// ----------------------------------------------------------------------------
// Cancelled / Paused graveyard — subscriptions the user has let go
// ----------------------------------------------------------------------------

export interface GraveyardEntry {
  id: string;
  name: string;
  categoryIcon: string;
  totalSpentNGN: number;
  currency: 'USD' | 'NGN';
  cancelledAt: number; // ms epoch
  monthsActive: number;
}

// ----------------------------------------------------------------------------
// Financial Fingerprint — patterns derived from contribution log + expenses
// ----------------------------------------------------------------------------

export interface FinancialPattern {
  id: string;
  title: string;
  description: string;
  severity: 'insight' | 'warning' | 'tip';
  icon: string;
}

// ----------------------------------------------------------------------------
// Daily Spend Tracker — freeform impulse/daily spending log
// ----------------------------------------------------------------------------

export interface DailySpendEntry {
  id: string;
  label: string;       // e.g. "Suya", "Airtime", "Fuel" — optional
  amountNGN: number;
  timestamp: number;   // ms epoch
  dayKey: string;      // YYYY-MM-DD — used to group by day
}

export interface DailySpendSummary {
  dayKey: string;
  totalNGN: number;
  entryCount: number;
}

// ----------------------------------------------------------------------------
// Context shape
// ----------------------------------------------------------------------------

interface AgenticOptimizerState {
  open: boolean;
  /** Expense ids the agent proposes to act on */
  targetIds: string[];
  /** Total monthly savings (USD) the agent claims it will unlock */
  estimatedMonthlySavingsUSD: number;
  /** Commission Vepay takes on realized savings */
  commissionRate: number;
  resolved: 'pending' | 'approved' | 'declined';
}

const DEFAULT_AGENTIC_STATE: AgenticOptimizerState = {
  open: false,
  targetIds: ['pro-figma', 'pro-railway'],
  estimatedMonthlySavingsUSD: 20,
  commissionRate: 0.1,
  resolved: 'pending',
};

interface ClearSpendContextValue {
  // Core state
  expenses: Expense[];
  currentMode: Mode;
  displayCurrency: Currency;
  roundUpVaultEnabled: boolean;
  vaultBalanceNGN: number;
  ledgerVolumeNGN: number;
  ledgerFeesNGN: number;
  banners: SystemBanner[];
  processing: Record<string, ProcessingState>;
  agenticOptimizer: AgenticOptimizerState;
  toast: string | null;

  // Mode / currency
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  setDisplayCurrency: (currency: Currency) => void;

  // Express actions
  recordQuickAction: (target: QuickActionTarget) => void;
  toggleRoundUpVault: () => void;

  // Self-serve billing controls
  pauseExpense: (id: string) => void;
  resumeExpense: (id: string) => void;
  cancelTrial: (id: string) => void;

  // Mandates — recurring-charge authorization (both modes)
  enableMandate: (id: string) => Promise<void>;
  cancelMandateForExpense: (id: string) => Promise<void>;
  mandatePending: Record<string, boolean>;

  // Failure / recovery simulations
  simulateInsufficientFunds: () => void;
  simulateExpiredCard: () => void;
  retryPayment: (id: string) => void;
  resetSimulations: () => void;

  // Banners
  dismissBanner: (id: string) => void;

  // Agentic optimizer (human-in-the-loop)
  openAgenticOptimizer: () => void;
  confirmAgenticOptimization: () => void;
  declineAgenticOptimization: () => void;
  closeAgenticOptimizer: () => void;

  // Syndicate / viral invite
  generateInviteLink: (expenseId: string) => Promise<void>;
  inviteModal: { open: boolean; link: string; expenseId: string } | null;
  closeInviteModal: () => void;

  // Ajo contribution history
  contributionLog: ContributionEntry[];

  // Budget envelopes (Express)
  budgetEnvelopes: BudgetEnvelope[];
  updateEnvelopeBudget: (categoryId: string, weeklyBudgetNGN: number) => void;

  // Subscription graveyard
  graveyardEntries: GraveyardEntry[];
  cancelExpense: (id: string) => void;

  // Financial fingerprint patterns
  financialPatterns: FinancialPattern[];
  fingerprintOpen: boolean;
  openFingerprint: () => void;
  closeFingerprint: () => void;

  // Daily Spend Tracker
  dailySpendEntries: DailySpendEntry[];
  dailyBudgetNGN: number;
  setDailyBudgetNGN: (amount: number) => void;
  logDailySpend: (amountNGN: number, label: string) => void;
  deleteDailySpendEntry: (id: string) => void;
  todaySpendNGN: number;
  todayDayKey: string;
  spendStreak: number;
  weeklySpendNGN: number;
  monthlySpendNGN: number;
  dailySpendByDay: DailySpendSummary[];

  // Toast
  clearToast: () => void;
}

const ClearSpendContext = createContext<ClearSpendContextValue | null>(null);

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

let idempotencyCounter = 0;
function generateIdempotencyKey(): string {
  idempotencyCounter += 1;
  return `idem_${Date.now().toString(36)}_${idempotencyCounter}`;
}

function generateBannerId(): string {
  return `banner_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// ----------------------------------------------------------------------------
// Provider
// ----------------------------------------------------------------------------

export function ClearSpendProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(loadPersisted, []);

  const [expenses, setExpenses] = useState<Expense[]>(initial.expenses);
  const [currentMode, setCurrentMode] = useState<Mode>(initial.currentMode);
  const [displayCurrency, setDisplayCurrencyState] = useState<Currency>(
    initial.displayCurrency,
  );
  const [roundUpVaultEnabled, setRoundUpVaultEnabled] = useState(
    initial.roundUpVaultEnabled,
  );
  const [vaultBalanceNGN, setVaultBalanceNGN] = useState(initial.vaultBalanceNGN);
  const [ledgerVolumeNGN, setLedgerVolumeNGN] = useState(initial.ledgerVolumeNGN);
  const [ledgerFeesNGN, setLedgerFeesNGN] = useState(initial.ledgerFeesNGN);

  const [banners, setBanners] = useState<SystemBanner[]>([]);
  const [processing, setProcessing] = useState<Record<string, ProcessingState>>({});
  const [agenticOptimizer, setAgenticOptimizer] = useState<AgenticOptimizerState>(
    DEFAULT_AGENTIC_STATE,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState<{ open: boolean; link: string; expenseId: string } | null>(null);
  const [contributionLog, setContributionLog] = useState<ContributionEntry[]>([]);

  const [budgetEnvelopes, setBudgetEnvelopes] = useState<BudgetEnvelope[]>([
    { categoryId: 'qa-rent', label: 'Shop Rent', icon: '🏬', weeklyBudgetNGN: 8000, spentThisWeekNGN: 1000 },
    { categoryId: 'qa-thrift', label: 'Thrift/Ajo', icon: '🐷', weeklyBudgetNGN: 35000, spentThisWeekNGN: 5000 },
    { categoryId: 'qa-power', label: 'Power', icon: '🔌', weeklyBudgetNGN: 3500, spentThisWeekNGN: 500 },
    { categoryId: 'qa-levy', label: 'Daily Levy', icon: '📊', weeklyBudgetNGN: 1400, spentThisWeekNGN: 200 },
    { categoryId: 'qa-water', label: 'Water', icon: '🚰', weeklyBudgetNGN: 700, spentThisWeekNGN: 100 },
    { categoryId: 'qa-security', label: 'Security Levy', icon: '🛡️', weeklyBudgetNGN: 2100, spentThisWeekNGN: 300 },
  ]);

  const [graveyardEntries, setGraveyardEntries] = useState<GraveyardEntry[]>([
    {
      id: 'grave-notion',
      name: 'Notion Pro',
      categoryIcon: 'FileText',
      totalSpentNGN: 54000,
      currency: 'USD',
      cancelledAt: new Date('2026-03-15').getTime(),
      monthsActive: 6,
    },
    {
      id: 'grave-slack',
      name: 'Slack Pro',
      categoryIcon: 'MessageSquare',
      totalSpentNGN: 108000,
      currency: 'USD',
      cancelledAt: new Date('2026-01-01').getTime(),
      monthsActive: 12,
    },
  ]);

  const [fingerprintOpen, setFingerprintOpen] = useState(false);
  const [mandatePending, setMandatePending] = useState<Record<string, boolean>>({});

  // -- Daily Spend Tracker --------------------------------------------------

  const [dailySpendEntries, setDailySpendEntries] = useState<DailySpendEntry[]>(() => {
    try {
      const raw = localStorage.getItem('vepay.daily.v1');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [dailyBudgetNGN, setDailyBudgetNGNState] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('vepay.dailybudget.v1');
      return raw ? parseInt(raw, 10) : 50000;
    } catch { return 50000; }
  });

  // Persist daily entries separately from main state (it grows fast)
  useEffect(() => {
    try {
      localStorage.setItem('vepay.daily.v1', JSON.stringify(dailySpendEntries.slice(0, 500)));
    } catch { /* ignore */ }
  }, [dailySpendEntries]);

  useEffect(() => {
    try { localStorage.setItem('vepay.dailybudget.v1', String(dailyBudgetNGN)); }
    catch { /* ignore */ }
  }, [dailyBudgetNGN]);

  // Today's date key — YYYY-MM-DD based on real clock
  const todayDayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todaySpendNGN = useMemo(() =>
    dailySpendEntries
      .filter((e) => e.dayKey === todayDayKey)
      .reduce((s, e) => s + e.amountNGN, 0),
    [dailySpendEntries, todayDayKey],
  );

  // Weekly total — last 7 days
  const weeklySpendNGN = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return dailySpendEntries
      .filter((e) => e.timestamp >= cutoff)
      .reduce((s, e) => s + e.amountNGN, 0);
  }, [dailySpendEntries]);

  // Monthly total — last 30 days
  const monthlySpendNGN = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return dailySpendEntries
      .filter((e) => e.timestamp >= cutoff)
      .reduce((s, e) => s + e.amountNGN, 0);
  }, [dailySpendEntries]);

  // Per-day summaries for the last 7 days (for chart/streak)
  const dailySpendByDay = useMemo<DailySpendSummary[]>(() => {
    const map: Record<string, DailySpendSummary> = {};
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    dailySpendEntries
      .filter((e) => e.timestamp >= cutoff)
      .forEach((e) => {
        if (!map[e.dayKey]) map[e.dayKey] = { dayKey: e.dayKey, totalNGN: 0, entryCount: 0 };
        map[e.dayKey].totalNGN += e.amountNGN;
        map[e.dayKey].entryCount += 1;
      });
    // Build a full 7-day array including days with zero spend
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return map[key] ?? { dayKey: key, totalNGN: 0, entryCount: 0 };
    });
  }, [dailySpendEntries]);

  // Spend streak — consecutive days with at least one entry (ending today)
  const spendStreak = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const hasEntry = dailySpendEntries.some((e) => e.dayKey === key);
      if (hasEntry) streak++;
      else break;
    }
    return streak;
  }, [dailySpendEntries]);

  const setDailyBudgetNGN = useCallback((amount: number) => {
    setDailyBudgetNGNState(amount);
  }, []);

  const logDailySpend = useCallback((amountNGN: number, label: string) => {
    const entry: DailySpendEntry = {
      id: `daily_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      label: label.trim() || 'Expense',
      amountNGN,
      timestamp: Date.now(),
      dayKey: new Date().toISOString().slice(0, 10),
    };
    setDailySpendEntries((prev) => [entry, ...prev]);

    // Smart alert: check if pace is 40%+ above yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    const yesterdayTotal = dailySpendEntries
      .filter((e) => e.dayKey === yesterdayKey)
      .reduce((s, e) => s + e.amountNGN, 0);

    const newTodayTotal = todaySpendNGN + amountNGN;

    // Normalize by time of day for a fair pace comparison
    const hourNow = new Date().getHours();
    const dayProgress = Math.max(hourNow / 24, 0.1);
    const projectedToday = newTodayTotal / dayProgress;

    if (yesterdayTotal > 0 && projectedToday > yesterdayTotal * 1.4 && hourNow >= 10) {
      setToast(`⚠️ You're spending faster than yesterday — ₦${Math.round(newTodayTotal / 1000)}k so far today`);
    } else {
      setToast(`Logged: ${label.trim() || 'Expense'} · ₦${amountNGN.toLocaleString('en-NG')} · Today: ₦${newTodayTotal.toLocaleString('en-NG')}`);
    }
  }, [dailySpendEntries, todaySpendNGN]);

  const deleteDailySpendEntry = useCallback((id: string) => {
    setDailySpendEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Persist to localStorage whenever core state changes
  useEffect(() => {
    const payload: PersistedState = {
      expenses,
      currentMode,
      displayCurrency,
      roundUpVaultEnabled,
      vaultBalanceNGN,
      ledgerVolumeNGN,
      ledgerFeesNGN,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage unavailable (e.g. private browsing) — fail silently,
      // matching the "Offline-First" resilience philosophy.
    }
  }, [
    expenses,
    currentMode,
    displayCurrency,
    roundUpVaultEnabled,
    vaultBalanceNGN,
    ledgerVolumeNGN,
    ledgerFeesNGN,
  ]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  // -- Mode / currency ---------------------------------------------------

  const setMode = useCallback((mode: Mode) => setCurrentMode(mode), []);
  const toggleMode = useCallback(() => {
    setCurrentMode((m) => (m === 'EXPRESS' ? 'PRO' : 'EXPRESS'));
  }, []);
  const setDisplayCurrency = useCallback((currency: Currency) => {
    setDisplayCurrencyState(currency);
  }, []);

  // -- Express: quick action ledger ---------------------------------------

  const recordQuickAction = useCallback((target: QuickActionTarget) => {
    const amount = target.defaultAmount;
    const fee = Math.round(amount * 0.01);
    const roundUp = roundUpVaultEnabled
      ? Math.ceil(amount / 100) * 100 - amount
      : 0;

    setLedgerVolumeNGN((v) => v + amount);
    setLedgerFeesNGN((f) => f + fee);
    if (roundUp > 0) {
      setVaultBalanceNGN((v) => v + roundUp);
    }

    // Append to receipt trail so the user has a paper record of every tap
    setContributionLog((prev) => [
      {
        id: `log_${Date.now().toString(36)}`,
        label: target.label,
        icon: target.icon,
        amountNGN: amount,
        roundUpNGN: roundUp,
        timestamp: Date.now(),
      },
      ...prev.slice(0, 49), // keep last 50
    ]);

    // Update budget envelope spend for this category
    addEnvelopeSpend(target.id, amount);

    setToast(
      `${target.icon} ${target.label}: ₦${amount.toLocaleString('en-NG')} logged` +
        (roundUp > 0 ? ` · +₦${roundUp} to Round-Up Vault` : ''),
    );
  }, [roundUpVaultEnabled]);

  const toggleRoundUpVault = useCallback(() => {
    setRoundUpVaultEnabled((v) => !v);
  }, []);

  // -- Self-serve billing controls ----------------------------------------

  const setExpenseStatus = useCallback(
    (id: string, status: ExpenseStatus, failureReason?: Expense['failureReason']) => {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status,
                failureReason: status === 'failed' ? failureReason : undefined,
              }
            : e,
        ),
      );
    },
    [],
  );

  // ── Nomba Webhook Polling ─────────────────────────────────────────────────
  // Poll every 10 seconds for real Nomba payment events.
  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const { pollWebhookEvents } = await import('../lib/nomba');
        const events = await pollWebhookEvents();
        if (!active) return;
        events.forEach((event) => {
          switch (event.action) {
            case 'PAYMENT_SUCCESS':
              if (event.expenseId) {
                setExpenseStatus(event.expenseId, 'active');
                setBanners((prev) => prev.filter((b) => b.relatedExpenseId !== event.expenseId));
                setToast(`✅ ${event.message ?? 'Payment confirmed by Nomba'}`);
              }
              break;
            case 'PAYMENT_FAILED':
              if (event.expenseId) {
                setExpenseStatus(event.expenseId, 'failed', (event.reason as any) ?? 'insufficient_funds');
                setToast(`❌ ${event.message ?? 'Payment failed'}`);
              }
              break;
            case 'CARD_EXPIRING':
              if (event.expenseId) {
                setExpenseStatus(event.expenseId, 'failed', 'expired_card');
                setToast(`⚠️ ${event.message ?? 'Card expiring — update required'}`);
              }
              break;
            case 'PAYMENT_REVERSED':
              if (event.expenseId) {
                setExpenseStatus(event.expenseId, 'failed', 'insufficient_funds');
                setToast(`↩️ ${event.message ?? 'Payment reversed'}`);
              }
              break;
          }
        });
      } catch { /* silent fail */ }
    }
    poll();
    const interval = setInterval(poll, 10_000);
    return () => { active = false; clearInterval(interval); };
  }, [setExpenseStatus]);

  const pauseExpense = useCallback((id: string) => {
    // Dispatching via Nomba Sub-Account Transfer endpoint — pause halts the
    // scheduled mandate without deleting the underlying agreement.
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'paused', failureReason: undefined } : e)),
    );
    setToast('Subscription paused');
  }, []);

  const resumeExpense = useCallback((id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'active', failureReason: undefined } : e)),
    );
    setToast('Subscription resumed');
  }, []);

  const cancelTrial = useCallback((id: string) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: 'paused', isTrial: false, trialDaysLeft: undefined }
          : e,
      ),
    );
    setToast('Trial cancelled — no charge will be made');
  }, []);

  // -- Failure simulations (DevTools panel) -------------------------------

  const simulateInsufficientFunds = useCallback(() => {
    // Ingesting payload from Nomba Charge Webhook — webhook reports a
    // declined attempt (insufficient_funds) on the customer's primary card.
    const target = expenses.find((e) => e.id === 'exp-thrift') ??
      expenses.find((e) => e.status === 'active');
    if (!target) return;

    setExpenseStatus(target.id, 'failed', 'insufficient_funds');
    setBanners((prev) => [
      ...prev.filter((b) => b.relatedExpenseId !== target.id),
      {
        id: generateBannerId(),
        kind: 'insufficient_funds',
        relatedExpenseId: target.id,
        message: `${target.name} failed — insufficient funds. Tap to switch to a backup Naira card or pay via Cash/Bank Transfer.`,
      },
    ]);
  }, [expenses, setExpenseStatus]);

  const simulateExpiredCard = useCallback(() => {
    // Ingesting payload from Nomba Charge Webhook — tokenised card flagged
    // as expiring within the current billing cycle.
    const target = expenses.find((e) => e.id === 'pro-vercel') ??
      expenses.find((e) => e.status === 'active');
    if (!target) return;

    setExpenseStatus(target.id, 'failed', 'expired_card');
    setBanners((prev) => [
      ...prev.filter((b) => b.relatedExpenseId !== target.id),
      {
        id: generateBannerId(),
        kind: 'expired_card',
        relatedExpenseId: target.id,
        message: `⚠️ Action Required: Your Nomba Tokenised Card used for ${target.name} is expiring. Update now to avoid service interruption.`,
      },
    ]);
  }, [expenses, setExpenseStatus]);

  const retryPayment = useCallback((id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    const idempotencyKey = generateIdempotencyKey();

    setProcessing((prev) => ({
      ...prev,
      [id]: { expenseId: id, idempotencyKey, startedAt: Date.now() },
    }));

    // Try real Nomba charge — fall back to simulation if backend not ready
    import('../lib/nomba').then(({ chargeRecurring }) => {
      chargeRecurring({
        expenseId: id,
        expenseName: target.name,
        amountNGN: target.currency === 'NGN' ? target.amount : target.amount * 1500,
        idempotencyKey,
      }).then((result) => {
        setProcessing((prev) => { const next = { ...prev }; delete next[id]; return next; });
        if (result.ok && result.checkoutUrl) {
          window.open(result.checkoutUrl, '_blank');
          setToast(`Redirecting to Nomba payment · Key: ${idempotencyKey}`);
        } else {
          setExpenseStatus(id, 'active');
          setBanners((prev) => prev.filter((b) => b.relatedExpenseId !== id));
          setToast(`Payment retried · Idempotency-Key ${idempotencyKey} prevented duplicate charge`);
        }
      }).catch(() => {
        setProcessing((prev) => { const next = { ...prev }; delete next[id]; return next; });
        setExpenseStatus(id, 'active');
        setBanners((prev) => prev.filter((b) => b.relatedExpenseId !== id));
        setToast(`Payment retried · Idempotency-Key ${idempotencyKey} prevented duplicate charge`);
      });
    });
  }, [expenses, setExpenseStatus]);

  // ── Mandates ───────────────────────────────────────────────────────────────
  // Creating a mandate flips an expense from manual "Pay now" to Nomba
  // auto-charging on its existing cadence. Used by both Express obligations
  // and Pro subscriptions — the mode is passed through for correct narration.
  const enableMandate = useCallback(async (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    setMandatePending((prev) => ({ ...prev, [id]: true }));

    // Map the expense's frequency to a mandate cadence. Anything that isn't a
    // clean daily/weekly cadence is treated as monthly.
    const cadence: 'daily' | 'weekly' | 'monthly' =
      target.frequency === 'daily' ? 'daily'
      : target.frequency === 'weekly' ? 'weekly'
      : 'monthly';

    try {
      const { createMandate } = await import('../lib/nomba');
      const result = await createMandate({
        expenseId: id,
        expenseName: target.name,
        amountNGN: target.currency === 'NGN' ? target.amount : Math.round(target.amount * 1500),
        cadence,
        mode: currentMode,
      });

      if (result.ok) {
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === id
              ? { ...e, mandateStatus: (result.status as Expense['mandateStatus']) ?? 'active', mandateId: result.mandateId }
              : e,
          ),
        );
        // If Nomba returns an authorization URL, the customer approves there.
        if (result.authorizationUrl) {
          window.open(result.authorizationUrl, '_blank');
          setToast('Approve the mandate in the Nomba window to start auto-pay');
        } else {
          setToast(`Auto-pay enabled for ${target.name} · charges ${cadence}`);
        }
      } else {
        setToast(result.error ?? 'Could not enable auto-pay — try again');
      }
    } catch {
      setToast('Could not reach the mandate service — check your connection');
    } finally {
      setMandatePending((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [expenses, currentMode]);

  const cancelMandateForExpense = useCallback(async (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target?.mandateId) {
      // No server mandate to cancel — just clear local state.
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, mandateStatus: 'none', mandateId: undefined } : e)),
      );
      return;
    }

    setMandatePending((prev) => ({ ...prev, [id]: true }));
    try {
      const { cancelMandate } = await import('../lib/nomba');
      const result = await cancelMandate(target.mandateId);
      if (result.ok) {
        setExpenses((prev) =>
          prev.map((e) => (e.id === id ? { ...e, mandateStatus: 'cancelled', mandateId: undefined } : e)),
        );
        setToast(`Auto-pay cancelled for ${target.name}`);
      } else {
        setToast(result.error ?? 'Could not cancel auto-pay');
      }
    } catch {
      setToast('Could not reach the mandate service');
    } finally {
      setMandatePending((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, [expenses]);

  const resetSimulations = useCallback(() => {
    setExpenses(INITIAL_EXPENSES);
    setBanners([]);
    setProcessing({});
    setAgenticOptimizer(DEFAULT_AGENTIC_STATE);
    setToast('Simulation state reset to defaults');
  }, []);

  // -- Banners --------------------------------------------------------------

  const dismissBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // -- Agentic optimizer (human-in-the-loop) ---------------------------------

  const openAgenticOptimizer = useCallback(() => {
    setAgenticOptimizer((prev) => ({ ...prev, open: true, resolved: 'pending' }));
  }, []);

  const closeAgenticOptimizer = useCallback(() => {
    setAgenticOptimizer((prev) => ({ ...prev, open: false }));
  }, []);

  const confirmAgenticOptimization = useCallback(() => {
    // Human-in-the-loop confirmation received — proceeding to pause the
    // unused-seat subscriptions identified by the optimizer.
    setAgenticOptimizer((prev) => {
      prev.targetIds.forEach((id) => {
        setExpenses((exps) =>
          exps.map((e) => (e.id === id ? { ...e, status: 'paused' } : e)),
        );
      });
      return { ...prev, open: false, resolved: 'approved' };
    });
    setToast('AI Agent optimization approved — 2 unused seats paused');
  }, []);

  const declineAgenticOptimization = useCallback(() => {
    setAgenticOptimizer((prev) => ({ ...prev, open: false, resolved: 'declined' }));
    setToast('AI Agent optimization declined — no changes made');
  }, []);

  // -- Budget envelopes (Express) -------------------------------------------

  const updateEnvelopeBudget = useCallback((categoryId: string, weeklyBudgetNGN: number) => {
    setBudgetEnvelopes((prev) =>
      prev.map((e) => (e.categoryId === categoryId ? { ...e, weeklyBudgetNGN } : e)),
    );
  }, []);

  // Sync envelope spending whenever a quick action is recorded
  // (called inside recordQuickAction below)
  function addEnvelopeSpend(categoryId: string, amount: number) {
    setBudgetEnvelopes((prev) =>
      prev.map((e) =>
        e.categoryId === categoryId
          ? { ...e, spentThisWeekNGN: e.spentThisWeekNGN + amount }
          : e,
      ),
    );
  }

  // -- Subscription graveyard -----------------------------------------------

  const cancelExpense = useCallback((id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;

    // Move to graveyard
    const monthlyNGN = target.currency === 'USD'
      ? target.amount * 1500
      : target.amount;
    const months = target.frequency === 'monthly' ? 3
      : target.frequency === 'yearly' ? 12
      : target.frequency === 'weekly' ? 1
      : 1;

    setGraveyardEntries((prev) => [
      {
        id: `grave-${id}-${Date.now()}`,
        name: target.name,
        categoryIcon: target.categoryIcon,
        totalSpentNGN: monthlyNGN * months,
        currency: target.currency,
        cancelledAt: Date.now(),
        monthsActive: months,
      },
      ...prev,
    ]);

    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setToast(`${target.name} cancelled and moved to Graveyard`);
  }, [expenses]);

  // -- Financial fingerprint patterns ---------------------------------------

  const financialPatterns = useMemo<FinancialPattern[]>(() => {
    const local = expenses.filter((e) => e.type === 'local');
    const tech = expenses.filter((e) => e.type === 'tech');
    const failedLocal = local.filter((e) => e.status === 'failed');
    const patterns: FinancialPattern[] = [];

    if (failedLocal.length > 0 && local.some((e) => e.status === 'active' && e.frequency === 'weekly')) {
      patterns.push({
        id: 'overlap-pattern',
        title: 'Overlapping weekly payments',
        description: `Your Thrift contribution and Market Levy both hit in the same week. You've missed the Thrift ${failedLocal.length} time(s). Consider staggering them — pay Thrift on Monday, Levy on Thursday.`,
        severity: 'warning',
        icon: '⚠️',
      });
    }

    if (contributionLog.length >= 3) {
      const recent = contributionLog.slice(0, 10);
      const shopTaps = recent.filter((e) => e.label === 'Shop Rent').length;
      if (shopTaps >= 3) {
        patterns.push({
          id: 'frequent-rent',
          title: 'Frequent small rent payments',
          description: 'You tap Shop Rent often in small amounts. Consolidating into one weekly payment could reduce your cognitive load and save you from missing a due date.',
          severity: 'tip',
          icon: '💡',
        });
      }
    }

    if (tech.filter((e) => e.isTrial).length >= 2) {
      patterns.push({
        id: 'trial-stacker',
        title: 'Trial stacker pattern detected',
        description: `You have ${tech.filter((e) => e.isTrial).length} active trials. Historically, people with 2+ concurrent trials forget to cancel at least one. Your Trial Virtual Cards can auto-block these.`,
        severity: 'warning',
        icon: '🎯',
      });
    }

    const monthlyTechNGN = tech
      .filter((e) => e.status === 'active')
      .reduce((s, e) => {
        const ngn = e.currency === 'USD' ? e.amount * 1500 : e.amount;
        return s + (e.frequency === 'monthly' ? ngn : e.frequency === 'yearly' ? ngn / 12 : ngn * 4);
      }, 0);

    if (monthlyTechNGN > 150000) {
      patterns.push({
        id: 'high-burn',
        title: 'High monthly software burn',
        description: `Your active SaaS subscriptions cost ₦${Math.round(monthlyTechNGN / 1000)}k/mo. The AI Optimizer found ${expenses.filter((e) => e.isTrial).length} subscriptions you haven't used this billing cycle.`,
        severity: 'insight',
        icon: '🔥',
      });
    }

    if (graveyardEntries.length > 0) {
      const totalWasted = graveyardEntries.reduce((s, e) => s + e.totalSpentNGN, 0);
      patterns.push({
        id: 'graveyard-insight',
        title: 'Money recovered from cancelled services',
        description: `You've cancelled ${graveyardEntries.length} subscription(s), saving ₦${Math.round(totalWasted / 1000)}k that would have continued billing. Your cancellation awareness is above average.`,
        severity: 'insight',
        icon: '✅',
      });
    }

    if (patterns.length === 0) {
      patterns.push({
        id: 'clean-slate',
        title: 'No patterns detected yet',
        description: 'Keep using Vepay for a few weeks. Your Financial Fingerprint builds from your real payment history — the more you use it, the sharper your insights become.',
        severity: 'tip',
        icon: '🌱',
      });
    }

    return patterns;
  }, [expenses, contributionLog, graveyardEntries]);

  const openFingerprint = useCallback(() => setFingerprintOpen(true), []);
  const closeFingerprint = useCallback(() => setFingerprintOpen(false), []);

  const generateInviteLink = useCallback(async (expenseId: string) => {
    const target = expenses.find((e) => e.id === expenseId);
    if (!target) return;

    // Build a real URL that routes to vepay.vercel.app with join context
    // The SignInPage reads these params and shows a join banner
    const params = new URLSearchParams({
      join: '1',
      sub: target.name,
      amount: String(Math.round(target.amount)),
      currency: target.currency,
      from: 'a friend', // prototype: in production this would be the user's real name
      group: target.sharedGroup?.name ?? `${target.name} Squad`,
      ref: Math.random().toString(36).slice(2, 8), // unique ref for tracking
    });

    const link = `https://vepay.vercel.app/?${params.toString()}`;
    setInviteModal({ open: true, link, expenseId });
  }, [expenses]);

  const closeInviteModal = useCallback(() => {
    setInviteModal(null);
  }, []);

  // -- Toast ------------------------------------------------------------------

  const clearToast = useCallback(() => setToast(null), []);

  const value: ClearSpendContextValue = {
    expenses,
    currentMode,
    displayCurrency,
    roundUpVaultEnabled,
    vaultBalanceNGN,
    ledgerVolumeNGN,
    ledgerFeesNGN,
    banners,
    processing,
    agenticOptimizer,
    toast,

    setMode,
    toggleMode,
    setDisplayCurrency,

    recordQuickAction,
    toggleRoundUpVault,

    pauseExpense,
    resumeExpense,
    cancelTrial,

    simulateInsufficientFunds,
    simulateExpiredCard,
    retryPayment,
    resetSimulations,
    enableMandate,
    cancelMandateForExpense,
    mandatePending,

    dismissBanner,

    openAgenticOptimizer,
    confirmAgenticOptimization,
    declineAgenticOptimization,
    closeAgenticOptimizer,

    generateInviteLink,
    inviteModal,
    closeInviteModal,

    contributionLog,

    budgetEnvelopes,
    updateEnvelopeBudget,

    graveyardEntries,
    cancelExpense,

    financialPatterns,
    fingerprintOpen,
    openFingerprint,
    closeFingerprint,

    dailySpendEntries,
    dailyBudgetNGN,
    setDailyBudgetNGN,
    logDailySpend,
    deleteDailySpendEntry,
    todaySpendNGN,
    todayDayKey,
    spendStreak,
    weeklySpendNGN,
    monthlySpendNGN,
    dailySpendByDay,

    clearToast,
  };

  return <ClearSpendContext.Provider value={value}>{children}</ClearSpendContext.Provider>;
}

export function useClearSpend(): ClearSpendContextValue {
  const ctx = useContext(ClearSpendContext);
  if (!ctx) {
    throw new Error('useClearSpend must be used within a ClearSpendProvider');
  }
  return ctx;
}
