import { useTheme } from '../context/ThemeContext';
import FloatingStars from './FloatingStars';

export default function AuthLayout({ title, subtitle, children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <FloatingStars />

      {/* Dark mode background */}
      <div className="hidden dark:block">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]"
        />
      </div>

      {/* Light mode background */}
      <div className="hidden pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px] dark:hidden" />

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        className="fixed top-6 right-6 p-3 rounded-xl transition-all duration-200 z-50"
      >
        {theme === 'dark' ? (
          <svg className="h-6 w-6 text-yellow-400 hover:text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-blue-600 hover:text-blue-700" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.828a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.829a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 7a3 3 0 100 6 3 3 0 000-6zm-4.22-1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414L5.78 5.22a1 1 0 010-1.414zm2.828-2.829a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm4.22-1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828-2.828a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM5.78 14.22a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm-2.829-2.828a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center animate-slide-up">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-base font-bold text-white shadow-[0_4px_20px_-4px_rgba(47,102,250,0.6)] animate-pulse-glow">
            LV
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text dark:text-white">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm dark:text-slate-400 text-slate-600">{subtitle}</p>}
          </div>
        </div>

        <div className="glass-card p-8 animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
