import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChampionDetail, ChampionStats } from '../../types'
import { ddragon } from '../../lib/ddragon'
import {
  championTagLabel,
  championTagMeta,
} from '../../lib/data'
import {
  cleanHtml,
  formatStat,
  getGrowthValue,
  getLeveledStat,
  spellKeys,
  statLabels,
} from '../../lib/format'
import { SpellCard } from './SpellCard'

type Props = {
  champion: ChampionDetail
}

type StatMode = 'all' | 'filter'

type StatPrefs = {
  mode: StatMode
  selected: Set<keyof ChampionStats>
}

const STAT_PREFS_PREFIX = 'lolinfo-stat-'
const VALID_STAT_KEYS: ReadonlySet<string> = new Set(
  statLabels.map(([k]) => k),
)

const defaultSelected: Array<keyof ChampionStats> = [
  'hp',
  'mp',
  'movespeed',
  'armor',
  'spellblock',
  'attackrange',
  'attackdamage',
  'attackspeed',
]

function defaultPrefs(): StatPrefs {
  return { mode: 'all', selected: new Set(defaultSelected) }
}

function loadPrefs(championId: string): StatPrefs {
  if (typeof window === 'undefined') return defaultPrefs()
  try {
    const raw = localStorage.getItem(`${STAT_PREFS_PREFIX}${championId}`)
    if (!raw) return defaultPrefs()
    const parsed = JSON.parse(raw) as {
      mode?: StatMode
      selected?: unknown
    }
    const mode: StatMode = parsed.mode === 'filter' ? 'filter' : 'all'
    const selected =
      Array.isArray(parsed.selected) && parsed.selected.length > 0
        ? parsed.selected.filter(
            (k): k is keyof ChampionStats =>
              typeof k === 'string' && VALID_STAT_KEYS.has(k),
          )
        : defaultSelected
    return { mode, selected: new Set(selected) }
  } catch {
    return defaultPrefs()
  }
}

function savePrefs(championId: string, prefs: StatPrefs) {
  try {
    localStorage.setItem(
      `${STAT_PREFS_PREFIX}${championId}`,
      JSON.stringify({
        mode: prefs.mode,
        selected: [...prefs.selected],
      }),
    )
  } catch {
    // 저장 실패 시 무시
  }
}

export function ChampionDetail({ champion }: Props) {
  const [level, setLevel] = useState(1)
  const [prefs, setPrefs] = useState<StatPrefs>(() => loadPrefs(champion.id))
  const [filterOpen, setFilterOpen] = useState(false)

  // 챔피언 전환 시 해당 챔피언의 저장된 설정 로드
  useEffect(() => {
    setPrefs(loadPrefs(champion.id))
  }, [champion.id])

  // 설정 변경 시 저장
  useEffect(() => {
    savePrefs(champion.id, prefs)
  }, [champion.id, prefs])

  const statMode = prefs.mode
  const selectedStats = prefs.selected

  const setStatMode = useCallback((mode: StatMode) => {
    setPrefs((prev) => ({ ...prev, mode }))
  }, [])

  const toggleStat = useCallback((key: keyof ChampionStats) => {
    setPrefs((prev) => {
      const next = new Set(prev.selected)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return { ...prev, selected: next }
    })
  }, [])

  const selectAllStats = useCallback(() => {
    setPrefs((prev) => ({
      ...prev,
      selected: new Set(statLabels.map(([k]) => k)),
    }))
  }, [])

  const clearAllStats = useCallback(() => {
    setPrefs((prev) => ({ ...prev, selected: new Set() }))
  }, [])

  const visibleStats = useMemo(() => {
    if (statMode === 'all') return statLabels
    return statLabels.filter(([key]) => selectedStats.has(key))
  }, [statMode, selectedStats])

  return (
    <div className="flex flex-col gap-5">
      {/* 히어로 */}
      <section className="card relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={ddragon.splash(champion.id)}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-top opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        </div>

        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:gap-6 sm:p-7">
          <div className="flex shrink-0 items-center justify-center">
            <div className="rounded-2xl border border-accent/40 bg-panel p-1 shadow-xl">
              <img
                src={ddragon.champion(champion.image)}
                alt={champion.name}
                className="h-24 w-24 rounded-xl object-cover sm:h-28 sm:w-28"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {champion.tags.map((tag) => (
                <span
                  key={tag}
                  className={`pill ${championTagMeta[tag]?.cls ?? ''} border-accent/30 bg-accent-soft text-accent-strong`}
                >
                  {championTagLabel(tag)}
                </span>
              ))}
              <span className="pill">자원 · {champion.partype}</span>
            </div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-fg sm:text-4xl">
              {champion.name}
            </h2>
            <p className="text-base font-medium text-accent-strong">
              {champion.title}
            </p>
          </div>
        </div>
      </section>

      {/* 능력치 */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
              능력치
            </h3>
            <div className="inline-flex rounded-lg border border-line bg-panel p-0.5">
              <button
                type="button"
                onClick={() => setStatMode('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  statMode === 'all'
                    ? 'bg-accent text-accent-contrast'
                    : 'text-muted hover:text-fg'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setStatMode('filter')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  statMode === 'filter'
                    ? 'bg-accent text-accent-contrast'
                    : 'text-muted hover:text-fg'
                }`}
              >
                필터
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">레벨</span>
            <input
              type="range"
              min={1}
              max={20}
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              aria-label="레벨 선택"
              className="w-40 sm:w-56"
            />
            <span className="flex h-8 min-w-9 items-center justify-center rounded-lg border border-accent/40 bg-accent-soft px-2 font-mono text-sm font-bold text-accent-strong">
              {level}
            </span>
          </div>
        </div>

        {statMode === 'filter' && (
          <div className="mt-4 rounded-lg border border-line bg-panel">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              aria-expanded={filterOpen}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-panel-2"
            >
              <span className="text-xs font-semibold text-muted">
                표시할 항목 선택 ({selectedStats.size}/{statLabels.length})
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-accent-strong transition-transform ${
                    filterOpen ? 'rotate-90' : ''
                  }`}
                  aria-hidden="true"
                >
                  ▸
                </span>
              </div>
            </button>
            {filterOpen && (
              <div className="border-t border-line p-3">
                <div className="mb-2 flex items-center justify-end">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={selectAllStats}
                      className="rounded-md px-2 py-0.5 text-[11px] font-medium text-accent-strong transition hover:bg-accent-soft"
                    >
                      전체 선택
                    </button>
                    <button
                      type="button"
                      onClick={clearAllStats}
                      className="rounded-md px-2 py-0.5 text-[11px] font-medium text-muted transition hover:text-fg"
                    >
                      전체 해제
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {statLabels.map(([key, label]) => {
                    const on = selectedStats.has(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleStat(key)}
                        className={`chip ${on ? 'chip-active' : 'chip-idle'}`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-panel text-xs text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">항목</th>
                <th className="px-3 py-2 text-right font-semibold">
                  {level}레벨 값
                </th>
                <th className="px-3 py-2 text-right font-semibold">성장값</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visibleStats.map(([key, label]) => (
                <tr key={key} className="transition hover:bg-panel/60">
                  <th
                    scope="row"
                    className="px-3 py-1.5 text-left font-medium text-fg"
                  >
                    {label}
                  </th>
                  <td className="px-3 py-1.5 text-right font-mono font-semibold text-fg">
                    {formatStat(getLeveledStat(champion.stats, key, level))}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-muted">
                    {getGrowthValue(champion.stats, key)}
                  </td>
                </tr>
              ))}
              {visibleStats.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-muted">
                    표시할 항목을 선택해 주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          공격 속도는 레벨당 {champion.stats.attackspeedperlevel}% 성장하며, 표기값은
          실제 초당 공격 횟수입니다.
        </p>
      </section>

      {/* 패시브 */}
      <section className="card p-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
          패시브
        </h3>
        <div className="flex items-start gap-4">
          <img
            src={ddragon.passive(champion.passive.image)}
            alt={champion.passive.name}
            loading="lazy"
            className="h-14 w-14 shrink-0 rounded-xl border border-line bg-panel object-cover"
          />
          <div className="min-w-0">
            <h4 className="text-base font-bold text-accent-strong">
              {champion.passive.name}
            </h4>
            <p className="preserve-lines mt-1 text-sm leading-relaxed text-fg/90">
              {cleanHtml(champion.passive.description)}
            </p>
          </div>
        </div>
      </section>

      {/* 스펠 */}
      <section className="card p-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
          스킬
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {champion.spells.map((spell, index) => (
            <SpellCard
              key={spell.id}
              spell={spell}
              spellKey={spellKeys[index] ?? `?`}
            />
          ))}
        </div>
      </section>
     </div>
   )
}
