import { useState } from 'react';
import { Check, Moon, Settings, ShoppingBasket, Sparkles, Sun, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useClearSpend } from '../../context/ClearSpendContext';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Settings Modal — profile, appearance, and mode preferences.
 * Changes are persisted immediately via AuthContext and ThemeContext.
 */
export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { currentMode, setMode, displayCurrency, setDisplayCurrency } = useClearSpend();
  const isExpress = currentMode === 'EXPRESS';

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  function handleSave() {
    updateUser({ name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const surfaceClass = isExpress
    ? 'bg-express-surface border-express-border'
    : 'bg-pro-surface border-pro-border';
  const inkClass = isExpress ? 'text-express-ink' : 'text-pro-ink';
  const mutedClass = isExpress ? 'text-express-muted' : 'text-pro-muted';
  const inputClass = isExpress
    ? 'bg-express-bg border-express-border text-express-ink placeholder-express-muted focus:border-express-green'
    : 'bg-pro-bg border-pro-border text-pro-ink placeholder-pro-muted focus:border-pro-violet';
  const sectionBorder = isExpress ? 'border-express-border' : 'border-pro-border';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-backdrop-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={['w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden animate-modal-in mx-auto', surfaceClass].join(' ')}>

        {/* Header */}
        <div className={['flex items-center justify-between px-6 py-5 border-b', sectionBorder, isExpress ? 'bg-express-bg' : 'bg-pro-surface-2'].join(' ')}>
          <div className="flex items-center gap-3">
            <div className={['rounded-xl p-2.5', isExpress ? 'bg-express-ink' : 'bg-pro-violet/20'].join(' ')}>
              <Settings className={['h-5 w-5', isExpress ? 'text-express-bg' : 'text-pro-violet'].join(' ')} />
            </div>
            <p className={['font-display font-bold text-base', inkClass].join(' ')}>Settings</p>
          </div>
          <button type="button" onClick={onClose} className={['rounded-full p-1.5', mutedClass].join(' ')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain max-h-[75vh]">
          {/* Profile */}
          <div className={['px-6 py-5 border-b', sectionBorder].join(' ')}>
            <p className={['text-[10px] font-bold uppercase tracking-widest mb-3', mutedClass].join(' ')}>Profile</p>

            {user && (
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center font-display font-bold text-base text-white shrink-0"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.initials}
                </div>
                <div>
                  <p className={['font-semibold text-sm', inkClass].join(' ')}>{user.name}</p>
                  <p className={['text-xs', mutedClass].join(' ')}>{user.email}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className={['block text-xs font-semibold mb-1.5', mutedClass].join(' ')}>Display name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={['w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors', inputClass].join(' ')}
                />
              </div>
              <div>
                <label className={['block text-xs font-semibold mb-1.5', mutedClass].join(' ')}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={['w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors', inputClass].join(' ')}
                />
              </div>
              <button
                type="button"
                onClick={handleSave}
                className={['flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors',
                  saved
                    ? (isExpress ? 'bg-express-green-soft text-express-green' : 'bg-pro-cyan/15 text-pro-cyan')
                    : (isExpress ? 'bg-express-ink text-express-bg hover:bg-express-ink/90' : 'bg-pro-violet text-white hover:bg-pro-violet/90')].join(' ')}
              >
                {saved ? <><Check className="h-4 w-4" /> Saved!</> : 'Save changes'}
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div className={['px-6 py-5 border-b', sectionBorder].join(' ')}>
            <p className={['text-[10px] font-bold uppercase tracking-widest mb-3', mutedClass].join(' ')}>Appearance</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => !isDark && toggleTheme()}
                className={['flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors',
                  isDark
                    ? (isExpress ? 'border-express-border text-express-muted' : 'border-pro-border text-pro-muted')
                    : (isExpress ? 'border-express-ink bg-express-ink text-express-bg' : 'border-pro-violet bg-pro-violet text-white')].join(' ')}
              >
                <Sun className="h-4 w-4" /> Light
              </button>
              <button
                type="button"
                onClick={() => isDark && toggleTheme()}
                className={['flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors',
                  isDark
                    ? (isExpress ? 'border-express-ink bg-express-ink text-express-bg' : 'border-pro-violet bg-pro-violet text-white')
                    : (isExpress ? 'border-express-border text-express-muted' : 'border-pro-border text-pro-muted')].join(' ')}
              >
                <Moon className="h-4 w-4" /> Dark
              </button>
            </div>
          </div>

          {/* Current mode */}
          <div className={['px-6 py-5 border-b', sectionBorder].join(' ')}>
            <p className={['text-[10px] font-bold uppercase tracking-widest mb-3', mutedClass].join(' ')}>Active mode</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('EXPRESS')}
                className={['flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors',
                  currentMode === 'EXPRESS'
                    ? 'border-express-green bg-express-green-soft text-express-green'
                    : (isExpress ? 'border-express-border text-express-muted' : 'border-pro-border text-pro-muted')].join(' ')}
              >
                <ShoppingBasket className="h-4 w-4" /> Express
              </button>
              <button
                type="button"
                onClick={() => setMode('PRO')}
                className={['flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-colors',
                  currentMode === 'PRO'
                    ? 'border-pro-violet bg-pro-violet-soft text-pro-violet'
                    : (isExpress ? 'border-express-border text-express-muted' : 'border-pro-border text-pro-muted')].join(' ')}
              >
                <Sparkles className="h-4 w-4" /> Pro
              </button>
            </div>
          </div>

          {/* Currency (Pro only) */}
          {currentMode === 'PRO' && (
            <div className={['px-6 py-5 border-b', sectionBorder].join(' ')}>
              <p className={['text-[10px] font-bold uppercase tracking-widest mb-3', mutedClass].join(' ')}>Display currency</p>
              <div className="flex gap-3">
                {(['NGN', 'USD'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDisplayCurrency(c)}
                    className={['flex-1 rounded-xl border py-2.5 text-sm font-semibold font-mono transition-colors',
                      displayCurrency === c
                        ? 'border-pro-violet bg-pro-violet text-white'
                        : 'border-pro-border text-pro-muted hover:border-pro-violet/40'].join(' ')}
                  >
                    {c === 'NGN' ? '₦ NGN' : '$ USD'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          <div className="px-6 py-5">
            <p className={['text-[10px] font-bold uppercase tracking-widest mb-3', mutedClass].join(' ')}>About</p>
            <div className={['rounded-xl border p-4 text-xs leading-relaxed', sectionBorder, mutedClass].join(' ')}>
              Vepay v1.0 · Built for Nomba × DevCareer Hackathon 2026<br />
              All data stored locally on your device.<br />
              Powered by Nomba Checkout & Recurring Payments API.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
