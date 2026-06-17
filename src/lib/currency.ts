// ============================================================================
// Currency utilities
// Single source of truth for formatting + converting between NGN and USD.
// Baseline rate is intentionally a fixed constant for prototype purposes —
// in production this would be sourced from Nomba's FX/treasury endpoint.
// ============================================================================

import type { Currency, Frequency } from '../types';

/** 1 USD = 1,500 NGN baseline (fixed for prototype) */
export const USD_TO_NGN_RATE = 1500;

/**
 * Formats a numeric amount into a localized currency string.
 * NGN -> ₦5,000 (no decimals, thousands separators)
 * USD -> $20.00 (two decimals, thousands separators)
 */
export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'NGN') {
    return `₦${amount.toLocaleString('en-NG', {
      maximumFractionDigits: 0,
    })}`;
  }

  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Converts an amount from its source currency into the target currency
 * using the fixed USD_TO_NGN_RATE baseline.
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
): number {
  if (from === to) return amount;

  if (from === 'USD' && to === 'NGN') {
    return amount * USD_TO_NGN_RATE;
  }

  // NGN -> USD
  return amount / USD_TO_NGN_RATE;
}

/**
 * Converts + formats in one call. Useful for rendering mixed-currency
 * entries in a single target display currency (Pro Mode segment toggle).
 */
export function formatConverted(
  amount: number,
  from: Currency,
  to: Currency,
): string {
  return formatCurrency(convertCurrency(amount, from, to), to);
}

/**
 * Multiplier to normalize any frequency into a "per hour" rate.
 * Used to power the Pro Mode "Digital Burn Rate" ticker.
 */
const HOURS_PER_FREQUENCY: Record<Frequency, number> = {
  daily: 24,
  weekly: 24 * 7,
  monthly: 24 * 30, // 30-day month approximation
  yearly: 24 * 365,
};

/**
 * Returns the equivalent hourly cost of a recurring expense.
 */
export function toHourlyRate(amount: number, frequency: Frequency): number {
  return amount / HOURS_PER_FREQUENCY[frequency];
}

/**
 * Human label for a frequency, used across both UIs.
 */
export function frequencyLabel(frequency: Frequency): string {
  switch (frequency) {
    case 'daily':
      return '/day';
    case 'weekly':
      return '/week';
    case 'monthly':
      return '/mo';
    case 'yearly':
      return '/yr';
  }
}
