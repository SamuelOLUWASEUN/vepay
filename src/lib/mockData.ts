// ============================================================================
// Seed data — high-fidelity mock dataset for Vepay
// Both EXPRESS and PRO entries live in the same array; the active `Mode`
// only controls which subset/representation is rendered.
// ============================================================================

import type { AjoMember, Expense } from '../types';

export const INITIAL_EXPENSES: Expense[] = [
  // ------------------------------------------------------------------------
  // PRO MODE — tech / SaaS subscriptions
  // ------------------------------------------------------------------------
  {
    id: 'pro-cursor',
    name: 'Cursor AI',
    amount: 20,
    currency: 'USD',
    frequency: 'monthly',
    type: 'tech',
    categoryIcon: 'Sparkles',
    dueDate: '2026-07-02',
    status: 'active',
    isTrial: false,
  },
  {
    id: 'pro-openai',
    name: 'OpenAI API',
    amount: 45,
    currency: 'USD',
    frequency: 'monthly',
    type: 'tech',
    categoryIcon: 'Brain',
    dueDate: '2026-07-05',
    status: 'active',
    isTrial: false,
  },
  {
    id: 'pro-vercel',
    name: 'Vercel Pro',
    amount: 20,
    currency: 'USD',
    frequency: 'monthly',
    type: 'tech',
    categoryIcon: 'Triangle',
    dueDate: '2026-06-18',
    status: 'failed',
    failureReason: 'expired_card',
    isTrial: false,
  },
  {
    id: 'pro-netflix',
    name: 'Netflix Premium (Split)',
    amount: 18,
    currency: 'USD',
    frequency: 'monthly',
    type: 'tech',
    categoryIcon: 'Tv',
    dueDate: '2026-06-28',
    status: 'active',
    isTrial: false,
    sharedGroup: {
      name: 'Netflix Squad',
      pendingMembers: ['tobi@gmail.com', 'aisha@gmail.com'],
      platformFeeAccrued: 0.45,
    },
  },
  {
    id: 'pro-figma',
    name: 'Figma Professional',
    amount: 15,
    currency: 'USD',
    frequency: 'monthly',
    type: 'tech',
    categoryIcon: 'PenTool',
    dueDate: '2026-06-30',
    status: 'active',
    isTrial: true,
    trialDaysLeft: 4,
  },
  {
    id: 'pro-railway',
    name: 'Railway Pro',
    amount: 5,
    currency: 'USD',
    frequency: 'monthly',
    type: 'tech',
    categoryIcon: 'Train',
    dueDate: '2026-07-10',
    status: 'active',
    isTrial: true,
    trialDaysLeft: 11,
  },

  // ------------------------------------------------------------------------
  // EXPRESS MODE — local market / informal economy
  // ------------------------------------------------------------------------
  {
    id: 'exp-levy',
    name: 'Daily Market Association Levy',
    amount: 2000,
    currency: 'NGN',
    frequency: 'weekly',
    type: 'local',
    categoryIcon: '📊',
    dueDate: '2026-06-19',
    status: 'active',
    isTrial: false,
  },
  {
    id: 'exp-thrift',
    name: 'Esusu/Thrift Daily Contribution',
    amount: 5000,
    currency: 'NGN',
    frequency: 'daily',
    type: 'local',
    categoryIcon: '🐷',
    dueDate: '2026-06-15',
    status: 'failed',
    failureReason: 'insufficient_funds',
    isTrial: false,
  },
  {
    id: 'exp-rent',
    name: 'Shop Space Rent',
    amount: 30000,
    currency: 'NGN',
    frequency: 'monthly',
    type: 'local',
    categoryIcon: '🏬',
    dueDate: '2026-07-01',
    status: 'active',
    isTrial: false,
  },
  {
    id: 'exp-power',
    name: 'Prepaid Power (NEPA Token)',
    amount: 3500,
    currency: 'NGN',
    frequency: 'weekly',
    type: 'local',
    categoryIcon: '🔌',
    dueDate: '2026-06-20',
    status: 'active',
    isTrial: false,
  },
];

// ----------------------------------------------------------------------------
// Ajo / Thrift group members — Trust Score Badge system
// ----------------------------------------------------------------------------

export const AJO_MEMBERS: AjoMember[] = [
  { id: 'm1', name: 'Mama Bisi', trustScoreStars: 5, avatarColor: '#0F9D58', initials: 'MB' },
  { id: 'm2', name: 'Chidi O.', trustScoreStars: 4, avatarColor: '#F5A623', initials: 'CO' },
  { id: 'm3', name: 'Halima Y.', trustScoreStars: 5, avatarColor: '#7C5CFF', initials: 'HY' },
  { id: 'm4', name: 'Emeka N.', trustScoreStars: 3, avatarColor: '#E5484D', initials: 'EN' },
  { id: 'm5', name: 'You', trustScoreStars: 5, avatarColor: '#3FE0C5', initials: 'ME' },
];

// ----------------------------------------------------------------------------
// Express Mode quick-action ledger targets (icon grid)
// ----------------------------------------------------------------------------

export interface QuickActionTarget {
  id: string;
  label: string;
  icon: string;
  defaultAmount: number;
  expenseId: string;
}

export const QUICK_ACTIONS: QuickActionTarget[] = [
  { id: 'qa-rent', label: 'Shop Rent', icon: '🏬', defaultAmount: 1000, expenseId: 'exp-rent' },
  { id: 'qa-thrift', label: 'Thrift/Ajo', icon: '🐷', defaultAmount: 5000, expenseId: 'exp-thrift' },
  { id: 'qa-power', label: 'Power', icon: '🔌', defaultAmount: 500, expenseId: 'exp-power' },
  { id: 'qa-levy', label: 'Daily Levy', icon: '📊', defaultAmount: 200, expenseId: 'exp-levy' },
  { id: 'qa-water', label: 'Water', icon: '🚰', defaultAmount: 100, expenseId: 'exp-power' },
  { id: 'qa-security', label: 'Security Levy', icon: '🛡️', defaultAmount: 300, expenseId: 'exp-levy' },
];
