import { useState } from 'react';
import { ShoppingBasket, Sparkles, ArrowRight, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// ─────────────────────────────────────────────────────────────────────────────
// Field MUST be defined outside SignInPage.
// If defined inside, React treats it as a new component type on every render,
// unmounts + remounts the <input> on every keystroke, and focus is lost.
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholder: string;
  error?: string;
  autoFocus?: boolean;
  suffix?: React.ReactNode;
  inputBg: string;
  muted: string;
  ink: string;
}

function Field({
  label, id, type = 'text', value, onChange, onEnter, placeholder,
  error, autoFocus = false, suffix, inputBg, muted, ink,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className={['block text-xs font-semibold mb-1.5', muted].join(' ')}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
          className={[
            'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors',
            suffix ? 'pr-12' : '',
            inputBg,
            error ? '!border-red-500' : '',
          ].join(' ')}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
      {error && <p className={['text-xs mt-1 font-medium', ink].join(' ')} style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function SignInPage() {
  const { signIn } = useAuth();
  const { isDark } = useTheme();

  // ── Read join invite params from URL ─────────────────────────────────────
  // When a friend taps a syndicate invite link, these params are present
  const urlParams = new URLSearchParams(window.location.search);
  const joinInvite = urlParams.get('join') === '1' ? {
    sub: urlParams.get('sub') ?? 'a subscription',
    amount: urlParams.get('amount') ?? '0',
    currency: urlParams.get('currency') ?? 'NGN',
    from: urlParams.get('from') ?? 'a friend',
    group: urlParams.get('group') ?? 'a group',
  } : null;

  const [flow, setFlow] = useState<'signup' | 'signin'>('signup');
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // If coming from invite link, default to PRO mode (it's a subscription split)
  const [selectedMode, setSelectedMode] = useState<'EXPRESS' | 'PRO' | null>(
    joinInvite ? 'PRO' : null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Validation ──────────────────────────────────────────────────────────

  function validateSignUp() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Enter your name';
    if (!email.trim() || !email.includes('@')) errs.email = 'Enter a valid email';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateSignIn() {
    const errs: Record<string, string> = {};
    if (!email.trim() || !email.includes('@')) errs.email = 'Enter a valid email';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleContinue() {
    if (validateSignUp()) { setErrors({}); setStep(2); }
  }

  function handleSignUp() {
    if (!selectedMode) return;
    signIn(name, email, selectedMode);
  }

  function handleSignIn() {
    if (!validateSignIn()) return;
    const displayName = email.split('@')[0] ?? 'User';
    signIn(displayName, email, 'EXPRESS');
  }

  function switchFlow(to: 'signup' | 'signin') {
    setFlow(to);
    setStep(1);
    setErrors({});
    setName('');
    setEmail('');
    setPassword('');
    setSelectedMode(null);
  }

  // ── Theme tokens ─────────────────────────────────────────────────────────

  const bg = isDark
    ? 'bg-[#0b0e14]'
    : 'bg-gradient-to-br from-[#fbf3e7] to-[#fff8f0]';
  const card = isDark ? 'bg-[#131722] border-[#242b3d]' : 'bg-white border-[#f0e1cd]';
  const ink = isDark ? 'text-[#e6e8eb]' : 'text-[#2b1810]';
  const muted = isDark ? 'text-[#8b949e]' : 'text-[#9c8a7c]';
  const inputBg = isDark
    ? 'bg-[#1a1f2e] border-[#242b3d] text-[#e6e8eb] placeholder-[#8b949e] focus:border-[#7c5cff]'
    : 'bg-[#fbf3e7] border-[#f0e1cd] text-[#2b1810] placeholder-[#9c8a7c] focus:border-[#0f9d58]';
  const accentHex = isDark ? '#7c5cff' : '#0f9d58';
  const accentText = isDark ? 'text-[#7c5cff]' : 'text-[#0f9d58]';
  const divider = isDark ? 'border-[#242b3d]' : 'border-[#f0e1cd]';
  const noteBg = isDark
    ? 'border-[#242b3d] bg-[#1a1f2e] text-[#8b949e]'
    : 'border-[#f0e1cd] bg-[#fbf3e7] text-[#9c8a7c]';

  // Shared eye-toggle button (passed as suffix to Field)
  const eyeBtn = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className={['p-1.5 rounded-lg', muted].join(' ')}
      aria-label="Toggle password"
      tabIndex={-1}
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  // Shared props passed to every Field instance
  const sharedFieldProps = { inputBg, muted, ink };

  return (
    <div className={['min-h-screen flex items-center justify-center p-4', bg].join(' ')}>
      <div className="w-full max-w-md">

        {/* ── Invite banner — shown when user arrives via syndicate link ── */}
        {joinInvite && (
          <div style={{
            marginBottom: '20px',
            borderRadius: '20px',
            border: '1px solid rgba(63,224,197,0.3)',
            background: isDark ? 'rgba(63,224,197,0.07)' : 'rgba(15,157,88,0.06)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>🎉</span>
              <div>
                <p style={{
                  fontSize: '14px', fontWeight: 700,
                  color: isDark ? '#e6e8eb' : '#2b1810',
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                }}>
                  {joinInvite.from} invited you!
                </p>
                <p style={{ fontSize: '12px', color: isDark ? '#8b949e' : '#9c8a7c', margin: 0 }}>
                  Join the <strong>{joinInvite.group}</strong> split
                </p>
              </div>
            </div>

            <div style={{
              borderRadius: '12px',
              background: isDark ? 'rgba(63,224,197,0.1)' : 'rgba(15,157,88,0.08)',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <p style={{ fontSize: '11px', color: isDark ? '#8b949e' : '#9c8a7c', margin: 0 }}>
                  Your share of {joinInvite.sub}
                </p>
                <p style={{
                  fontSize: '20px', fontWeight: 800,
                  fontFamily: 'monospace',
                  color: isDark ? '#3fe0c5' : '#0f9d58',
                  margin: 0,
                }}>
                  {joinInvite.currency === 'NGN' ? '₦' : '$'}
                  {Number(joinInvite.amount).toLocaleString('en-NG')}<span style={{ fontSize: '12px', fontWeight: 400, color: isDark ? '#8b949e' : '#9c8a7c' }}>/mo</span>
                </p>
              </div>
              <div style={{
                background: isDark ? '#3fe0c5' : '#0f9d58',
                color: 'white',
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
                letterSpacing: '0.05em',
              }}>
                SPLIT DEAL
              </div>
            </div>

            <p style={{ fontSize: '11px', color: isDark ? '#8b949e' : '#9c8a7c', margin: 0, textAlign: 'center' }}>
              Create a free account to accept this split and pay your share via Nomba
            </p>
          </div>
        )}

        {/* Logo */}
        <div className="text-center mb-8">
          <div className={[
            'inline-flex h-14 w-14 rounded-2xl items-center justify-center font-display font-black text-xl mb-4',
            isDark ? 'bg-[#7c5cff] text-white' : 'bg-[#2b1810] text-[#fbf3e7]',
          ].join(' ')}>
            VP
          </div>
          <h1 className={['font-display text-2xl font-extrabold', ink].join(' ')}>
            Vepay
          </h1>
          <p className={['text-sm mt-1', muted].join(' ')}>
            {flow === 'signup'
              ? step === 1 ? 'Create your account.' : 'How do you want to use Vepay?'
              : 'Welcome back.'}
          </p>
        </div>

        <div className={['rounded-3xl border shadow-xl overflow-hidden', card].join(' ')}>

          {/* Flow tabs */}
          <div className={['grid grid-cols-2 border-b', divider].join(' ')}>
            {(['signup', 'signin'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => switchFlow(f)}
                className={['py-3.5 text-sm font-semibold transition-colors border-b-2',
                  flow === f ? '' : ['border-transparent', muted].join(' ')].join(' ')}
                style={flow === f ? { borderColor: accentHex, color: accentHex } : {}}
              >
                {f === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            ))}
          </div>

          {/* ── SIGN UP Step 1 ───────────────────────────────────── */}
          {flow === 'signup' && step === 1 && (
            <div className="px-6 py-6 flex flex-col gap-4">
              <Field
                {...sharedFieldProps}
                id="signup-name" label="Full name" value={name}
                onChange={setName} onEnter={handleContinue}
                placeholder="Mama Bisi / Samuel" error={errors.name}
                autoFocus
              />
              <Field
                {...sharedFieldProps}
                id="signup-email" label="Email address" type="email"
                value={email} onChange={setEmail} onEnter={handleContinue}
                placeholder="you@example.com" error={errors.email}
              />
              <Field
                {...sharedFieldProps}
                id="signup-password" label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={setPassword} onEnter={handleContinue}
                placeholder="At least 6 characters" error={errors.password}
                suffix={eyeBtn}
              />

              <button
                type="button"
                onClick={handleContinue}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-display font-semibold text-sm text-white mt-1"
                style={{ backgroundColor: accentHex }}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>

              <p className={['text-center text-xs', muted].join(' ')}>
                Already have an account?{' '}
                <button type="button" onClick={() => switchFlow('signin')}
                  className={['font-semibold', accentText].join(' ')}>
                  Sign in instead
                </button>
              </p>
            </div>
          )}

          {/* ── SIGN UP Step 2: Mode selector ────────────────────── */}
          {flow === 'signup' && step === 2 && (
            <div className="px-6 py-6 flex flex-col gap-4">
              <p className={['text-sm text-center', muted].join(' ')}>
                You can switch modes anytime from the sidebar.
              </p>

              {(['EXPRESS', 'PRO'] as const).map((m) => {
                const isSelected = selectedMode === m;
                const activeStyle = m === 'EXPRESS'
                  ? { border: '2px solid #0f9d58', background: '#e3f5ec' }
                  : { border: '2px solid #7c5cff', background: '#211c42' };
                const inactiveStyle = isDark
                  ? { border: '2px solid #242b3d', background: '#1a1f2e' }
                  : { border: '2px solid #f0e1cd', background: '#fbf3e7' };

                return (
                  <button key={m} type="button" onClick={() => setSelectedMode(m)}
                    className="w-full rounded-2xl p-4 text-left transition-all"
                    style={isSelected ? activeStyle : inactiveStyle}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl p-2.5 shrink-0"
                        style={{ background: isSelected ? (m === 'EXPRESS' ? '#0f9d5820' : '#7c5cff20') : (isDark ? '#242b3d' : '#f0e1cd') }}>
                        {m === 'EXPRESS'
                          ? <ShoppingBasket className="h-5 w-5" style={{ color: isSelected ? '#0f9d58' : '#9c8a7c' }} />
                          : <Sparkles className="h-5 w-5" style={{ color: isSelected ? '#7c5cff' : '#9c8a7c' }} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className={['font-display font-bold text-sm', ink].join(' ')}>
                            {m === 'EXPRESS' ? 'Express Mode' : 'Pro Mode'}
                          </p>
                          {isSelected && (
                            <span className="rounded-full text-white text-[9px] font-bold px-2 py-0.5"
                              style={{ background: m === 'EXPRESS' ? '#0f9d58' : '#7c5cff' }}>
                              SELECTED
                            </span>
                          )}
                        </div>
                        <p className={['text-xs leading-relaxed', muted].join(' ')}>
                          {m === 'EXPRESS'
                            ? 'Simple icons, one tap to record. For market traders, artisans, and thrift groups.'
                            : 'Dense financial dashboard for developers tracking SaaS, API costs, and burn rate.'}
                        </p>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {(m === 'EXPRESS'
                            ? ['🏬 Rent', '🐷 Thrift', '🔌 Power', '📊 Levies']
                            : ['⚡ Cursor', '🌐 Vercel', '🧠 OpenAI', '🎬 Netflix']
                          ).map((tag) => (
                            <span key={tag} className="text-[10px] rounded-full px-2 py-0.5 font-semibold"
                              style={{
                                background: m === 'EXPRESS' ? '#0f9d5815' : '#7c5cff20',
                                color: m === 'EXPRESS' ? '#0f9d58' : '#7c5cff',
                              }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className={['flex-1 rounded-xl border py-3 text-sm font-semibold',
                    isDark ? 'border-[#242b3d] text-[#8b949e]' : 'border-[#f0e1cd] text-[#9c8a7c]'].join(' ')}>
                  Back
                </button>
                <button type="button" onClick={handleSignUp} disabled={!selectedMode}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-display font-semibold text-sm text-white disabled:opacity-40"
                  style={{ backgroundColor: !selectedMode ? '#888' : selectedMode === 'EXPRESS' ? '#0f9d58' : '#7c5cff' }}>
                  Get started <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── SIGN IN ──────────────────────────────────────────── */}
          {flow === 'signin' && (
            <div className="px-6 py-6 flex flex-col gap-4">
              <div className={['rounded-xl border px-4 py-3 text-xs leading-relaxed', noteBg].join(' ')}>
                <strong className={ink}>Prototype:</strong> Enter any email + password (6+ chars) to access your dashboard on this device.
              </div>

              <Field
                {...sharedFieldProps}
                id="signin-email" label="Email address" type="email"
                value={email} onChange={setEmail} onEnter={handleSignIn}
                placeholder="you@example.com" error={errors.email}
                autoFocus
              />
              <Field
                {...sharedFieldProps}
                id="signin-password" label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={setPassword} onEnter={handleSignIn}
                placeholder="Your password" error={errors.password}
                suffix={eyeBtn}
              />

              <button type="button" onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-display font-semibold text-sm text-white mt-1"
                style={{ backgroundColor: accentHex }}>
                <LogIn className="h-4 w-4" /> Sign in
              </button>

              <p className={['text-center text-xs', muted].join(' ')}>
                Don't have an account?{' '}
                <button type="button" onClick={() => switchFlow('signup')}
                  className={['font-semibold', accentText].join(' ')}>
                  Create one
                </button>
              </p>
            </div>
          )}
        </div>

        <p className={['text-center text-xs mt-6', muted].join(' ')}>
          Your data stays on your device · Powered by Nomba
        </p>
      </div>
    </div>
  );
}
