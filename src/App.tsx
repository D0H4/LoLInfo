import { useEffect, useMemo, useState } from 'react'
import type { ChampionDetail as ChampionDetailData, ViewMode } from './types'

const VIEW_MODE_STORAGE_KEY = 'lolinfo:viewMode'

const validViewModes: ViewMode[] = ['champions', 'items', 'search']

function getInitialViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'search'
  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
  if (stored && validViewModes.includes(stored as ViewMode)) {
    return stored as ViewMode
  }
  return 'search'
}
import { manifest } from './lib/ddragon'
import {
  championList,
  isItemAvailableOnMap,
  itemList,
  items,
  loadChampionDetail,
} from './lib/data'
import { useTheme } from './hooks/useTheme'
import { Header } from './components/Header'
import { ChampionGrid } from './components/champions/ChampionGrid'
import { ChampionDetail } from './components/champions/ChampionDetail'
import { ItemGrid } from './components/items/ItemGrid'
import { ItemDetail } from './components/items/ItemDetail'
import { searchNaturalLanguage } from './lib/naturalSearch'
import type { NaturalSearchResult } from './lib/naturalSearch'
import { ArrowUpIcon, ChevronDownIcon } from './components/icons'

const itemMapLabels: Record<string, string> = {
  '11': "소환사의 협곡",
  '12': '칼바람 나락',
  '21': '넥서스 블리츠',
  '22': '맵 22',
  '30': '아레나',
  '33': '스웜',
  '35': '브롤',
}

const hiddenItemMapIds = new Set(['33', '35'])

const itemMapOptions = Array.from(
  new Set(itemList.flatMap((item) => Object.keys(item.maps ?? {}))),
)
  .filter(
    (mapId) =>
      !hiddenItemMapIds.has(mapId) &&
      itemList.some((item) => item.maps?.[mapId]),
  )
  .sort((a, b) => Number(a) - Number(b))

function uniqueItemsByName(list: typeof itemList) {
  // Pick one canonical entry per name deterministically: the lowest numeric id.
  // Canonical shop items use lower ids than their mode variants, and tying the
  // choice to the id (instead of sort stability / JSON key order) keeps it
  // stable regardless of input ordering. We first resolve the winning id per
  // name, then filter so the original (name-sorted) display order is preserved.
  const canonicalIdByName = new Map<string, string>()

  for (const item of list) {
    const current = canonicalIdByName.get(item.name)
    if (current === undefined || Number(item.id) < Number(current)) {
      canonicalIdByName.set(item.name, item.id)
    }
  }

  return list.filter((item) => canonicalIdByName.get(item.name) === item.id)
}

function App() {
  const { theme, toggle } = useTheme()
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode)

  useEffect(() => {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode)
  }, [viewMode])
  const [selectedChampionId, setSelectedChampionId] = useState(
    championList[0]?.id ?? '',
  )
  const [selectedItemMap, setSelectedItemMap] = useState(
    itemMapOptions.includes('11') ? '11' : itemMapOptions[0] ?? '',
  )

  const filteredItemList = useMemo(
    () =>
      uniqueItemsByName(
        itemList.filter((item) => isItemAvailableOnMap(item, selectedItemMap)),
      ),
    [selectedItemMap],
  )

  const [selectedItemId, setSelectedItemId] = useState(
    filteredItemList[0]?.id ?? '',
  )

  const [champion, setChampion] = useState<ChampionDetailData | undefined>(undefined)
  const [championLoading, setChampionLoading] = useState(false)

  // 챔피언 상세는 동적 import 청크라 비동기로 로드한다. 빠르게 전환할 때 이전
  // 요청이 늦게 도착해 덮어쓰지 않도록 active 플래그로 stale 응답을 버린다.
  useEffect(() => {
    if (!selectedChampionId) {
      setChampion(undefined)
      return
    }

    let active = true
    setChampionLoading(true)
    loadChampionDetail(selectedChampionId).then((detail) => {
      if (!active) return
      setChampion(detail)
      setChampionLoading(false)
    })

    return () => {
      active = false
    }
  }, [selectedChampionId])

  const selectedItem = useMemo(() => items[selectedItemId], [selectedItemId])

  // Switching maps may leave the current selection unavailable, so reset it in
  // the change handler rather than an effect. Doing it here (instead of
  // reacting to selectedItemId) means navigating into recipe components — which
  // may be deduped out of the list or belong to another map — displays that
  // item instead of bouncing the selection back to the first entry.
  const handleItemMapChange = (mapId: string) => {
    setSelectedItemMap(mapId)

    const current = items[selectedItemId]
    const stillAvailable =
      current &&
      isItemAvailableOnMap({ id: selectedItemId, ...current }, mapId)

    if (!stillAvailable) {
      const nextList = uniqueItemsByName(
        itemList.filter((item) => isItemAvailableOnMap(item, mapId)),
      )
      setSelectedItemId(nextList[0]?.id ?? '')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg md:h-screen md:overflow-hidden">
      <Header
        viewMode={viewMode}
        onViewChange={setViewMode}
        theme={theme}
        onToggleTheme={toggle}
        manifest={manifest}
      />

      <div
        className={`mx-auto w-full max-w-7xl flex-1 p-4 md:min-h-0 md:gap-5 md:overflow-hidden ${
          viewMode === 'search'
            ? 'flex items-center justify-center'
            : 'md:grid md:grid-cols-[minmax(340px,420px)_1fr]'
        }`}
      >
        {viewMode !== 'search' && (
          <aside className="card mb-4 flex h-[60vh] flex-col p-4 md:mb-0 md:h-full md:min-h-0">
            <div className="flex min-h-0 flex-1 flex-col">
              {viewMode === 'champions' ? (
                <ChampionGrid
                  champions={championList}
                  selectedId={selectedChampionId}
                  onSelect={setSelectedChampionId}
                />
              ) : (
                <>
                  <label className="mb-3 flex shrink-0 flex-col gap-1 text-xs font-semibold text-muted">
                    맵
                    <select
                      value={selectedItemMap}
                      onChange={(event) => handleItemMapChange(event.target.value)}
                      className="input"
                    >
                      {itemMapOptions.map((mapId) => (
                        <option key={mapId} value={mapId}>
                          {itemMapLabels[mapId] ?? `맵 ${mapId}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <ItemGrid
                    items={filteredItemList}
                    selectedId={selectedItemId}
                    onSelect={setSelectedItemId}
                  />
                </>
              )}
            </div>
          </aside>
        )}

        <main
          className={`min-w-0 pb-4 md:h-full md:min-h-0 md:overflow-y-auto md:pr-1 md:pb-0 ${
            viewMode === 'search' ? 'w-full max-w-2xl' : ''
          }`}
        >
          {viewMode === 'search' ? (
            <SearchPanel
              selectedItemMap={selectedItemMap}
              onItemMapChange={handleItemMapChange}
            />
          ) : viewMode === 'champions' ? (
            champion && champion.id === selectedChampionId ? (
              <ChampionDetail champion={champion} />
            ) : championLoading ? (
              <EmptyState text="불러오는 중..." />
            ) : (
              <EmptyState text="챔피언을 선택해 주세요." />
            )
          ) : selectedItem ? (
            <ItemDetail item={selectedItem} onSelectItem={setSelectedItemId} />
          ) : (
            <EmptyState text="아이템을 선택해 주세요." />
          )}
        </main>
      </div>
    </div>
  )
}

type SearchPanelProps = {
  selectedItemMap: string
  onItemMapChange: (mapId: string) => void
}

function SearchPanel({
  selectedItemMap,
  onItemMapChange,
}: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NaturalSearchResult[]>([])

  // 검색은 챔피언 상세를 지연 로드할 수 있어 async다. 빠르게 입력하거나 맵을
  // 바꿀 때 이전 쿼리 결과가 늦게 도착해 덮어쓰지 않도록 active로 차단한다.
  useEffect(() => {
    let active = true
    searchNaturalLanguage(query, { itemMapId: selectedItemMap }).then((r) => {
      if (active) setResults(r)
    })
    return () => {
      active = false
    }
  }, [query, selectedItemMap])

  const hasQuery = query.trim().length > 0

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3 pb-10 md:h-full md:justify-center md:pb-2">
      <div
        className="
          flex w-full flex-col gap-3 rounded-[15px] border border-line bg-card p-3
          shadow-[0_8px_30px_hsl(var(--shadow)/0.08)] transition
          focus-within:border-line-strong focus-within:shadow-[0_12px_40px_hsl(var(--shadow)/0.12)]
        "
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 판테온 W 사거리, 무한의 대검 가격"
          aria-label="자연어 검색"
          className="w-full bg-transparent px-1.5 text-[15px] leading-relaxed text-fg placeholder:text-muted/60 focus:outline-none"
        />

        <div className="flex items-center justify-between gap-2 border-t border-line/70 pt-2.5">
          <div className="relative inline-flex w-auto items-center">
            <select
              value={selectedItemMap}
              onChange={(event) => onItemMapChange(event.target.value)}
              aria-label="Item map filter"
              className="
                cursor-pointer appearance-none rounded-full
                bg-card py-1 pl-2 pr-6 text-xs font-medium text-fg transition
                hover:bg-panel hover:text-accent-strong focus:outline-none
              "
            >
              {itemMapOptions.map((mapId) => (
                <option key={mapId} value={mapId}>
                  {itemMapLabels[mapId] ?? `맵 ${mapId}`}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            />
          </div>

          <button
            type="submit"
            aria-label="검색"
            className="
              inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full
              bg-accent text-accent-contrast transition hover:brightness-110
              disabled:cursor-not-allowed disabled:opacity-40
            "
            disabled={!hasQuery}
            onClick={(event) => event.preventDefault()}
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="w-full md:max-h-[45vh] md:overflow-y-auto md:pr-1">
        {hasQuery && results.length > 0 ? (
          <ul className="mx-auto flex w-full max-w-2xl flex-col gap-2.5">
            {results.map((result) => (
              <li
                key={result.id}
                className="rounded-[14px] border border-line/70 bg-panel/50 p-3.5 transition hover:border-line-strong"
              >
                <h2 className="text-sm font-semibold text-fg">{result.title}</h2>
                <p className="preserve-lines mt-1.5 text-[13px] leading-relaxed text-fg/85">
                  {result.value}
                </p>
                {result.detail && (
                  <p className="preserve-lines mt-1.5 text-xs leading-relaxed text-muted">
                    {result.detail}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : hasQuery ? (
          <p className="text-center text-xs text-muted/70">
            검색 결과가 없습니다.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card flex h-full min-h-40 items-center justify-center p-10 text-center text-muted">
      {text}
    </div>
  )
}

export default App
