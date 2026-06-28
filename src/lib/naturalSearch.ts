import type {
  ChampionDetail,
  ChampionStats,
  ChampionSummary,
  ItemEntry,
} from '../types'
import { championAliasOverrides, itemAliasOverrides } from '../data/aliases'
import {
  championList,
  getItemName,
  isItemAvailableOnMap,
  itemList,
  loadChampionDetail,
} from './data'
import { formatItemStat, itemStatLabel, parseDescriptionStats } from './format'

type SpellKey = 'P' | 'Q' | 'W' | 'E' | 'R'
type QueryField =
  | 'range'
  | 'cooldown'
  | 'cost'
  | 'resource'
  | 'damage'
  | 'description'
  | 'price'
  | 'recipe'
  | keyof ChampionStats

export type NaturalSearchResult = {
  id: string
  title: string
  value: string
  detail?: string
}

type NaturalSearchOptions = {
  itemMapId?: string
}

const spellAliases: Record<SpellKey, string[]> = {
  P: ['p', '패시브', 'passive'],
  Q: ['q'],
  W: ['w'],
  E: ['e'],
  R: ['r', '궁', '궁극기', 'ult', 'ultimate'],
}

const fieldAliases: Array<{ field: QueryField; aliases: string[] }> = [
  { field: 'range', aliases: ['사거리', '범위', '거리', 'range'] },
  { field: 'cooldown', aliases: ['쿨', '쿨타임', '재사용', '재사용대기시간', 'cooldown', 'cd'] },
  { field: 'cost', aliases: ['마나', '기력', '소모', '소모값', 'cost'] },
  { field: 'resource', aliases: ['자원', 'resource'] },
  { field: 'damage', aliases: ['딜', '데미지', '대미지', '피해', 'damage'] },
  { field: 'description', aliases: ['설명', '효과', '스킬', '내용'] },
  { field: 'price', aliases: ['가격', '골드', '비용', '얼마'] },
  { field: 'recipe', aliases: ['조합', '하위', '상위', '재료'] },
  { field: 'hp', aliases: ['체력', 'hp'] },
  { field: 'mp', aliases: ['마나통', '마나량', 'mp'] },
  { field: 'movespeed', aliases: ['이속', '이동속도', '이동 속도'] },
  { field: 'armor', aliases: ['방어력', '방어'] },
  { field: 'spellblock', aliases: ['마저', '마법저항력', '마법 저항력'] },
  { field: 'attackrange', aliases: ['평타사거리', '평타 사거리', '기본공격사거리'] },
  { field: 'attackdamage', aliases: ['공격력', 'ad'] },
  { field: 'attackspeed', aliases: ['공속', '공격속도', '공격 속도', 'as'] },
]

const statLabels: Partial<Record<keyof ChampionStats, string>> = {
  hp: '체력',
  mp: '마나/기력',
  movespeed: '이동 속도',
  armor: '방어력',
  spellblock: '마법 저항력',
  attackrange: '기본 공격 사거리',
  attackdamage: '공격력',
  attackspeed: '공격 속도',
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[\s'’._-]+/g, '')
}

function cleanHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function getChampionAliases(champion: Pick<ChampionSummary, 'id' | 'name'>) {
  return [
    champion.id,
    champion.name,
    champion.name.replace(/\s+/g, ''),
    ...(championAliasOverrides[champion.id] ?? []),
  ].filter(Boolean)
}

function getItemAliases(item: ItemEntry) {
  return [
    item.id,
    item.name,
    item.name.replace(/\s+/g, ''),
    ...(itemAliasOverrides[item.id] ?? []),
  ].filter(Boolean)
}

function findChampion(query: string): ChampionSummary | undefined {
  const normalizedQuery = normalize(query)
  const matches = championList
    .map((summary) => {
      const matchedAlias = getChampionAliases(summary)
        .map((alias) => normalize(alias))
        .filter((alias) => alias && normalizedQuery.includes(alias))
        .sort((a, b) => b.length - a.length)[0]

      return matchedAlias ? { summary, score: matchedAlias.length } : null
    })
    .filter((match): match is { summary: ChampionSummary; score: number } =>
      Boolean(match),
    )
    .sort((a, b) => b.score - a.score)

  return matches[0]?.summary
}

function findItem(query: string, options: NaturalSearchOptions = {}) {
  const normalizedQuery = normalize(query)
  const searchableItems = options.itemMapId
    ? itemList.filter((item) => isItemAvailableOnMap(item, options.itemMapId ?? ''))
    : itemList

  const matches = searchableItems
    .map((item) => {
      const matchedAlias = getItemAliases(item)
        .map((alias) => normalize(alias))
        .filter((alias) => {
          if (!alias) return false
          // Numeric ids (e.g. "1001") would otherwise match as a substring of
          // any number in the query. Only accept them on an exact match.
          if (/^\d+$/.test(alias)) return normalizedQuery === alias
          return normalizedQuery.includes(alias)
        })
        .sort((a, b) => b.length - a.length)[0]

      return matchedAlias ? { item, score: matchedAlias.length } : null
    })
    .filter((match): match is { item: ItemEntry; score: number } => Boolean(match))
    .sort((a, b) => b.score - a.score)

  return matches[0]?.item
}

function parseSpellKey(query: string): SpellKey | undefined {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)

  for (const [key, aliases] of Object.entries(spellAliases) as Array<
    [SpellKey, string[]]
  >) {
    if (aliases.some((alias) => tokens.includes(alias))) {
      return key
    }
  }

  return undefined
}

function parseField(query: string): QueryField | undefined {
  const normalizedQuery = normalize(query)

  return fieldAliases.find(({ aliases }) =>
    aliases.some((alias) => normalizedQuery.includes(normalize(alias))),
  )?.field
}

function spellFieldValue(
  champion: ChampionDetail,
  spellKey: SpellKey,
  field: QueryField | undefined,
) {
  if (spellKey === 'P') {
    return {
      title: `${champion.name} 패시브 - ${champion.passive.name}`,
      value: cleanHtml(champion.passive.description),
    }
  }

  const index = ['Q', 'W', 'E', 'R'].indexOf(spellKey)
  const spell = champion.spells[index]

  if (!spell) {
    return undefined
  }

  const title = `${champion.name} ${spellKey} - ${spell.name}`

  switch (field) {
    case 'range':
      return { title, value: `사거리: ${spell.rangeBurn}` }
    case 'cooldown':
      return { title, value: `재사용 대기시간: ${spell.cooldownBurn}` }
    case 'cost':
      return { title, value: `소모값: ${spell.costBurn}` }
    case 'resource':
      return { title, value: `자원 표기: ${spell.resource || '-'}` }
    case 'damage':
    case 'description':
      return { title, value: cleanHtml(spell.tooltip || spell.description) }
    default:
      return {
        title,
        value: cleanHtml(spell.description),
        detail: `사거리 ${spell.rangeBurn} / 쿨 ${spell.cooldownBurn} / 소모 ${spell.costBurn}`,
      }
  }
}

function championStatResult(
  champion: Pick<ChampionSummary, 'name' | 'stats'>,
  field: QueryField,
) {
  const statField = field === 'range' ? 'attackrange' : field

  if (!(statField in champion.stats)) {
    return undefined
  }

  const statKey = statField as keyof ChampionStats
  const label = statLabels[statKey] ?? statKey
  const growthKey = `${statKey}perlevel` as keyof ChampionStats
  const growthValue = champion.stats[growthKey]
  // 성장값이 0이면 표시하지 않는다. DDragon 데이터는 일부 필드(특히 레벨당 공격력)를
  // 모든 챔피언에 대해 0으로 제공하므로, "성장 0"은 오해를 줄 수 있다.
  const growth =
    typeof growthValue === 'number' && growthValue !== 0
      ? ` / 성장 ${growthValue}`
      : ''

  return {
    title: `${champion.name} ${label}`,
    value: `${champion.stats[statKey]}${growth}`,
  }
}

function itemStatsLine(item: ItemEntry): string {
  // 상세 화면과 동일하게 설명의 <stats> 블록을 우선 사용하고, 없으면 stats 객체로 폴백한다.
  const descStats = parseDescriptionStats(item.description)
  if (descStats.length > 0) {
    return descStats
      .map((stat) => (stat.value ? `${stat.label} ${stat.value}` : stat.label))
      .join(' · ')
  }

  return Object.entries(item.stats)
    .filter(([, value]) => value)
    .map(([key, value]) => `${itemStatLabel(key)} ${formatItemStat(key, value)}`)
    .join(' · ')
}

function itemResult(item: ItemEntry, field: QueryField | undefined) {
  switch (field) {
    case 'price':
      return {
        title: `${item.name} 가격`,
        value: `총 가격 ${item.gold.total}g / 조합 비용 ${item.gold.base}g / 판매 ${item.gold.sell}g`,
      }
    case 'recipe':
      return {
        title: `${item.name} 조합`,
        value: `하위 아이템: ${item.from?.map(getItemName).join(', ') || '-'}`,
        detail: `상위 아이템: ${item.into?.map(getItemName).join(', ') || '-'}`,
      }
    default: {
      const stats = itemStatsLine(item)
      return {
        title: item.name,
        value: item.plaintext || cleanHtml(item.description),
        detail: [stats && `스탯: ${stats}`, `가격 ${item.gold.total}g`]
          .filter(Boolean)
          .join('\n'),
      }
    }
  }
}

export async function searchNaturalLanguage(
  query: string,
  options: NaturalSearchOptions = {},
): Promise<NaturalSearchResult[]> {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return []
  }

  const field = parseField(trimmedQuery)
  const spellKey = parseSpellKey(trimmedQuery)
  const summary = findChampion(trimmedQuery)

  if (summary) {
    // 스탯 쿼리는 summary.stats로 즉시 해소한다 — 챔피언 상세 청크 로드 불필요.
    if (!spellKey && field) {
      const statResult = championStatResult(summary, field)
      if (statResult) {
        return [{ id: `${summary.id}-${field}`, ...statResult }]
      }
    }

    // 그 외(스킬 키가 있거나, 스탯이 아닌 field, 또는 전체 스킬 목록)는
    // spells/passive가 필요하므로 이때만 상세를 동적 로드한다.
    const champion = await loadChampionDetail(summary.id)
    if (!champion) {
      return []
    }

    if (spellKey) {
      const result = spellFieldValue(champion, spellKey, field)
      return result ? [{ id: `${champion.id}-${spellKey}-${field ?? 'summary'}`, ...result }] : []
    }

    return champion.spells.map((spell, index) => ({
      id: `${champion.id}-${index}`,
      title: `${champion.name} ${['Q', 'W', 'E', 'R'][index]} - ${spell.name}`,
      value: cleanHtml(spell.description),
      detail: `사거리 ${spell.rangeBurn} / 쿨 ${spell.cooldownBurn} / 소모 ${spell.costBurn}`,
    }))
  }

  const item = findItem(trimmedQuery, options)

  if (item) {
    return [{ id: `item-${item.id}-${field ?? 'summary'}`, ...itemResult(item, field) }]
  }

  return []
}
