// ============================================================================
// ThemeContext — dark / light mode
//
// Sets data-theme attribute on <html> which triggers CSS variable swaps
// defined in index.css. Express dark = warm brown night. Pro light = slate.
// Persisted to localStorage independently of Vepay state.
// ============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = 'vepay.theme';

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved === 'dark' || saved === 'light') return saved;
    // Respect OS preference on first load
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Apply the theme with NO flicker.
 *
 * Many elements carry Tailwind's `transition-colors`, so when the CSS variables
 * swap they ease at slightly different times — that stagger is the flash. To
 * avoid it we add a class that disables ALL transitions for one frame, swap the
 * theme so everything repaints together, then remove the class on the next
 * frame so normal hover/focus transitions resume. The result is a crisp,
 * instant theme change with no flicker.
 */
function applyThemeNoFlash(theme: Theme) {
  const root = document.documentElement;
  root.classList.add('vepay-theme-switching');
  root.setAttribute('data-theme', theme);
  // Force a reflow so the disabled-transition state is committed before we
  // remove the guard, then drop it on the next frame.
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  window.getComputedStyle(root).getPropertyValue('opacity');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('vepay-theme-switching');
    });
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Apply data-theme to <html> so CSS vars swap globally
  useEffect(() => {
    applyThemeNoFlash(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
