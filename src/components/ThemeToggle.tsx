import type { Theme } from '../hooks/useTheme'
import { MoonIcon, SunIcon } from './icons'

type Props = {
  theme: Theme
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: Props) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative inline-flex h-9 w-16 items-center rounded-full border border-line bg-panel px-1 transition hover:border-line-strong"
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-contrast shadow transition-transform ${
          isDark ? 'translate-x-0' : 'translate-x-7'
        }`}
      >
        {isDark ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
      </span>
    </button>
  )
}
