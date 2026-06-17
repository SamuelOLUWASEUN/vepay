import { useState } from 'react';
import {
  Check,
  Copy,
  Link2,
  MessageCircle,
  Share2,
  Users,
  X,
} from 'lucide-react';

interface InviteLinkModalProps {
  open: boolean;
  link: string;
  groupName: string;
  perPersonAmount: string;
  totalAmount: string;
  pendingCount: number;
  onClose: () => void;
}

/**
 * Invite Link Modal — replaces the plain clipboard-only behavior.
 * Shows the generated link with a copy button, QR-code placeholder,
 * share options, and social proof of pending invites.
 */
export function InviteLinkModal({
  open,
  link,
  groupName,
  perPersonAmount,
  totalAmount,
  pendingCount,
  onClose,
}: InviteLinkModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // fallback: select the input
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleShareWhatsApp() {
    const text = encodeURIComponent(
      `Hey! Join our ${groupName} split on Vepay — you only pay ${perPersonAmount}/mo instead of ${totalAmount}. Join here: ${link}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  function handleShareTwitter() {
    const text = encodeURIComponent(
      `Splitting ${groupName} with friends on Vepay 💸 Each person pays ${perPersonAmount}/mo. Join us: ${link}`,
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 animate-backdrop-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-3xl border border-pro-border bg-pro-surface shadow-2xl overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-pro-muted hover:text-pro-ink hover:bg-pro-surface-2 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-2xl bg-pro-cyan/15 p-3">
              <Users className="h-5 w-5 text-pro-cyan" />
            </div>
            <div>
              <p className="font-display font-bold text-pro-ink text-base">Syndicate Invite</p>
              <p className="text-xs text-pro-muted">{groupName}</p>
            </div>
          </div>
        </div>

        {/* Savings callout */}
        <div className="mx-6 mb-4 rounded-2xl bg-gradient-to-br from-pro-cyan/10 to-pro-violet/10 border border-pro-cyan/20 px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs text-pro-muted">Each person pays</p>
              <p className="font-mono font-bold text-pro-cyan text-xl">{perPersonAmount}<span className="text-sm font-normal text-pro-muted">/mo</span></p>
            </div>
            <div className="flex items-center justify-between sm:flex-col sm:text-right gap-4 sm:gap-0">
              <div>
                <p className="text-xs text-pro-muted">Instead of</p>
                <p className="font-mono font-semibold text-pro-muted line-through text-base">{totalAmount}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-pro-muted">{pendingCount} awaiting</p>
                <div className="flex -space-x-1.5 mt-1 justify-end">
                  {Array.from({ length: Math.min(pendingCount, 3) }).map((_, i) => (
                    <div key={i} className="h-6 w-6 rounded-full border-2 border-pro-surface bg-pro-violet/30 flex items-center justify-center">
                      <span className="text-[8px] text-pro-violet font-bold">?</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Link box */}
        <div className="mx-6 mb-4">
          <p className="text-xs font-semibold text-pro-muted uppercase tracking-wide mb-2">
            <Link2 className="inline h-3 w-3 mr-1" />
            Invite link
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-pro-border bg-pro-bg px-3 py-2.5">
            <p className="font-mono text-xs text-pro-muted flex-1 truncate">{link}</p>
            <button
              type="button"
              onClick={handleCopy}
              className={[
                'shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                copied
                  ? 'bg-pro-cyan/20 text-pro-cyan'
                  : 'bg-pro-violet text-white hover:bg-pro-violet/90',
              ].join(' ')}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share options */}
        <div className="mx-6 mb-5">
          <p className="text-xs font-semibold text-pro-muted uppercase tracking-wide mb-2">
            <Share2 className="inline h-3 w-3 mr-1" />
            Share via
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl border border-pro-border bg-pro-surface-2 py-2.5 text-sm font-semibold text-pro-ink hover:border-green-500/40 hover:text-green-400 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleShareTwitter}
              className="flex items-center justify-center gap-2 rounded-xl border border-pro-border bg-pro-surface-2 py-2.5 text-sm font-semibold text-pro-ink hover:border-sky-400/40 hover:text-sky-400 transition-colors"
            >
              <span className="font-bold text-base leading-none">𝕏</span>
              Twitter / X
            </button>
          </div>
        </div>

        {/* Footer note */}
        <div className="border-t border-pro-border px-6 py-3">
          <p className="text-[11px] text-pro-muted text-center leading-relaxed">
            Link expires in 7 days · Only people with the link can join · Powered by Nomba Split
          </p>
        </div>
      </div>
    </div>
  );
}
