import type { ChampionSpell } from '../../types'
import { ddragon } from '../../lib/ddragon'
import { cleanHtml } from '../../lib/format'

type Props = {
  spell: ChampionSpell
  spellKey: string
}

export function SpellCard({ spell, spellKey }: Props) {
  return (
    <article className="rounded-lg border border-line bg-panel p-4">
      <div className="flex items-center gap-2">
        <span
          className={`spell-key spell-key-${spellKey}`}
          aria-label={`스킬 ${spellKey}`}
        >
          {spellKey}
        </span>
        <h4 className="truncate text-base font-bold text-fg">{spell.name}</h4>
      </div>

      <div className="mt-3 flex items-start gap-3">
        <img
          src={ddragon.spell(spell.image)}
          alt={spell.name}
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-lg border border-line bg-card object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <span className="pill">
              최대 레벨 <span className="font-mono text-fg">{spell.maxrank}</span>
            </span>
            <span className="pill">
              재사용 <span className="font-mono text-fg">{spell.cooldownBurn}</span>
            </span>
            <span className="pill">
              소모 <span className="font-mono text-fg">{spell.costBurn}</span>
            </span>
            <span className="pill">
              범위 <span className="font-mono text-fg">{spell.rangeBurn}</span>
            </span>
            {spell.resource && (
              <span className="pill-accent pill">자원 {spell.resource}</span>
            )}
          </div>
        </div>
      </div>

      <p className="preserve-lines mt-3 text-sm leading-relaxed text-fg/90">
        {cleanHtml(spell.description)}
      </p>

      {spell.tooltip && cleanHtml(spell.tooltip) !== cleanHtml(spell.description) && (
        <details className="mt-2 group">
          <summary className="cursor-pointer select-none text-xs font-medium text-muted transition hover:text-fg">
            상세 수치 보기
          </summary>
          <pre className="preserve-lines mt-2 rounded-lg bg-panel p-3 font-mono text-xs text-muted">
            {cleanHtml(spell.tooltip)}
          </pre>
        </details>
      )}
    </article>
  )
}
