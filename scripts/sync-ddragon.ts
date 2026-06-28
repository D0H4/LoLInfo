import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DATA_DRAGON_BASE_URL = 'https://ddragon.leagueoflegends.com'
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

for (const champion of champions) {
  const championUrl = `${DATA_DRAGON_BASE_URL}/cdn/${latestVersion}/data/${LANGUAGE}/champion/${champion.id}.json`
  const championDetail = await fetchJson(championUrl)
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
