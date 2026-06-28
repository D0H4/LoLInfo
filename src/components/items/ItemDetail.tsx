import type { ItemDetail } from '../../types'
import { ddragon } from '../../lib/ddragon'
import { getItem, itemTagLabel } from '../../lib/data'
import {
  cleanHtml,
  formatItemStat,
  itemStatLabel,
} from '../../lib/format'
import { ArrowRightIcon, CoinIcon, LayersIcon } from '../icons'

type Props = {
  item: ItemDetail
  onSelectItem: (id: string) => void
}

export function ItemDetail({ item, onSelectItem }: Props) {
  const fromItems = item.from ?? []
  const intoItems = item.into ?? []

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <section className="card p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-accent/40 bg-panel p-1 shadow">
            <img
              src={ddragon.item(item.image)}
              alt={item.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {item.depth && (
                <span className="pill-accent pill">
                  {item.depth === 1 ? '기본' : item.depth === 2 ? '중간' : '완성'} ·
                  T{item.depth}
                </span>
              )}
              {item.gold.purchasable ? (
                <span className="pill">구매 가능</span>
              ) : (
                <span className="pill border-danger/40 text-danger">구매 불가</span>
              )}
              {item.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="pill">
                  {itemTagLabel(tag)}
                </span>
              ))}
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-fg">
              {item.name}
            </h2>
            <p className="text-sm text-muted">
              {item.plaintext || cleanHtml(item.description).split('\n')[0]}
            </p>
          </div>
        </div>
      </section>

      {/* 골드 */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GoldCard label="총 가격" value={item.gold.total} highlight />
        <GoldCard label="조합 비용" value={item.gold.base} />
        <GoldCard label="판매 가격" value={item.gold.sell} />
        <div className="card flex flex-col gap-1 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <CoinIcon className="h-3.5 w-3.5" />
            구매
          </div>
          <div className="text-lg font-bold text-fg">
            {item.gold.purchasable ? '가능' : '불가'}
          </div>
        </div>
      </section>

      {/* 설명 */}
      <section className="card p-5">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted">
          아이템 설명
        </h3>
        <p className="preserve-lines text-sm leading-relaxed text-fg/90">
          {cleanHtml(item.description)}
        </p>
      </section>

      {/* 스탯 */}
      <section className="card p-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
          스탯
        </h3>
        {Object.keys(item.stats).length > 0 ? (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {Object.entries(item.stats).map(([key, value]) => {
              if (!value) return null
              const positive = value > 0
              return (
                <li
                  key={key}
                  className="flex items-center justify-between rounded-lg bg-panel px-3 py-1.5 text-sm"
                >
                  <span className="text-muted">{itemStatLabel(key)}</span>
                  <span
                    className={`font-mono font-semibold ${
                      positive ? 'text-fg' : 'text-danger'
                    }`}
                  >
                    {formatItemStat(key, value)}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">제공된 스탯이 없습니다.</p>
        )}
      </section>

      {/* 조합 */}
      <section className="card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
          <LayersIcon className="h-4 w-4 text-accent" />
          조합 정보
        </h3>

        <RecipeGroup
          label="하위 아이템"
          ids={fromItems}
          onSelectItem={onSelectItem}
          emptyText="하위 아이템이 없는 기본 아이템입니다."
        />

        {intoItems.length > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <RecipeGroup
              label="상위 아이템"
              ids={intoItems}
              onSelectItem={onSelectItem}
              emptyText=""
            />
          </div>
        )}
      </section>
    </div>
  )
}

function GoldCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className={`card flex flex-col gap-1 p-4 ${
        highlight ? 'border-accent/40 bg-accent-soft' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <CoinIcon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div
        className={`text-lg font-bold ${
          highlight ? 'text-accent-strong' : 'text-fg'
        }`}
      >
        {value.toLocaleString()}
        <span className="ml-0.5 text-xs font-normal text-muted">g</span>
      </div>
    </div>
  )
}

function RecipeGroup({
  label,
  ids,
  onSelectItem,
  emptyText,
}: {
  label: string
  ids: string[]
  onSelectItem: (id: string) => void
  emptyText: string
}) {
  if (ids.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>
  }
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {ids.map((id, i) => {
          const sub = getItem(id)
          if (!sub) {
            return (
              <span
                key={id}
                className="rounded-lg border border-line bg-panel px-2 py-1 text-xs text-muted"
              >
                {id}
              </span>
            )
          }
          return (
            <div key={id} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-accent/60" aria-hidden="true">
                  +
                </span>
              )}
              <button
                type="button"
                onClick={() => onSelectItem(id)}
                title={`${sub.name} · ${sub.gold.total}g`}
                className="card card-hover flex items-center gap-2 p-1.5 pr-2.5"
              >
                <img
                  src={ddragon.item(sub.image)}
                  alt={sub.name}
                  loading="lazy"
                  className="h-8 w-8 rounded-md border border-line bg-panel object-cover"
                />
                <span className="text-xs font-medium text-fg">{sub.name}</span>
                {sub.gold.total > 0 && (
                  <span className="font-mono text-[11px] font-semibold text-amber-400">
                    {sub.gold.total}g
                  </span>
                )}
                <ArrowRightIcon className="h-3 w-3 text-muted opacity-0 transition group-hover:opacity-100" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
