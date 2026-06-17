import { useState } from 'react';
import { Mic } from 'lucide-react';

/**
 * Voice Microphone trigger with animated waveform holding state.
 * Lets a market vendor speak a contribution ("five thousand naira to
 * thrift") instead of tapping through menus — the zero-typing promise
 * extended to users who may not read at all.
 */
export function VoiceWaveform() {
  const [listening, setListening] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-express-border bg-express-surface px-4 py-3 shadow-sm">
      <button
        type="button"
        onClick={() => setListening((v) => !v)}
        className={[
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors',
          listening ? 'bg-express-red text-white' : 'bg-express-green text-white',
        ].join(' ')}
        aria-pressed={listening}
        aria-label="Toggle voice entry"
      >
        <Mic className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <p className="text-sm font-medium text-express-ink">
          {listening ? 'Listening… speak your entry' : 'Tap to speak an entry'}
        </p>
        <div
          className={[
            'mt-1.5 flex h-5 items-end gap-1',
            listening ? 'animate-waveform' : '',
          ].join(' ')}
        >
          {[6, 12, 18, 10, 16, 8, 14, 6, 12, 18].map((h, i) => (
            <span
              key={i}
              style={{
                height: `${h}px`,
                animationDelay: `${i * 0.07}s`,
              }}
              className={[
                'w-1 rounded-full transition-colors',
                listening ? 'bg-express-green' : 'bg-express-border',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
