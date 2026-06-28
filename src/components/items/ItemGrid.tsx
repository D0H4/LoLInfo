import { useMemo, useState } from 'react'
import type { ItemEntry } from '../../types'
import { ddragon } from '../../lib/ddragon'
import { SearchIcon } from '../icons'

type Props = {
  items: ItemEntry[]
  selectedId: string
  onSelect: (id: string) => void
}

export function ItemGrid({ items, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return items
    }

    return items.filter((item) =>
      item.name.toLowerCase().includes(normalizedQuery),
    )
  }, [items, query])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative shrink-0">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="아이템 이름 검색"
          className="input pl-9"
          aria-label="아이템 이름 검색"
        />
      </div>

      <div className="mt-2 shrink-0 text-xs text-muted">
        {filteredItems.length}개
      </div>

      <div className="-mr-2 mt-2 grid min-h-0 flex-1 auto-rows-min grid-cols-3 gap-2.5 overflow-y-auto pr-2 sm:grid-cols-4 lg:grid-cols-5">
        {filteredItems.map((item) => {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={item.id === selectedId}
              title={`${item.name} - ${item.gold.total}g`}
              className={`card-hover group flex flex-col items-center gap-2 rounded-card bg-card p-2.5 text-center outline-none focus-visible:ring-0`}
            >
              <div className="relative w-full overflow-hidden rounded-lg bg-panel pt-[100%]">
                <img
                  src={ddragon.item(item.image)}
                  alt={item.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                />
                {item.gold.total > 0 && (
                  <span className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/80 to-transparent px-1 pb-0.5 pt-2 text-[10px] font-bold text-amber-300">
                    {item.gold.total}g
                  </span>
                )}
              </div>
              <span className="line-clamp-2 w-full break-keep text-[11px] font-medium leading-tight text-fg">
                {item.name}
              </span>
            </button>
          )
        })}

        {filteredItems.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted">
            검색 결과가 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}
