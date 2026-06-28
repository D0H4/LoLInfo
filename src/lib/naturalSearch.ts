import type { ChampionDetail, ChampionStats, ItemEntry } from '../types'
import { championAliasOverrides, itemAliasOverrides } from '../data/aliases'
import {
  championDetails,
  championList,
  getItemName,
  isItemAvailableOnMap,
  itemList,
} from './data'

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

function getChampionAliases(champion: ChampionDetail) {
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

function findChampion(query: string) {
  const normalizedQuery = normalize(query)
  const matches = championList
    .map((summary) => championDetails[summary.id])
    .filter(Boolean)
    .map((champion) => {
      const matchedAlias = getChampionAliases(champion)
        .map((alias) => normalize(alias))
        .filter((alias) => alias && normalizedQuery.includes(alias))
        .sort((a, b) => b.length - a.length)[0]

      return matchedAlias ? { champion, score: matchedAlias.length } : null
    })
    .filter((match): match is { champion: ChampionDetail; score: number } =>
      Boolean(match),
    )
    .sort((a, b) => b.score - a.score)

  return matches[0]?.champion
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
        .filter((alias) => alias && normalizedQuery.includes(alias))
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

function championStatResult(champion: ChampionDetail, field: QueryField) {
  const statField = field === 'range' ? 'attackrange' : field

  if (!(statField in champion.stats)) {
    return undefined
  }

  const statKey = statField as keyof ChampionStats
  const label = statLabels[statKey] ?? statKey
  const growthKey = `${statKey}perlevel` as keyof ChampionStats
  const growth =
    typeof champion.stats[growthKey] === 'number'
      ? ` / 성장 ${champion.stats[growthKey]}`
      : ''

  return {
    title: `${champion.name} ${label}`,
    value: `${champion.stats[statKey]}${growth}`,
  }
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
    default:
      return {
        title: item.name,
        value: item.plaintext || cleanHtml(item.description),
        detail: `가격 ${item.gold.total}g`,
      }
  }
}

export function searchNaturalLanguage(
  query: string,
  options: NaturalSearchOptions = {},
): NaturalSearchResult[] {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return []
  }

  const field = parseField(trimmedQuery)
  const spellKey = parseSpellKey(trimmedQuery)
  const champion = findChampion(trimmedQuery)

  if (champion) {
    if (spellKey) {
      const result = spellFieldValue(champion, spellKey, field)
      return result ? [{ id: `${champion.id}-${spellKey}-${field ?? 'summary'}`, ...result }] : []
    }

    if (field) {
      const statResult = championStatResult(champion, field)
      if (statResult) {
        return [{ id: `${champion.id}-${field}`, ...statResult }]
      }
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
