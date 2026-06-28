import { useMemo, useState } from 'react'
import type { ChampionSummary } from '../../types'
import { ddragon } from '../../lib/ddragon'
import { SearchIcon } from '../icons'

type Props = {
  champions: ChampionSummary[]
  selectedId: string
  onSelect: (id: string) => void
}

export function ChampionGrid({ champions, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return champions
    return champions.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q),
    )
  }, [champions, query])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* 검색 */}
      <div className="relative shrink-0">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="챔피언 이름 검색"
          className="input pl-9"
          aria-label="챔피언 검색"
        />
      </div>

      <div className="mt-2 shrink-0 text-xs text-muted">
        {filtered.length}명
      </div>

      {/* 그리드 */}
      <div className="-mr-2 mt-2 grid min-h-0 flex-1 auto-rows-min grid-cols-2 gap-2.5 overflow-y-auto pr-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((c) => {
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              aria-pressed={c.id === selectedId}
              title={`${c.name} — ${c.title}`}
              className={`card-hover group flex flex-col items-center gap-2 rounded-card bg-card p-2.5 text-center outline-none focus-visible:ring-0`}
            >
              <div className="relative w-full overflow-hidden rounded-lg bg-panel pt-[100%]">
                <img
                  src={ddragon.champion(c.image)}
                  alt={c.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <span className="line-clamp-1 w-full break-keep text-xs font-medium leading-tight text-fg">
                {c.name}
              </span>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted">
            검색 결과가 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}
