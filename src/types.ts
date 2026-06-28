export type ViewMode = 'champions' | 'items' | 'search'

export type ChampionStats = {
  hp: number
  hpperlevel: number
  mp: number
  mpperlevel: number
  movespeed: number
  armor: number
  armorperlevel: number
  spellblock: number
  spellblockperlevel: number
  attackrange: number
  hpregen: number
  hpregenperlevel: number
  mpregen: number
  mpregenperlevel: number
  crit: number
  critperlevel: number
  attackdamage: number
  attackdamageperlevel: number
  attackspeed: number
  attackspeedperlevel: number
}

export type ChampionImage = {
  full: string
}

export type ChampionPassive = {
  name: string
  description: string
  image: ChampionImage
}

export type ChampionSpell = {
  id: string
  name: string
  description: string
  tooltip: string
  cooldownBurn: string
  costBurn: string
  rangeBurn: string
  resource: string
  maxrank: number
  image: ChampionImage
}

export type ChampionInfo = {
  attack: number
  defense: number
  magic: number
  difficulty: number
}

export type ChampionDetail = {
  id: string
  key: string
  name: string
  title: string
  lore: string
  blurb: string
  allytips: string[]
  enemytips: string[]
  tags: string[]
  partype: string
  info: ChampionInfo
  stats: ChampionStats
  passive: ChampionPassive
  spells: ChampionSpell[]
  image: ChampionImage
}

export type ChampionFile = {
  data: Record<string, ChampionDetail>
}

export type ChampionSummary = {
  id: string
  key: string
  name: string
  title: string
  tags: string[]
  partype: string
  image: ChampionImage
  info: ChampionInfo
  // champion-summary.json은 아래 필드도 포함한다. 상세(spells/passive/lore)와 달리
  // 목록·검색 매칭과 스탯 조회에 쓰여 초기 로드에 필요하므로 summary에 둔다.
  stats: ChampionStats
  blurb: string
}

export type ItemGold = {
  base: number
  purchasable: boolean
  total: number
  sell: number
}

export type ItemDetail = {
  name: string
  description: string
  colloq: string
  plaintext: string
  into?: string[]
  from?: string[]
  image: ChampionImage
  gold: ItemGold
  tags: string[]
  maps: Record<string, boolean>
  stats: Record<string, number>
  depth?: number
  hideFromAll?: boolean
}

export type ItemData = {
  data: Record<string, ItemDetail>
}

export type ItemEntry = ItemDetail & { id: string }

export type Manifest = {
  version: string
  language: string
  championCount: number
  itemCount: number
  syncedAt: string
}
