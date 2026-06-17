import { FileText, ScrollText, ShieldCheck } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatCurrency } from '../../lib/currency';
import { AJO_MEMBERS } from '../../lib/mockData';

/**
 * Ajo Group Ledger — timestamped, printable record of every contribution.
 *
 * Export opens a print-optimised page in a new tab. The user's browser
 * print dialog (Ctrl+P / ⌘+P) has a "Save as PDF" option on every
 * platform — Windows, Android Chrome, iOS Safari. No library needed.
 */
export function AjoGroupLedger() {
  const { contributionLog } = useClearSpend();

  const thriftEntries = contributionLog.filter((e) => e.label === 'Thrift/Ajo');
  const totalLogged = thriftEntries.reduce((s, e) => s + e.amountNGN, 0);

  function handleExport() {
    const rows = contributionLog
      .map((e) => {
        const d = new Date(e.timestamp);
        return `<tr>
          <td>${e.icon} ${e.label}</td>
          <td class="mono">${formatCurrency(e.amountNGN, 'NGN')}</td>
          <td class="muted">${d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
          <td class="muted">${d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</td>
        </tr>`;
      })
      .join('');

    const members = AJO_MEMBERS.map((m) => `<span class="member">${m.initials} ${m.name}</span>`).join('');
    const total = formatCurrency(contributionLog.reduce((s, e) => s + e.amountNGN, 0), 'NGN');
    const exportDate = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const exportTime = new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ajo Group Ledger — Vepay</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #2b1810;
      background: #fff;
      padding: 32px 40px;
      max-width: 680px;
      margin: 0 auto;
    }

    /* ── Header ─────────────────────────── */
    .header { border-bottom: 2px solid #2b1810; padding-bottom: 16px; margin-bottom: 20px; }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .logo-badge {
      width: 36px; height: 36px; border-radius: 8px;
      background: #2b1810; color: #fbf3e7;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 12px; letter-spacing: -0.5px;
    }
    .logo-name { font-weight: 800; font-size: 16px; }
    .doc-title { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    .doc-meta { font-size: 11px; color: #9c8a7c; }

    /* ── Verified badge ──────────────────── */
    .verified {
      display: inline-flex; align-items: center; gap: 6px;
      background: #e3f5ec; color: #0f9d58;
      font-size: 11px; font-weight: 700;
      padding: 4px 10px; border-radius: 9999px;
      margin: 12px 0;
    }

    /* ── Summary row ─────────────────────── */
    .summary {
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      gap: 12px; margin-bottom: 20px;
    }
    .summary-box {
      border: 1px solid #f0e1cd; border-radius: 8px;
      padding: 10px 12px;
    }
    .summary-box .val { font-size: 18px; font-weight: 800; font-family: 'Courier New', monospace; }
    .summary-box .lbl { font-size: 10px; color: #9c8a7c; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

    /* ── Members ─────────────────────────── */
    .members-section { margin-bottom: 20px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9c8a7c; margin-bottom: 8px; }
    .members { display: flex; flex-wrap: wrap; gap: 6px; }
    .member {
      font-size: 11px; font-weight: 600;
      border: 1px solid #f0e1cd; border-radius: 9999px;
      padding: 3px 10px; color: #2b1810;
    }

    /* ── Table ───────────────────────────── */
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    thead tr { background: #fbf3e7; }
    th {
      text-align: left; padding: 8px 10px;
      font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: #9c8a7c; border-bottom: 1px solid #f0e1cd;
    }
    td { padding: 9px 10px; border-bottom: 1px solid #f0e1cd; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #fdf8f2; }
    .mono { font-family: 'Courier New', monospace; font-weight: 700; }
    .muted { color: #9c8a7c; }
    .empty { text-align: center; color: #9c8a7c; padding: 24px 0; font-style: italic; }

    /* ── Total row ───────────────────────── */
    .total-row td {
      background: #2b1810; color: #fbf3e7;
      font-weight: 700; font-size: 13px;
      border: none; padding: 10px 10px;
    }
    .total-row td.mono { font-size: 15px; }

    /* ── Footer ──────────────────────────── */
    .footer {
      border-top: 1px solid #f0e1cd; padding-top: 12px;
      font-size: 10px; color: #9c8a7c; line-height: 1.6;
    }
    .footer strong { color: #2b1810; }

    /* ── Print styles ────────────────────── */
    @media print {
      body { padding: 20px; }
      @page { margin: 16mm; size: A4; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- Print button — hidden when printing -->
  <div class="no-print" style="margin-bottom:20px;display:flex;gap:10px;align-items:center">
    <button onclick="window.print()"
      style="background:#2b1810;color:#fbf3e7;border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer">
      🖨️ Save as PDF / Print
    </button>
    <span style="font-size:12px;color:#9c8a7c">Use your browser's <strong>Save as PDF</strong> option in the print dialog</span>
  </div>

  <div class="header">
    <div class="logo">
      <div class="logo-badge">VP</div>
      <span class="logo-name">Vepay</span>
    </div>
    <h1 class="doc-title">🐷 Ajo Group Ledger</h1>
    <p class="doc-meta">Exported on ${exportDate} at ${exportTime} · ${contributionLog.length} entries</p>
    <div class="verified">✓ Timestamped payment record · For dispute resolution</div>
  </div>

  <div class="summary">
    <div class="summary-box">
      <div class="val">${total}</div>
      <div class="lbl">Total logged</div>
    </div>
    <div class="summary-box">
      <div class="val">${contributionLog.length}</div>
      <div class="lbl">Entries</div>
    </div>
    <div class="summary-box">
      <div class="val">${AJO_MEMBERS.length}</div>
      <div class="lbl">Group members</div>
    </div>
  </div>

  <div class="members-section">
    <div class="section-title">Group members</div>
    <div class="members">${members}</div>
  </div>

  <div class="section-title">Payment history</div>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="4" class="empty">No entries recorded yet</td></tr>`}
      <tr class="total-row">
        <td colspan="2"><strong>Total logged</strong></td>
        <td colspan="2" class="mono">${total}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <strong>Vepay × Nomba</strong> — This ledger is a timestamped record generated from local device data.
    It serves as an impartial payment trail for thrift group dispute resolution.
    All entries reflect real user actions within the app.
    Generated: ${exportDate} at ${exportTime}.
  </div>

</body>
</html>`;

    // Open in new tab — user presses Ctrl+P or clicks "Save as PDF / Print"
    const win = window.open('', '_blank');
    if (!win) {
      // Popup blocked — fall back to blob download of the HTML
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
    // Small delay to let the page render before triggering print
    setTimeout(() => win.print(), 400);
  }

  return (
    <div className="rounded-2xl border border-express-border bg-express-surface shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-express-border">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-express-muted" />
          <p className="font-display text-sm font-semibold text-express-ink">
            Ajo Group Ledger
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

      {/* Group member summary */}
      <div className="px-5 py-3 border-b border-express-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-express-muted">Group members</p>
          <div className="flex items-center gap-1 text-[10px] text-express-green font-semibold">
            <ShieldCheck className="h-3 w-3" />
            Dispute-proof record
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {AJO_MEMBERS.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 rounded-full border border-express-border bg-express-bg px-2.5 py-1">
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                style={{ backgroundColor: m.avatarColor }}
              >
                {m.initials}
              </div>
              <span className="text-xs text-express-ink font-medium">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 divide-x divide-express-border border-b border-express-border">
        <div className="px-5 py-3 text-center">
          <p className="font-mono text-lg font-bold text-express-ink">
            {formatCurrency(totalLogged, 'NGN')}
          </p>
          <p className="text-[11px] text-express-muted">Thrift logged</p>
        </div>
        <div className="px-5 py-3 text-center">
          <p className="font-mono text-lg font-bold text-express-ink">{thriftEntries.length}</p>
          <p className="text-[11px] text-express-muted">Contributions</p>
        </div>
      </div>

      {/* Entry list */}
      {contributionLog.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-express-muted">Tap the action buttons above to start building your ledger</p>
        </div>
      ) : (
        <div className="max-h-48 overflow-y-auto divide-y divide-express-border">
          {contributionLog.map((entry) => {
            const d = new Date(entry.timestamp);
            return (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className="text-lg shrink-0">{entry.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-express-ink">{entry.label}</p>
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
  );
}
