import { useState, useMemo } from 'react';
import { Check, Flame, PiggyBank, Plus, Star, Target, Trophy, X } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';

// ── Inputs OUTSIDE to prevent remount ────────────────────────────────────────

interface GoalInputProps {
  name: string; target: string; emoji: string;
  onNameChange: (v: string) => void;
  onTargetChange: (v: string) => void;
  onEmojiChange: (v: string) => void;
  onSave: () => void; onCancel: () => void;
}

function GoalForm({ name, target, emoji, onNameChange, onTargetChange, onEmojiChange, onSave, onCancel }: GoalInputProps) {
  const emojis = ['🏠','🚗','📱','💻','🎓','✈️','🏪','⚡','💊','👶','🐄','🔧'];
  return (
    <div className="rounded-2xl border border-express-border bg-express-bg p-4 flex flex-col gap-3">
      <p className="font-display text-sm font-bold text-express-ink">New Savings Goal</p>
      <div className="flex flex-wrap gap-2">
        {emojis.map((e) => (
          <button key={e} type="button" onClick={() => onEmojiChange(e)}
            className={['h-9 w-9 rounded-xl text-xl flex items-center justify-center transition-colors',
              emoji === e ? 'bg-express-ink' : 'bg-express-surface border border-express-border hover:bg-express-border'].join(' ')}>
            {e}
          </button>
        ))}
      </div>
      <input type="text" value={name} onChange={(e) => onNameChange(e.target.value)}
        placeholder="What are you saving for? (Generator, School fees…)"
        className="w-full rounded-xl border border-express-border bg-express-surface px-4 py-2.5 text-sm text-express-ink placeholder-express-muted outline-none focus:border-express-green" />
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-express-muted font-mono">₦</span>
        <input type="number" value={target} onChange={(e) => onTargetChange(e.target.value)}
          placeholder="Target amount"
          className="w-full rounded-xl border border-express-border bg-express-surface pl-8 pr-4 py-2.5 text-sm font-mono text-express-ink placeholder-express-muted outline-none focus:border-express-green" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-xl border border-express-border py-2.5 text-sm font-semibold text-express-muted">Cancel</button>
        <button type="button" onClick={onSave} disabled={!name.trim() || !target}
          className="flex-1 rounded-xl bg-express-green text-white py-2.5 text-sm font-semibold disabled:opacity-40">Create goal</button>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavingsGoal {
  id: string; name: string; targetNGN: number;
  savedNGN: number; emoji: string; createdAt: number;
  completedAt?: number;
}

const GOALS_KEY = 'vepay.goals.v1';

function loadGoals(): SavingsGoal[] {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || '[]'); }
  catch { return []; }
}

function saveGoals(goals: SavingsGoal[]) {
  try { localStorage.setItem(GOALS_KEY, JSON.stringify(goals)); } catch { /* ignore */ }
}

// ── Confetti burst (CSS-only) ────────────────────────────────────────────────

function ConfettiBurst() {
  const colors = ['#0f9d58','#f5a623','#7c5cff','#e5484d','#3fe0c5'];
  return (
    <div className="fixed inset-0 z-[80] pointer-events-none flex items-center justify-center">
      <div className="relative w-64 h-64">
        {Array.from({ length: 24 }).map((_, i) => {
          const color = colors[i % colors.length];
          const angle = (i / 24) * 360;
          const dist = 60 + Math.random() * 80;
          const x = Math.cos((angle * Math.PI) / 180) * dist;
          const y = Math.sin((angle * Math.PI) / 180) * dist;
          return (
            <div key={i}
              className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-sm"
              style={{
                backgroundColor: color,
                transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
                opacity: 0.9,
              }}
            />
          );
        })}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-5xl">🎉</span>
          <p className="font-display font-black text-express-ink text-lg mt-1">Goal reached!</p>
          <p className="text-sm text-express-muted">Tap to continue</p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface SavingsPageProps {
  onClose: () => void;
}

/**
 * Savings Page — accessible from the sidebar.
 *
 * Features designed to make users obsessed and share:
 *
 * 1. SAVINGS GOALS — visual circular progress rings.
 *    Seeing a ring fill toward a real goal (generator, school fees)
 *    is more motivating than a number. People share progress screenshots.
 *
 * 2. MILESTONES + CONFETTI — when you hit 25/50/75/100% a celebration
 *    fires. This is the "WhatsApp moment" — people screenshot and share.
 *
 * 3. ROUND-UP VAULT — spare change summary with vault streak.
 *    Shows how tiny amounts compound into something real.
 *
 * 4. VAULT STREAK — consecutive days of round-ups, like Duolingo.
 *    Drives daily app opens just to protect the streak.
 */
export function SavingsPage({ onClose }: SavingsPageProps) {
  const { vaultBalanceNGN, roundUpVaultEnabled, toggleRoundUpVault, contributionLog } = useClearSpend();

  const [goals, setGoals] = useState<SavingsGoal[]>(loadGoals);
  const [showForm, setShowForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🏠');
  const [celebration, setCelebration] = useState<string | null>(null);
  const [addingToGoalId, setAddingToGoalId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');

  // Round-up entries from contribution log
  const totalRoundUps = useMemo(() =>
    contributionLog.reduce((s, e) => s + e.roundUpNGN, 0), [contributionLog]);

  // Vault streak — days with at least one round-up
  const vaultStreak = useMemo(() => {
    const daysWithRoundup = new Set(
      contributionLog.filter((e) => e.roundUpNGN > 0)
        .map((e) => new Date(e.timestamp).toISOString().slice(0, 10))
    );
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (daysWithRoundup.has(d.toISOString().slice(0, 10))) streak++;
      else break;
    }
    return streak;
  }, [contributionLog]);

  function createGoal() {
    if (!goalName.trim() || !goalTarget) return;
    const goal: SavingsGoal = {
      id: `goal_${Date.now()}`, name: goalName.trim(),
      targetNGN: parseInt(goalTarget, 10), savedNGN: 0,
      emoji: goalEmoji, createdAt: Date.now(),
    };
    const updated = [...goals, goal];
    setGoals(updated); saveGoals(updated);
    setShowForm(false); setGoalName(''); setGoalTarget(''); setGoalEmoji('🏠');
  }

  function addToGoal(goalId: string) {
    const amount = parseInt(addAmount, 10);
    if (!amount || amount <= 0) return;
    const updated = goals.map((g) => {
      if (g.id !== goalId) return g;
      const newSaved = g.savedNGN + amount;
      const prevPct = Math.floor((g.savedNGN / g.targetNGN) * 4) * 25;
      const newPct = Math.floor((newSaved / g.targetNGN) * 4) * 25;
      if (newPct > prevPct && newPct <= 100) {
        setTimeout(() => { setCelebration(goalId); setTimeout(() => setCelebration(null), 3000); }, 100);
      }
      return { ...g, savedNGN: Math.min(newSaved, g.targetNGN), completedAt: newSaved >= g.targetNGN ? Date.now() : undefined };
    });
    setGoals(updated); saveGoals(updated);
    setAddingToGoalId(null); setAddAmount('');
  }

  function deleteGoal(id: string) {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated); saveGoals(updated);
  }

  function getMilestone(pct: number): string {
    if (pct >= 100) return '🏆 Complete!';
    if (pct >= 75) return '🔥 Almost there';
    if (pct >= 50) return '⭐ Halfway!';
    if (pct >= 25) return '💪 Good start';
    return '';
  }

  return (
    <>
      {celebration && <ConfettiBurst />}

      <div className="fixed inset-0 z-[60] flex flex-col bg-express-bg overflow-y-auto animate-backdrop-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-express-bg border-b border-express-border px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-express-green" />
            <p className="font-display font-bold text-lg text-express-ink">Savings</p>
          </div>
          <button type="button" onClick={onClose}
            className="p-2 rounded-full text-express-muted hover:text-express-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-w-xl mx-auto w-full px-4 py-5 flex flex-col gap-5 pb-24">

          {/* Vault summary */}
          <div className="rounded-2xl border border-express-border bg-express-surface shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-express-border bg-express-ink">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display font-bold text-express-bg text-base">Round-Up Vault</p>
                  <p className="text-xs text-express-bg/60 mt-0.5">Spare change from every payment</p>
                </div>
                <button type="button" role="switch" aria-checked={roundUpVaultEnabled}
                  onClick={toggleRoundUpVault}
                  className={['relative h-7 w-12 rounded-full transition-colors shrink-0',
                    roundUpVaultEnabled ? 'bg-express-green' : 'bg-express-bg/20'].join(' ')}>
                  <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform block"
                    style={{ transform: roundUpVaultEnabled ? 'translateX(20px)' : 'translateX(2px)' }} />
                </button>
              </div>
              <p className="font-mono font-black text-4xl text-express-bg mt-3">
                {formatCurrency(vaultBalanceNGN, 'NGN')}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-express-bg/60">
                  ₦{totalRoundUps.toLocaleString('en-NG')} from round-ups
                </span>
                {vaultStreak > 0 && (
                  <div className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-express-amber" />
                    <span className="text-xs text-express-amber font-bold">{vaultStreak}d streak</span>
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="px-5 py-3 text-xs text-express-muted leading-relaxed">
              Every payment you tap rounds up to the nearest ₦100. The difference goes here automatically. Small change, big savings over time.
            </div>
          </div>

          {/* Savings goals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-bold text-express-ink">Savings Goals</p>
              {!showForm && (
                <button type="button" onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 rounded-full bg-express-ink text-express-bg text-xs font-semibold px-3 py-1.5 hover:bg-express-ink/90">
                  <Plus className="h-3.5 w-3.5" /> New goal
                </button>
              )}
            </div>

            {showForm && (
              <GoalForm name={goalName} target={goalTarget} emoji={goalEmoji}
                onNameChange={setGoalName} onTargetChange={setGoalTarget}
                onEmojiChange={setGoalEmoji} onSave={createGoal}
                onCancel={() => setShowForm(false)} />
            )}

            {goals.length === 0 && !showForm && (
              <div className="rounded-2xl border border-express-border border-dashed px-5 py-8 text-center">
                <Target className="h-8 w-8 text-express-border mx-auto mb-2" />
                <p className="text-sm font-semibold text-express-ink">No goals yet</p>
                <p className="text-xs text-express-muted mt-1">
                  Create your first savings goal — generator, school fees, shop upgrade…
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {goals.map((goal) => {
                const pct = Math.min((goal.savedNGN / goal.targetNGN) * 100, 100);
                const isCelebrating = celebration === goal.id;
                const milestone = getMilestone(pct);
                const isComplete = pct >= 100;
                const isAddingHere = addingToGoalId === goal.id;

                // SVG circle progress
                const r = 30;
                const circ = 2 * Math.PI * r;
                const dash = (pct / 100) * circ;

                return (
                  <div key={goal.id} className={[
                    'rounded-2xl border shadow-sm overflow-hidden transition-all',
                    isComplete ? 'border-express-green bg-express-green-soft' :
                    isCelebrating ? 'border-express-amber bg-express-amber-soft' :
                    'border-express-border bg-express-surface',
                  ].join(' ')}>
                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Ring */}
                      <div className="relative shrink-0">
                        <svg width="72" height="72" viewBox="0 0 72 72">
                          <circle cx="36" cy="36" r={r} fill="none"
                            stroke={isComplete ? '#e3f5ec' : '#f0e1cd'} strokeWidth="6" />
                          <circle cx="36" cy="36" r={r} fill="none"
                            stroke={isComplete ? '#0f9d58' : pct >= 75 ? '#f5a623' : '#0f9d58'}
                            strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={circ} strokeDashoffset={circ - dash}
                            transform="rotate(-90 36 36)"
                            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl">{goal.emoji}</span>
                          <span className="text-[10px] font-bold text-express-ink">{Math.round(pct)}%</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-display font-bold text-express-ink text-sm leading-tight">{goal.name}</p>
                          <button type="button" onClick={() => deleteGoal(goal.id)}
                            className="text-express-muted hover:text-express-red p-0.5 shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="font-mono font-bold text-express-green text-sm">
                            {formatCurrency(goal.savedNGN, 'NGN')}
                          </span>
                          <span className="text-[10px] text-express-muted">
                            of {formatCurrency(goal.targetNGN, 'NGN')}
                          </span>
                        </div>

                        {milestone && (
                          <span className="text-[10px] font-bold text-express-amber mt-0.5 block">
                            {milestone}
                          </span>
                        )}

                        {isComplete ? (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Trophy className="h-3.5 w-3.5 text-express-green" />
                            <span className="text-xs font-bold text-express-green">Goal achieved!</span>
                          </div>
                        ) : (
                          <div className="mt-2">
                            {isAddingHere ? (
                              <div className="flex gap-2">
                                <input type="number" value={addAmount}
                                  onChange={(e) => setAddAmount(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') addToGoal(goal.id); }}
                                  placeholder="Amount (₦)"
                                  className="flex-1 rounded-lg border border-express-border bg-express-bg px-3 py-1.5 text-xs font-mono text-express-ink outline-none focus:border-express-green"
                                  autoFocus />
                                <button type="button" onClick={() => addToGoal(goal.id)}
                                  className="rounded-lg bg-express-green text-white text-xs font-bold px-3 py-1.5">
                                  Add
                                </button>
                                <button type="button" onClick={() => setAddingToGoalId(null)}
                                  className="rounded-lg border border-express-border text-express-muted text-xs px-2 py-1.5">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => setAddingToGoalId(goal.id)}
                                className="text-[11px] font-semibold text-express-green bg-express-green-soft border border-express-green/20 rounded-lg px-3 py-1 hover:bg-express-green/15 transition-colors">
                                + Add to goal
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestones achieved */}
          {goals.some((g) => g.completedAt) && (
            <div className="rounded-2xl border border-express-border bg-express-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-express-amber" />
                <p className="font-display font-bold text-sm text-express-ink">Goals Achieved</p>
              </div>
              <div className="flex flex-col gap-2">
                {goals.filter((g) => g.completedAt).map((g) => (
                  <div key={g.id} className="flex items-center gap-3 rounded-xl bg-express-green-soft border border-express-green/20 px-4 py-2.5">
                    <span className="text-xl">{g.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-express-ink">{g.name}</p>
                      <p className="text-xs text-express-muted">{formatCurrency(g.targetNGN, 'NGN')} saved</p>
                    </div>
                    <Check className="h-4 w-4 text-express-green" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
