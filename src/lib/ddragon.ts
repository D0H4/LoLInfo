import type { ChampionImage, Manifest } from '../types'
import manifest from '../data/ddragon/manifest.json'

const ddragonBase = `https://ddragon.leagueoflegends.com/cdn/${manifest.version}`

export const ddragon = {
  base: ddragonBase,
  version: manifest.version as Manifest['version'],
  champion: (image: ChampionImage | { full: string }) =>
    `${ddragonBase}/img/champion/${image.full}`,
  item: (image: ChampionImage | { full: string }) =>
    `${ddragonBase}/img/item/${image.full}`,
  spell: (image: ChampionImage | { full: string }) =>
    `${ddragonBase}/img/spell/${image.full}`,
  passive: (image: ChampionImage | { full: string }) =>
    `${ddragonBase}/img/passive/${image.full}`,
  // 챔피언 세로 스플래시 (큰 일러스트)
  splash: (id: string, skin: number = 0) =>
    `${ddragonBase}/img/champion/splash/${id}_${skin}.jpg`,
  // 챔피언 가로 배너
  loading: (id: string, skin: number = 0) =>
    `${ddragonBase}/img/champion/loading/${id}_${skin}.jpg`,
  tile: (id: string, skin: number = 0) =>
    `${ddragonBase}/img/champion/tiles/${id}_${skin}.jpg`,
}

export { manifest }
