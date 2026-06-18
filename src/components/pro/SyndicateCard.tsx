import { useState } from 'react';
import { Link2, Users, ChevronDown } from 'lucide-react';
import { useClearSpend } from '../../context/ClearSpendContext';
import { formatConverted } from '../../lib/currency';

// ── SubSelector — defined OUTSIDE to prevent remount ─────────────────────────
interface SubSelectorProps {
  options: { id: string; name: string }[];
  selectedId: string;
  onChange: (id: string) => void;
}

function SubSelector({ options, selectedId, onChange }: SubSelectorProps) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 36px 10px 12px',
          borderRadius: '12px',
          border: '1px solid rgba(63,224,197,0.3)',
          background: 'rgba(63,224,197,0.08)',
          color: 'var(--pro-ink)',
          fontSize: '14px',
          fontWeight: 600,
          appearance: 'none',
          WebkitAppearance: 'none',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <ChevronDown style={{
        position: 'absolute', right: '10px', top: '50%',
        transform: 'translateY(-50%)',
        width: '16px', height: '16px',
        color: 'var(--pro-cyan)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ── MembersInput — defined OUTSIDE ────────────────────────────────────────────
interface MembersInputProps {
  value: string;
  onChange: (v: string) => void;
}

function MembersInput({ value, onChange }: MembersInputProps) {
  return (
    <input
      type="number"
      min={2}
      max={10}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '64px',
        padding: '6px 10px',
        borderRadius: '8px',
        border: '1px solid rgba(63,224,197,0.3)',
        background: 'rgba(63,224,197,0.08)',
        color: 'var(--pro-ink)',
        fontSize: '14px',
        fontWeight: 700,
        textAlign: 'center',
        outline: 'none',
      }}
    />
  );
}

/**
 * Syndicate Mode — split any subscription with a group.
 *
 * User picks which subscription to split, sets how many people,
 * and generates a shareable invite link. Works for Netflix, Spotify,
 * Figma, or any subscription in their list — not just the hardcoded one.
 */
export function SyndicateCard() {
  const { expenses, displayCurrency, generateInviteLink } = useClearSpend();

  // All active tech subscriptions are eligible for splitting
  const eligible = expenses.filter((e) => e.type === 'tech' && e.status === 'active');

  const [selectedId, setSelectedId] = useState(
    // Default to the one that already has a shared group, or first eligible
    expenses.find((e) => e.sharedGroup)?.id ?? eligible[0]?.id ?? ''
  );
  const [memberCount, setMemberCount] = useState('4');

  if (eligible.length === 0) return null;

  const selected = expenses.find((e) => e.id === selectedId) ?? eligible[0];
  if (!selected) return null;

  const members = Math.max(2, Math.min(10, parseInt(memberCount) || 4));
  const perPerson = selected.amount / members;
  const platformFee = selected.sharedGroup?.platformFeeAccrued ?? 0;
  const pendingInvites = selected.sharedGroup?.pendingMembers.length ?? 0;

  return (
    <div style={{
      borderRadius: '16px',
      border: '1px solid rgba(63,224,197,0.25)',
      background: 'rgba(63,224,197,0.05)',
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Users style={{ width: '16px', height: '16px', color: 'var(--pro-cyan)', flexShrink: 0 }} />
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--pro-ink)', margin: 0 }}>
          Syndicate Mode — Split Any Subscription
        </p>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--pro-muted)', margin: 0, lineHeight: 1.5 }}>
        Pick a subscription, set how many people split it, and share the invite link. Works for Netflix, Spotify, Figma, or anything in your list.
      </p>

      {/* Subscription picker */}
      <div>
        <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--pro-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Choose subscription
        </p>
        <SubSelector
          options={eligible.map((e) => ({ id: e.id, name: e.name }))}
          selectedId={selectedId}
          onChange={setSelectedId}
        />
      </div>

      {/* Members count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <p style={{ fontSize: '12px', color: 'var(--pro-muted)', flex: 1, margin: 0 }}>
          Split between
        </p>
        <MembersInput value={memberCount} onChange={setMemberCount} />
        <p style={{ fontSize: '12px', color: 'var(--pro-muted)', margin: 0 }}>people</p>
      </div>

      {/* Per person cost */}
      <div style={{
        borderRadius: '12px',
        background: 'rgba(63,224,197,0.1)',
        border: '1px solid rgba(63,224,197,0.2)',
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--pro-muted)' }}>Each person pays</span>
        <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 800, color: 'var(--pro-cyan)' }}>
          {formatConverted(perPerson, selected.currency, displayCurrency)}
        </span>
      </div>

      {/* Pending invites + fee */}
      {pendingInvites > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--pro-muted)' }}>
          <span>{pendingInvites} invites pending</span>
          <span>Fee accrued: <span style={{ color: 'var(--pro-cyan)', fontFamily: 'monospace' }}>
            {formatConverted(platformFee, 'USD', displayCurrency)}
          </span></span>
        </div>
      )}

      {/* Generate link button */}
      <button
        type="button"
        onClick={() => generateInviteLink(selected.id)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          borderRadius: '12px',
          background: 'rgba(63,224,197,0.12)',
          border: '1px solid rgba(63,224,197,0.3)',
          color: 'var(--pro-cyan)',
          fontSize: '14px',
          fontWeight: 600,
          padding: '10px 16px',
          cursor: 'pointer',
        }}
      >
        <Link2 style={{ width: '16px', height: '16px' }} />
        Generate Group Invitation Link
      </button>
    </div>
  );
}
