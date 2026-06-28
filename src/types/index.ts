// ============================================================================
// Vepay — Core Data Model
// Shared between EXPRESS MODE and PRO MODE. Both UIs read and write the same
// underlying Expense[] array via the useClearSpend hook/context.
// ============================================================================

export type Currency = 'USD' | 'NGN';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ExpenseType = 'tech' | 'local';

export type ExpenseStatus = 'active' | 'paused' | 'failed';

/** Lifecycle of a Nomba recurring-charge mandate attached to an expense. */
export type MandateStatus =
  | 'none'
  | 'pending_authorization'
  | 'active'
  | 'cancelled';

export type FailureReason = 'insufficient_funds' | 'expired_card';

export interface SharedGroup {
  name: string;
  pendingMembers: string[];
  platformFeeAccrued: number;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  frequency: Frequency;
  type: ExpenseType;
  categoryIcon: string;
  dueDate: string; // YYYY-MM-DD
  status: ExpenseStatus;
  failureReason?: FailureReason;
  isTrial: boolean;
  trialDaysLeft?: number;
  sharedGroup?: SharedGroup;
  /** Nomba mandate lifecycle. Defaults to 'none' (manual payments). */
  mandateStatus?: MandateStatus;
  mandateId?: string;
}

// ----------------------------------------------------------------------------
// UI Mode — controls the "Dual-Interface Onboarding Selector"
// ----------------------------------------------------------------------------

export type Mode = 'EXPRESS' | 'PRO';

// ----------------------------------------------------------------------------
// Express Mode — Round-Up Savings Vault & Trust Score support types
// ----------------------------------------------------------------------------

export interface AjoMember {
  id: string;
  name: string;
  trustScoreStars: 1 | 2 | 3 | 4 | 5;
  avatarColor: string;
  initials: string;
}

// ----------------------------------------------------------------------------
// Idempotency / Processing — Network Resiliency Simulation
// ----------------------------------------------------------------------------

export interface ProcessingState {
  expenseId: string;
  idempotencyKey: string;
  startedAt: number;
}

// ----------------------------------------------------------------------------
// Toast / banner notifications surfaced by the DevTools simulation panel
// ----------------------------------------------------------------------------

export interface SystemBanner {
  id: string;
  kind: 'expired_card' | 'insufficient_funds' | 'info';
  message: string;
  relatedExpenseId?: string;
}
