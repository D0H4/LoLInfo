import type { ChampionStats } from '../types'

export const statLabels: Array<[keyof ChampionStats, string, string]> = [
  ['hp', '체력', 'hp'],
  ['hpperlevel', '레벨당 체력', 'hp'],
  ['mp', '마나/기력', 'mp'],
  ['mpperlevel', '레벨당 마나/기력', 'mp'],
  ['movespeed', '이동 속도', 'move'],
  ['armor', '방어력', 'armor'],
  ['armorperlevel', '레벨당 방어력', 'armor'],
  ['spellblock', '마법 저항력', 'spellblock'],
  ['spellblockperlevel', '레벨당 마법 저항력', 'spellblock'],
  ['attackrange', '사거리', 'range'],
  ['hpregen', '체력 재생', 'hpregen'],
  ['hpregenperlevel', '레벨당 체력 재생', 'hpregen'],
  ['mpregen', '마나/기력 재생', 'mpregen'],
  ['mpregenperlevel', '레벨당 마나/기력 재생', 'mpregen'],
  ['crit', '치명타', 'crit'],
  ['critperlevel', '레벨당 치명타', 'crit'],
  ['attackdamage', '공격력', 'ad'],
  ['attackdamageperlevel', '레벨당 공격력', 'ad'],
  ['attackspeed', '공격 속도', 'as'],
  ['attackspeedperlevel', '레벨당 공격 속도', 'as'],
]

export const spellKeys = ['Q', 'W', 'E', 'R'] as const
export const levels = Array.from({ length: 20 }, (_, index) => index + 1)

export function cleanHtml(value: string) {
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

export function getLeveledStat(
  stats: ChampionStats,
  key: keyof ChampionStats,
  level: number,
) {
  const levelOffset = level - 1

  if (key === 'attackspeed') {
    return stats.attackspeed * (1 + (stats.attackspeedperlevel / 100) * levelOffset)
  }

  if (key.endsWith('perlevel')) {
    return stats[key]
  }

  const growthKey = `${key}perlevel` as keyof ChampionStats
  const growth = typeof stats[growthKey] === 'number' ? stats[growthKey] : 0

  return stats[key] + growth * levelOffset
}

export function formatStat(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}

export function getGrowthValue(stats: ChampionStats, key: keyof ChampionStats) {
  if (key.endsWith('perlevel')) {
    return '-'
  }

  return formatStat(stats[`${key}perlevel` as keyof ChampionStats] ?? 0)
}

/** 스탯 키를 한국어 라벨로 변환 (공격력/방어력 등 그룹) */
const statGroupLabel: Record<string, string> = {
  hp: '체력',
  mp: '마나',
  move: '이동 속도',
  armor: '방어력',
  spellblock: '마법 저항력',
  range: '사거리',
  hpregen: '체력 재생',
  mpregen: '마나 재생',
  crit: '치명타',
  ad: '공격력',
  as: '공격 속도',
}

export function statGroupLabelOf(group: string) {
  return statGroupLabel[group] ?? group
}

/** 아이템 스탯 키 -> 한국어 라벨 (대표 스탯만) */
const itemStatLabels: Record<string, string> = {
  FlatHPPoolMod: '체력',
  FlatMPPoolMod: '마나',
  FlatHPRegenMod: '체력 재생',
  FlatMPRegenMod: '마나 재생',
  FlatArmorMod: '방어력',
  FlatSpellBlockMod: '마법 저항력',
  FlatPhysicalDamageMod: '공격력',
  FlatMagicDamageMod: '주문력',
  FlatAttackSpeedMod: '공격 속도',
  PercentAttackSpeedMod: '공격 속도',
  FlatCritChanceMod: '치명타 확률',
  FlatCritDamageMod: '치명타 피해',
  FlatMovementSpeedMod: '이동 속도',
  PercentMovementSpeedMod: '이동 속도',
  PercentLifeStealMod: '생명력 흡수',
  PercentSpellVampMod: '주문 흡혈',
  rPercentCooldownMod: '재사용 대기시간',
  FlatMagicPenetrationMod: '마법 관통',
  FlatArmorPenetrationMod: '방어 관통',
  rFlatMagicPenetrationMod: '마법 관통',
  rFlatArmorPenetrationMod: '방어 관통',
  PercentMagicPenetrationMod: '마법 관통 %',
  PercentArmorPenetrationMod: '방어 관통 %',
  PercentHPPoolMod: '체력 %',
  PercentMPPoolMod: '마나 %',
  FlatBlockMod: '피해 감소',
  PercentBlockMod: '피해 감소 %',
}

export function itemStatLabel(key: string) {
  return itemStatLabels[key] ?? key
}

/** 아이템 스탯 값 포맷 (음수면 빨강, percent면 %) */
export function formatItemStat(key: string, value: number) {
  // DDragon stores fractional percent mods under keys prefixed with `Percent`
  // or `rPercent` (e.g. PercentMovementSpeedMod 0.05 -> 5%). Flat mods —
  // including flat penetration (Flat/rFlat...PenetrationMod) — are absolute
  // values and must not be multiplied by 100.
  const isPercent = key.startsWith('Percent') || key.startsWith('rPercent')
  const sign = value > 0 ? '+' : ''
  if (isPercent) {
    return `${sign}${(value * 100).toFixed(value * 100 % 1 === 0 ? 0 : 1)}%`
  }
  const abs = Math.abs(value)
  const decimals = abs % 1 === 0 ? 0 : abs < 1 ? 3 : 1
  return `${sign}${value.toFixed(decimals)}`
}


/**
 * description의 <stats> 블록에서 스탯 라벨/값을 추출한다.
 * DDragon의 레거시 `stats` 객체는 마법 관통·스킬 가속·재생 등 상당수 스탯을
 * 누락하지만, 설명의 <stats> 블록은 한국어로 완전하게 포맷되어 있어 더 정확하다.
 * 값 강조는 <attention> / <ornnBonus> 태그로 표기되며 항목은 <br>로 구분된다.
 */
export function parseDescriptionStats(
  description: string,
): Array<{ label: string; value: string }> {
  const match = description.match(/<stats>([\s\S]*?)<\/stats>/i)
  if (!match) return []

  const highlight = /<(?:attention|ornnBonus)>([\s\S]*?)<\/(?:attention|ornnBonus)>/gi

  return match[1]
    .split(/<br\s*\/?>/i)
    .map((segment) => {
      const values = [...segment.matchAll(highlight)]
        .map((m) => cleanHtml(m[1]))
        .filter(Boolean)
      const label = cleanHtml(segment.replace(highlight, ''))
      return { label, value: values.join(' ') }
    })
    .filter((stat) => stat.label || stat.value)
}
