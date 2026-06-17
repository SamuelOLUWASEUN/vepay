import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';

interface BannerStackProps {
  mode: 'EXPRESS' | 'PRO';
}

/**
 * Renders active SystemBanners (from simulateInsufficientFunds /
 * simulateExpiredCard) with mode-specific styling. Tapping the banner
 * triggers a retry via Nomba's checkout tokenization flow.
 */
export function BannerStack({ mode }: BannerStackProps) {
  const { banners, dismissBanner, retryPayment, processing } = useClearSpend();

  if (banners.length === 0) return null;

  const isExpress = mode === 'EXPRESS';

  return (
    <div className="flex flex-col gap-3">
      {banners.map((banner) => {
        const isProcessing = banner.relatedExpenseId
          ? Boolean(processing[banner.relatedExpenseId])
          : false;

        return (
          <div
            key={banner.id}
            className={[
              'relative overflow-hidden rounded-2xl border px-4 py-3.5 shadow-sm',
              'flex items-start gap-3',
              isExpress
                ? banner.kind === 'expired_card'
                  ? 'bg-express-amber-soft border-express-amber/40 text-express-ink'
                  : 'bg-express-red-soft border-express-red/40 text-express-ink animate-pulse'
                : banner.kind === 'expired_card'
                  ? 'bg-pro-amber/10 border-pro-amber/40 text-pro-ink'
                  : 'bg-pro-red-soft border-pro-red/50 text-pro-ink animate-pulse',
            ].join(' ')}
          >
            {isProcessing && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                  className={[
                    'h-full w-1/3 animate-processing-sweep',
                    isExpress ? 'bg-express-ink/5' : 'bg-white/5',
                  ].join(' ')}
                />
              </div>
            )}

            <div className="mt-0.5 shrink-0">
              {banner.kind === 'expired_card' ? (
                <CreditCard
                  className={[
                    'h-5 w-5',
                    isExpress ? 'text-express-amber' : 'text-pro-amber',
                  ].join(' ')}
                />
              ) : (
                <AlertTriangle
                  className={[
                    'h-5 w-5',
                    isExpress ? 'text-express-red' : 'text-pro-red',
                  ].join(' ')}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold font-display leading-snug">
                {banner.message}
              </p>

              {banner.relatedExpenseId && (
                <button
                  type="button"
                  onClick={() => retryPayment(banner.relatedExpenseId!)}
                  disabled={isProcessing}
                  className={[
                    'mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold',
                    'transition-colors disabled:opacity-60',
                    isExpress
                      ? 'bg-express-ink text-express-bg hover:bg-express-ink/90'
                      : 'bg-pro-ink text-pro-bg hover:bg-white',
                  ].join(' ')}
                >
                  {isProcessing ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing — Idempotency-Key check…
                    </>
                  ) : banner.kind === 'expired_card' ? (
                    'Update payment method'
                  ) : (
                    'Tap to retry · use backup Naira card'
                  )}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismissBanner(banner.id)}
              className="shrink-0 rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
