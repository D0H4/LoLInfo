import type {
  ChampionDetail,
  ChampionFile,
  ChampionSummary,
  ItemData,
  ItemDetail,
  ItemEntry,
} from '../types'
import championSummary from '../data/ddragon/champion-summary.json'
import itemData from '../data/ddragon/item.json'

const championFiles = import.meta.glob<ChampionFile>(
  '../data/ddragon/champions/*.json',
  { eager: true, import: 'default' },
)

export const championList: ChampionSummary[] = Object.values(
  (championSummary as { data: Record<string, ChampionSummary> }).data,
).sort((a, b) => a.name.localeCompare(b.name, 'ko'))

export const championDetails: Record<string, ChampionDetail> = Object.fromEntries(
  Object.values(championFiles).map((file) => {
    const champion = Object.values(file.data)[0]
    return [champion.id, champion]
  }),
)

const itemsAll = (itemData as ItemData).data

export const items: Record<string, ItemDetail> = itemsAll

export const itemList: ItemEntry[] = Object.entries(itemsAll)
  .map(([id, item]) => ({ id, ...item }))
  .filter((item) => item.name && item.name.trim().length > 0)
  .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

export function getItemName(itemId: string) {
  return items[itemId]?.name ?? itemId
}

export function getItem(itemId: string): ItemDetail | undefined {
  return items[itemId]
}

export function isItemAvailableOnMap(item: ItemEntry, mapId: string) {
  if (!item.gold.purchasable || item.maps?.[mapId] !== true) {
    return false
  }

  // DDragon includes some mode-specific duplicate items as map 11 entries.
  // Real Summoner's Rift shop item ids are kept below this range.
  if (mapId === '11' && Number(item.id) >= 10000) {
    return false
  }

  return true
}

/** 챔피언 태그 -> 한국어 라벨 + 색상 톤 */
export const championTagMeta: Record<string, { label: string; cls: string }> = {
  Fighter: { label: '전사', cls: 'text-rose-500' },
  Tank: { label: '탱커', cls: 'text-sky-500' },
  Mage: { label: '마법사', cls: 'text-violet-400' },
  Assassin: { label: '암살자', cls: 'text-fuchsia-400' },
  Support: { label: '서포터', cls: 'text-emerald-400' },
  Marksman: { label: '원딜', cls: 'text-amber-400' },
}

export const championTagOrder = [
  'Fighter',
  'Tank',
  'Mage',
  'Assassin',
  'Support',
  'Marksman',
]

export function championTagLabel(tag: string) {
  return championTagMeta[tag]?.label ?? tag
}

/** 챔피언 포지션 태그 목록(중복 제거, 정렬) */
export const allChampionTags = championTagOrder.filter((tag) =>
  championList.some((c) => c.tags?.includes(tag)),
)

/** 아이템 태그 -> 한국어 라벨 (자주 쓰이는 것) */
export const itemTagLabels: Record<string, string> = {
  Active: '사용 효과',
  Aura: '오라',
  Stealth: '은신',
  Vision: '시야',
  Trinket: '장신구',
  Consumable: '소모품',
  Boots: '장화',
  Jungle: '정글',
  Lane: '라인',
  CooldownReduction: '재사용 대기시간',
  MagicResist: '마법 저항력',
  Armor: '방어력',
  Health: '체력',
  Mana: '마나',
  SpellDamage: '주문력',
  Damage: '공격력',
  CriticalStrike: '치명타',
  AttackSpeed: '공격 속도',
  LifeSteal: '생명력 흡수',
  SpellVamp: '주문 흡혈',
  Movement: '이동 속도',
  ActiveConsumable: '소모성 사용',
  NonbootsMovement: '비-장화 이동',
  Slow: '둔화',
  SlowOnHit: '타격 시 둔화',
  Tenacity: '강인함',
  MagicPenetration: '마법 관통',
  ArmorPenetration: '방어 관통',
}

export function itemTagLabel(tag: string) {
  return itemTagLabels[tag] ?? tag
}
