import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DATA_DRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com'
// CommunityDragon exposes the raw game character data, which (unlike Data
// Dragon) contains the real per-level attack-damage growth. DDragon currently
// reports attackdamageperlevel as 0 for every champion, so we patch it from here.
const CDRAGON_CHARACTERS_URL =
  'https://raw.communitydragon.org/latest/game/data/characters'
const LANGUAGE = 'ko_KR'
const OUT_DIR = path.resolve('src/data/ddragon')
const CHAMPIONS_DIR = path.join(OUT_DIR, 'champions')
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json')

type ChampionSummary = {
  id: string
  key: string
  name: string
  title: string
}

type ChampionListResponse = {
  version: string
  language: string
  data: Record<string, ChampionSummary>
}

type ChampionDetailFile = {
  data: Record<string, { stats: Record<string, number> }>
}

type DataDragonManifest = {
  version: string
  language: string
  championCount: number
  itemCount: number
  syncedAt: string
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

/**
 * Fetch the real per-level attack damage growth from CommunityDragon's raw game
 * data. Returns null if unavailable (network error, missing record), so a single
 * failed champion never aborts the whole sync. The character folder is the
 * lowercased champion id, and the stat lives on the `.../CharacterRecords/Root`
 * entry (whose key casing varies, hence the regex lookup).
 */
async function fetchAttackDamagePerLevel(
  championId: string,
): Promise<number | null> {
  const folder = championId.toLowerCase()
  const url = `${CDRAGON_CHARACTERS_URL}/${folder}/${folder}.bin.json`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const data = (await response.json()) as Record<
      string,
      { damagePerLevelModifiable?: { baseValue?: number } } | undefined
    >
    const recordKey = Object.keys(data).find((key) =>
      /CharacterRecords\/Root$/i.test(key),
    )
    const value = recordKey
      ? data[recordKey]?.damagePerLevelModifiable?.baseValue
      : undefined

    if (typeof value !== 'number' || !Number.isFinite(value)) return null

    // Raw values carry float noise (e.g. 3.299999952316284) -> round to 2dp.
    return Math.round(value * 100) / 100
  } catch {
    return null
  }
}

async function readManifest(): Promise<DataDragonManifest | null> {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf8')
    return JSON.parse(raw) as DataDragonManifest
  } catch {
    return null
  }
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

const force = process.argv.includes('--force')

const versions = await fetchJson<string[]>(`${DATA_DRAGON_BASE_URL}/api/versions.json`)
const latestVersion = versions[0]

if (!latestVersion) {
  throw new Error('Data Dragon version list is empty.')
}

const manifest = await readManifest()

if (
  !force &&
  manifest?.version === latestVersion &&
  manifest.language === LANGUAGE &&
  typeof manifest.itemCount === 'number'
) {
  console.log(`Data Dragon ${latestVersion} (${LANGUAGE}) is already synced.`)
  process.exit(0)
}

await mkdir(CHAMPIONS_DIR, { recursive: true })

const championListUrl = `${DATA_DRAGON_BASE_URL}/cdn/${latestVersion}/data/${LANGUAGE}/champion.json`
const itemListUrl = `${DATA_DRAGON_BASE_URL}/cdn/${latestVersion}/data/${LANGUAGE}/item.json`
const championList = await fetchJson<ChampionListResponse>(championListUrl)
const itemList = await fetchJson(itemListUrl)
const champions = Object.values(championList.data)
const itemCount = Object.keys((itemList as { data: Record<string, unknown> }).data).length

await writeJson(path.join(OUT_DIR, 'versions.json'), versions)
await writeJson(path.join(OUT_DIR, 'champion-summary.json'), championList)
await writeJson(path.join(OUT_DIR, 'item.json'), itemList)

let patchedAdCount = 0

for (const champion of champions) {
  const championUrl = `${DATA_DRAGON_BASE_URL}/cdn/${latestVersion}/data/${LANGUAGE}/champion/${champion.id}.json`
  const championDetail = await fetchJson<ChampionDetailFile>(championUrl)

  // Patch the missing per-level attack damage from CommunityDragon.
  const adPerLevel = await fetchAttackDamagePerLevel(champion.id)
  const entry = Object.values(championDetail.data)[0]
  if (adPerLevel !== null && entry?.stats) {
    entry.stats.attackdamageperlevel = adPerLevel
    patchedAdCount += 1
  } else {
    console.warn(`  ! attackdamageperlevel unavailable for ${champion.id}`)
  }

  await writeJson(path.join(CHAMPIONS_DIR, `${champion.id}.json`), championDetail)
}

const nextManifest: DataDragonManifest = {
  version: latestVersion,
  language: LANGUAGE,
  championCount: champions.length,
  itemCount,
  syncedAt: new Date().toISOString(),
}

await writeJson(MANIFEST_PATH, nextManifest)

console.log(
  `Synced Data Dragon ${latestVersion} (${LANGUAGE}) with ${champions.length} champions and ${itemCount} items.`,
)
console.log(
  `Patched per-level attack damage for ${patchedAdCount}/${champions.length} champions from CommunityDragon.`,
)
