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

export const championList: ChampionSummary[] = Object.values(
  (championSummary as { data: Record<string, ChampionSummary> }).data,
).sort((a, b) => a.name.localeCompare(b.name, 'ko'))

// 챔피언 상세(173개, ~4.7M)는 초기 번들에서 가장 큰 비중을 차지하지만 한 번에 한
// 명만 화면에 표시된다. eager 대신 lazy glob으로 두어 선택/검색 시 해당 챔피언
// 청크만 동적으로 가져온다. glob 키는 파일 경로(예: '.../champions/Aatrox.json')이고
// basename은 챔피언 id와 1:1로 일치한다.
const championLoaders = import.meta.glob<ChampionFile>(
  '../data/ddragon/champions/*.json',
  { import: 'default' },
)

const loaderById = new Map<string, () => Promise<ChampionFile>>(
  Object.entries(championLoaders).map(([path, load]) => {
    const id = path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '')
    return [id, load]
  }),
)

// 한 번 로드한 상세는 앱 수명 동안 캐시해 반복 선택 시 재요청을 피한다.
const detailCache = new Map<string, ChampionDetail>()

export async function loadChampionDetail(
  id: string,
): Promise<ChampionDetail | undefined> {
  const cached = detailCache.get(id)
  if (cached) return cached

  const load = loaderById.get(id)
  if (!load) return undefined

  const champion = Object.values((await load()).data)[0]
  if (champion) {
    detailCache.set(id, champion)
  }
  return champion
}

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

// DDragon assigns 6-digit ids (>= 100000) to game-mode-specific item variants
// (Arena augments, ARAM/Rift duplicates, cosmetic entries). Every canonical
// shop item uses a <=5-digit id (the current max on the Rift is 8020), so the
// 6-digit boundary cleanly separates real items from mode variants without the
// fragility of an arbitrary cutoff.
const MODE_VARIANT_ID_MIN = 100000

const SUMMONERS_RIFT_MAP_ID = '11'

function isModeVariantItem(id: string) {
  const numericId = Number(id)
  return Number.isFinite(numericId) && numericId >= MODE_VARIANT_ID_MIN
}

export function isItemAvailableOnMap(item: ItemEntry, mapId: string) {
  if (!item.gold.purchasable || item.maps?.[mapId] !== true) {
    return false
  }

  // Summoner's Rift only stocks canonical items, but DDragon also flags a
  // number of mode-variant duplicates as available on map 11. Drop those so the
  // Rift item list/search matches the in-game shop. Other modes (e.g. Arena,
  // map 30) legitimately use 6-digit ids, so the filter is Rift-only.
  if (mapId === SUMMONERS_RIFT_MAP_ID && isModeVariantItem(item.id)) {
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
