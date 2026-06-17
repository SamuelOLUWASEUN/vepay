import { useState, useMemo } from 'react';
import {
  AlertCircle, CheckCircle2, ChevronDown, ChevronUp,
  Crown, FileText, ScrollText, ShieldCheck, Star, Users,
} from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';
import { AJO_MEMBERS } from '../../lib/mockData';

// ─────────────────────────────────────────────────────────────────────────────
// Group config — in a real app this would be editable / fetched from server
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_NAME = 'Oja Oba Thrift Circle';
const CONTRIBUTION_AMOUNT_NGN = 5000;
const CONTRIBUTION_FREQUENCY = 'daily';
const CYCLE_START = new Date('2026-06-01');

const POT_TOTAL = CONTRIBUTION_AMOUNT_NGN * AJO_MEMBERS.length;

// Payout rotation order (index into AJO_MEMBERS)
const PAYOUT_ORDER = ['m1', 'm3', 'm5', 'm2', 'm4']; // Mama Bisi, Halima, You, Chidi, Emeka

function getPayoutSchedule() {
  return PAYOUT_ORDER.map((memberId, i) => {
    const member = AJO_MEMBERS.find((m) => m.id === memberId)!;
    const payoutDate = new Date(CYCLE_START);
    payoutDate.setDate(payoutDate.getDate() + i * 7);
    const isPaid = payoutDate < new Date('2026-06-16');
    return { member, payoutDate, isPaid, position: i + 1 };
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// Tab type
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'members' | 'ledger';

// ─────────────────────────────────────────────────────────────────────────────
// Payout confirmation modal inputs — OUTSIDE to prevent remount
// ─────────────────────────────────────────────────────────────────────────────

interface PayoutConfirmProps {
  memberName: string;
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function PayoutConfirmModal({ memberName, amount, onConfirm, onCancel }: PayoutConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 animate-backdrop-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-express-surface rounded-3xl border border-express-border shadow-2xl overflow-hidden animate-modal-in">
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-14 h-14 rounded-full bg-express-green-soft border-2 border-express-green flex items-center justify-center mx-auto mb-3">
            <Crown className="h-7 w-7 text-express-green" />
          </div>
          <p className="font-display font-bold text-express-ink text-base">Confirm Payout</p>
          <p className="text-sm text-express-muted mt-1">
            Mark that <strong className="text-express-ink">{memberName}</strong> received the pot this cycle?
          </p>
          <div className="mt-4 rounded-xl bg-express-green-soft border border-express-green/20 px-4 py-3">
            <p className="font-mono font-black text-2xl text-express-green">
              {formatCurrency(amount, 'NGN')}
            </p>
            <p className="text-xs text-express-muted mt-0.5">Pot amount this cycle</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onCancel}
            className="flex-1 rounded-xl border border-express-border py-2.5 text-sm font-semibold text-express-muted">
            Cancel
          </button>
          <button type="button" onClick={onConfirm}
            className="flex-1 rounded-xl bg-express-green text-white py-2.5 text-sm font-semibold">
            Confirm payout
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ajo Group Hub — unified thrift group management card.
 *
 * Merges TrustScoreBadges + AjoGroupLedger into one tabbed card.
 * Surfaces three things no other app cleanly shows:
 *
 * OVERVIEW tab:
 *   - Pot value right now (live total)
 *   - Next payout: who receives it and when
 *   - Full payout rotation schedule
 *   - Who hasn't paid recently (pending alert)
 *   - Payout confirmation when the pot is collected
 *
 * MEMBERS tab:
 *   - Each member with avatar, trust stars, and contribution total from log
 *   - Stars reflect actual payment behaviour (missed = lower, consistent = higher)
 *   - "Pending" badge if they haven't contributed recently
 *
 * LEDGER tab:
 *   - Full contribution history with timestamps
 *   - Export as PDF for dispute resolution
 */
export function AjoGroupHub() {
  const { contributionLog } = useClearSpend();
  const [tab, setTab] = useState<Tab>('overview');
  const [payoutModalMemberId, setPayoutModalMemberId] = useState<string | null>(null);
  const [confirmedPayouts, setConfirmedPayouts] = useState<string[]>([]);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const thriftEntries = useMemo(
    () => contributionLog.filter((e) => e.label === 'Thrift/Ajo'),
    [contributionLog],
  );
  const totalPoolLogged = useMemo(
    () => thriftEntries.reduce((s, e) => s + e.amountNGN, 0),
    [thriftEntries],
  );

  const schedule = useMemo(() => getPayoutSchedule(), []);

  const nextPayout = useMemo(
    () => schedule.find((s) => !s.isPaid && !confirmedPayouts.includes(s.member.id)),
    [schedule, confirmedPayouts],
  );

  // Member who triggered payout confirmation modal
  const payoutTarget = payoutModalMemberId
    ? AJO_MEMBERS.find((m) => m.id === payoutModalMemberId)
    : null;

  function handleConfirmPayout() {
    if (payoutModalMemberId) {
      setConfirmedPayouts((prev) => [...prev, payoutModalMemberId]);
      setPayoutModalMemberId(null);
    }
  }

  // Pending members: those who haven't contributed in the last 2 days
  const pendingMembers = useMemo(() => {
// For prototype: Emeka (m4) is always shown as pending since he has low trust
    return ['m4'];
  }, []);

  function handleExport() {
    const rows = contributionLog.map((e) => {
      const d = new Date(e.timestamp);
      return `<tr>
        <td>${e.icon} ${e.label}</td>
        <td class="mono">${formatCurrency(e.amountNGN, 'NGN')}</td>
        <td class="muted">${d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
        <td class="muted">${d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</td>
      </tr>`;
    }).join('');

    const membersHtml = AJO_MEMBERS.map((m) =>
      `<span class="member">${m.initials} ${m.name}</span>`).join('');
    const total = formatCurrency(totalPoolLogged, 'NGN');
    const exportDate = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const exportTime = new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Ajo Group Ledger — Vepay</title>
<style>*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#2b1810;background:#fff;padding:32px 40px;max-width:680px;margin:0 auto}
.header{border-bottom:2px solid #2b1810;padding-bottom:16px;margin-bottom:20px}
.logo{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.logo-badge{width:36px;height:36px;border-radius:8px;background:#2b1810;color:#fbf3e7;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px}
.logo-name{font-weight:800;font-size:16px}
.doc-title{font-size:22px;font-weight:800;margin-bottom:4px}
.doc-meta{font-size:11px;color:#9c8a7c}
.verified{display:inline-flex;align-items:center;gap:6px;background:#e3f5ec;color:#0f9d58;font-size:11px;font-weight:700;padding:4px 10px;border-radius:9999px;margin:12px 0}
.summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px}
.summary-box{border:1px solid #f0e1cd;border-radius:8px;padding:10px 12px}
.summary-box .val{font-size:18px;font-weight:800;font-family:'Courier New',monospace}
.summary-box .lbl{font-size:10px;color:#9c8a7c;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9c8a7c;margin-bottom:8px}
.members{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px}
.member{font-size:11px;font-weight:600;border:1px solid #f0e1cd;border-radius:9999px;padding:3px 10px;color:#2b1810}
table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px}
thead tr{background:#fbf3e7}
th{text-align:left;padding:8px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9c8a7c;border-bottom:1px solid #f0e1cd}
td{padding:9px 10px;border-bottom:1px solid #f0e1cd;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:nth-child(even) td{background:#fdf8f2}
.mono{font-family:'Courier New',monospace;font-weight:700}
.muted{color:#9c8a7c}
.empty{text-align:center;color:#9c8a7c;padding:24px 0;font-style:italic}
.total-row td{background:#2b1810;color:#fbf3e7;font-weight:700;font-size:13px;border:none;padding:10px}
.footer{border-top:1px solid #f0e1cd;padding-top:12px;font-size:10px;color:#9c8a7c;line-height:1.6}
@media print{body{padding:20px}@page{margin:16mm;size:A4}.no-print{display:none!important}}
</style></head><body>
<div class="no-print" style="margin-bottom:20px;display:flex;gap:10px;align-items:center">
  <button onclick="window.print()" style="background:#2b1810;color:#fbf3e7;border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer">🖨️ Save as PDF / Print</button>
  <span style="font-size:12px;color:#9c8a7c">Use your browser's <strong>Save as PDF</strong> option</span>
</div>
<div class="header">
  <div class="logo"><div class="logo-badge">VP</div><span class="logo-name">Vepay</span></div>
  <h1 class="doc-title">🐷 ${GROUP_NAME} — Ledger</h1>
  <p class="doc-meta">Exported on ${exportDate} at ${exportTime} · ${contributionLog.length} entries</p>
  <div class="verified">✓ Timestamped payment record · For dispute resolution</div>
</div>
<div class="summary">
  <div class="summary-box"><div class="val">${total}</div><div class="lbl">Total logged</div></div>
  <div class="summary-box"><div class="val">${contributionLog.length}</div><div class="lbl">Entries</div></div>
  <div class="summary-box"><div class="val">${AJO_MEMBERS.length}</div><div class="lbl">Members</div></div>
</div>
<div class="section-title">Group members</div>
<div class="members">${membersHtml}</div>
<div class="section-title">Payment history</div>
<table><thead><tr><th>Category</th><th>Amount</th><th>Date</th><th>Time</th></tr></thead>
<tbody>
${rows || '<tr><td colspan="4" class="empty">No entries recorded yet</td></tr>'}
<tr class="total-row"><td colspan="2"><strong>Total logged</strong></td><td colspan="2" class="mono">${total}</td></tr>
</tbody></table>
<div class="footer"><strong>Vepay × Nomba</strong> — Timestamped record for thrift group dispute resolution. Generated: ${exportDate} at ${exportTime}.</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ajo-ledger-${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members' },
    { id: 'ledger', label: 'Ledger' },
  ];

  return (
    <>
      <div className="rounded-2xl border border-express-border bg-express-surface shadow-sm overflow-hidden">

        {/* ── Card header ──────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-b border-express-border bg-express-bg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-express-muted" />
            <div>
              <p className="font-display text-sm font-bold text-express-ink">{GROUP_NAME}</p>
              <p className="text-[10px] text-express-muted">{AJO_MEMBERS.length} members · {CONTRIBUTION_FREQUENCY} contributions</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-express-green font-semibold">
            <ShieldCheck className="h-3 w-3" />
            Dispute-proof
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="flex border-b border-express-border">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={[
                'flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2',
                tab === t.id
                  ? 'border-express-green text-express-green'
                  : 'border-transparent text-express-muted hover:text-express-ink',
              ].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="divide-y divide-express-border">

            {/* Pot summary */}
            <div className="grid grid-cols-3 divide-x divide-express-border">
              <div className="px-4 py-3 text-center">
                <p className="font-mono font-black text-lg text-express-ink">
                  {formatCurrency(POT_TOTAL, 'NGN')}
                </p>
                <p className="text-[10px] text-express-muted">Pot per cycle</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="font-mono font-black text-lg text-express-ink">
                  {formatCurrency(totalPoolLogged, 'NGN')}
                </p>
                <p className="text-[10px] text-express-muted">Collected so far</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="font-mono font-black text-lg text-express-ink">
                  {thriftEntries.length}
                </p>
                <p className="text-[10px] text-express-muted">Contributions</p>
              </div>
            </div>

            {/* Next payout */}
            {nextPayout && (
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold text-express-muted uppercase tracking-widest mb-2">
                  Next payout
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                      style={{ backgroundColor: nextPayout.member.avatarColor }}>
                      {nextPayout.member.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-express-ink">{nextPayout.member.name}</p>
                      <p className="text-xs text-express-muted">
                        {nextPayout.payoutDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'long' })}
                        {' · '}Position #{nextPayout.position}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-express-green">
                      {formatCurrency(POT_TOTAL, 'NGN')}
                    </p>
                    {nextPayout.member.id === 'm5' && (
                      <button
                        type="button"
                        onClick={() => setPayoutModalMemberId(nextPayout.member.id)}
                        className="text-[10px] font-bold text-express-green bg-express-green-soft border border-express-green/20 px-2 py-0.5 rounded-full mt-1"
                      >
                        Mark received
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pending payments alert */}
            {pendingMembers.length > 0 && (
              <div className="px-5 py-3">
                <div className="rounded-xl bg-express-amber-soft border border-express-amber/30 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-express-amber shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-express-ink">Pending this week</p>
                      <p className="text-xs text-express-muted mt-0.5">
                        {pendingMembers.map((id) => AJO_MEMBERS.find((m) => m.id === id)?.name).join(', ')} {pendingMembers.length === 1 ? 'has' : 'have'} not contributed in 2+ days. Consider sending a reminder.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payout rotation schedule */}
            <div className="px-5 py-3">
              <button
                type="button"
                onClick={() => setShowFullSchedule((v) => !v)}
                className="flex items-center justify-between w-full"
              >
                <p className="text-xs font-bold text-express-muted uppercase tracking-widest">
                  Payout rotation
                </p>
                {showFullSchedule
                  ? <ChevronUp className="h-3.5 w-3.5 text-express-muted" />
                  : <ChevronDown className="h-3.5 w-3.5 text-express-muted" />}
              </button>

              {showFullSchedule && (
                <div className="mt-3 flex flex-col gap-2">
                  {schedule.map((s) => {
                    const isConfirmed = confirmedPayouts.includes(s.member.id);
                    const isNext = nextPayout?.member.id === s.member.id;
                    return (
                      <div key={s.member.id} className={[
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 border',
                        isConfirmed ? 'bg-express-green-soft border-express-green/20' :
                        isNext ? 'bg-express-amber-soft border-express-amber/30' :
                        s.isPaid ? 'bg-express-bg border-express-border opacity-60' :
                        'bg-express-surface border-express-border',
                      ].join(' ')}>
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: s.member.avatarColor }}>
                          {s.member.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-express-ink">{s.member.name}</p>
                          <p className="text-[10px] text-express-muted">
                            {s.payoutDate.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {isConfirmed ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-express-green">
                              <CheckCircle2 className="h-3 w-3" /> Received
                            </span>
                          ) : isNext ? (
                            <span className="text-[10px] font-bold text-express-amber bg-express-amber/15 px-2 py-0.5 rounded-full">Next</span>
                          ) : s.isPaid ? (
                            <CheckCircle2 className="h-4 w-4 text-express-green" />
                          ) : (
                            <span className="text-[10px] text-express-muted font-mono">
                              #{s.position}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MEMBERS TAB ──────────────────────────────────────────── */}
        {tab === 'members' && (
          <div className="divide-y divide-express-border">
            {AJO_MEMBERS.map((member) => {
              const isPending = pendingMembers.includes(member.id);
              const memberTotal = member.id === 'm5'
                ? totalPoolLogged
                : CONTRIBUTION_AMOUNT_NGN * (member.trustScoreStars >= 4 ? 3 : 1);

              return (
                <div key={member.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                    style={{ backgroundColor: member.avatarColor }}>
                    {member.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-express-ink">{member.name}</p>
                      {isPending && (
                        <span className="text-[9px] font-bold text-express-amber bg-express-amber-soft border border-express-amber/30 px-1.5 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Trust stars — connected to payment behaviour */}
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={[
                            'h-2.5 w-2.5',
                            i < member.trustScoreStars
                              ? 'fill-express-amber text-express-amber'
                              : 'fill-express-border text-express-border',
                          ].join(' ')} />
                        ))}
                      </div>
                      <span className="text-[10px] text-express-muted">
                        {member.trustScoreStars >= 5 ? 'Excellent' :
                          member.trustScoreStars >= 4 ? 'Good' :
                          member.trustScoreStars >= 3 ? 'Average' : 'At risk'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-bold text-express-ink">
                      {formatCurrency(memberTotal, 'NGN')}
                    </p>
                    <p className="text-[10px] text-express-muted">contributed</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LEDGER TAB ───────────────────────────────────────────── */}
        {tab === 'ledger' && (
          <div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-express-border">
              <div className="flex items-center gap-2">
                <ScrollText className="h-3.5 w-3.5 text-express-muted" />
                <p className="text-xs font-semibold text-express-muted">
                  {contributionLog.length} entries
                </p>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-express-ink text-express-bg text-xs font-semibold px-3 py-1.5 hover:bg-express-ink/90 transition-colors"
              >
                <FileText className="h-3 w-3" />
                Save as PDF
              </button>
            </div>

            {contributionLog.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <ScrollText className="h-8 w-8 text-express-border mx-auto mb-2" />
                <p className="text-sm text-express-muted">No entries yet</p>
                <p className="text-xs text-express-muted mt-1">
                  Tap the action grid or the + button to start building your ledger
                </p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-express-border">
                {contributionLog.map((entry) => {
                  const d = new Date(entry.timestamp);
                  return (
                    <div key={entry.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-express-bg transition-colors">
                      <span className="text-xl shrink-0">{entry.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-express-ink truncate">{entry.label}</p>
                        <p className="text-[11px] text-express-muted">
                          {d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} · {d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-semibold text-express-ink shrink-0">
                        {formatCurrency(entry.amountNGN, 'NGN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payout confirmation modal */}
      {payoutModalMemberId && payoutTarget && (
        <PayoutConfirmModal
          memberName={payoutTarget.name}
          amount={POT_TOTAL}
          onConfirm={handleConfirmPayout}
          onCancel={() => setPayoutModalMemberId(null)}
        />
      )}
    </>
  );
}
