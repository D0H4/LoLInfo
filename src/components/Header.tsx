import type { Manifest, ViewMode } from '../types'
import type { Theme } from '../hooks/useTheme'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  viewMode: ViewMode
  onViewChange: (mode: ViewMode) => void
  theme: Theme
  onToggleTheme: () => void
  manifest: Manifest
}

const tabs: Array<{ id: ViewMode; label: string }> = [
  { id: 'search', label: '검색' },
  { id: 'champions', label: '챔피언' },
  { id: 'items', label: '아이템' },
]

export function Header({
  viewMode,
  onViewChange,
  theme,
  onToggleTheme,
  manifest,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-3 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/40 bg-accent-soft text-lg font-black text-accent-strong shadow-inner">
            L
          </div>
          <h1 className="text-base font-extrabold tracking-tight text-fg">
            LoL<span className="text-accent">Info</span>
          </h1>
        </div>

        <nav
          role="tablist"
          aria-label="메인 화면"
          className="inline-flex rounded-xl border border-line bg-panel p-1"
        >
          {tabs.map((tab) => {
            const active = viewMode === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onViewChange(tab.id)}
                className={`relative rounded-lg px-3.5 py-1.5 text-sm font-semibold transition sm:px-5 ${
                  active
                    ? 'bg-accent text-accent-contrast shadow'
                    : 'text-muted hover:text-fg'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <dl className="hidden text-right text-[11px] leading-tight text-muted md:block">
            <dt className="font-mono font-semibold text-accent-strong">
              v{manifest.version}
            </dt>
            <dd>
              {manifest.language} - 챔피언 {manifest.championCount} - 아이템{' '}
              {manifest.itemCount}
            </dd>
          </dl>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  )
}
