# DataDragon 아이콘 사용 방법

DataDragon은 챔피언, 아이템, 스킬, 패시브 아이콘 이미지를 JSON 안에 직접 포함하지 않는다.  
대신 각 JSON 데이터의 `image.full` 필드에 이미지 파일명을 제공하고, 이 값을 CDN 경로와 조합해서 사용한다.

현재 프로젝트의 DataDragon 버전과 언어 정보는 다음 파일에서 확인한다.

```txt
src/data/ddragon/manifest.json
```

예시:

```json
{
  "version": "16.13.1",
  "language": "ko_KR",
  "championCount": 173,
  "itemCount": 706,
  "syncedAt": "2026-06-27T14:01:35.606Z"
}
```

## 기본 CDN 주소

```txt
https://ddragon.leagueoflegends.com/cdn/{version}
```

`{version}`에는 `manifest.json`의 `version` 값을 넣는다.

## 챔피언 아이콘

챔피언 아이콘 파일명은 챔피언 데이터의 `image.full` 필드에 있다.

데이터 위치:

```txt
src/data/ddragon/champions/{ChampionId}.json
```

필드:

```txt
champion.image.full
```

URL 형식:

```txt
https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{image.full}
```

예시:

```txt
https://ddragon.leagueoflegends.com/cdn/16.13.1/img/champion/Ahri.png
```

## 아이템 아이콘

아이템 아이콘 파일명은 아이템 데이터의 `image.full` 필드에 있다.

데이터 위치:

```txt
src/data/ddragon/item.json
```

필드:

```txt
item.image.full
```

URL 형식:

```txt
https://ddragon.leagueoflegends.com/cdn/{version}/img/item/{image.full}
```

예시:

```txt
https://ddragon.leagueoflegends.com/cdn/16.13.1/img/item/1001.png
```

## 스킬 아이콘

스킬 아이콘 파일명은 챔피언 상세 데이터의 `spells[].image.full` 필드에 있다.

필드:

```txt
champion.spells[].image.full
```

URL 형식:

```txt
https://ddragon.leagueoflegends.com/cdn/{version}/img/spell/{image.full}
```

예시:

```txt
https://ddragon.leagueoflegends.com/cdn/16.13.1/img/spell/AhriOrbofDeception.png
```

## 패시브 아이콘

패시브 아이콘 파일명은 챔피언 상세 데이터의 `passive.image.full` 필드에 있다.

필드:

```txt
champion.passive.image.full
```

URL 형식:

```txt
https://ddragon.leagueoflegends.com/cdn/{version}/img/passive/{image.full}
```

예시:

```txt
https://ddragon.leagueoflegends.com/cdn/16.13.1/img/passive/Ahri_SoulEater2.png
```

## React에서 사용하는 예시

```tsx
const ddragonBaseUrl = `https://ddragon.leagueoflegends.com/cdn/${manifest.version}`

const championIconUrl = `${ddragonBaseUrl}/img/champion/${champion.image.full}`
const itemIconUrl = `${ddragonBaseUrl}/img/item/${item.image.full}`
const spellIconUrl = `${ddragonBaseUrl}/img/spell/${spell.image.full}`
const passiveIconUrl = `${ddragonBaseUrl}/img/passive/${champion.passive.image.full}`
```

```tsx
<img src={championIconUrl} alt={champion.name} />
<img src={itemIconUrl} alt={item.name} />
<img src={spellIconUrl} alt={spell.name} />
<img src={passiveIconUrl} alt={champion.passive.name} />
```

## 로컬 저장이 필요한 경우

현재 방식은 브라우저가 Riot CDN에서 이미지를 직접 가져오는 방식이다.  
이미지까지 프로젝트 안에 고정해두고 싶다면 `scripts/sync-ddragon.ts`를 확장해서 다음 경로의 이미지를 다운로드하면 된다.

```txt
https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{image.full}
https://ddragon.leagueoflegends.com/cdn/{version}/img/item/{image.full}
https://ddragon.leagueoflegends.com/cdn/{version}/img/spell/{image.full}
https://ddragon.leagueoflegends.com/cdn/{version}/img/passive/{image.full}
```

추천 저장 위치:

```txt
public/ddragon/{version}/champion/
public/ddragon/{version}/item/
public/ddragon/{version}/spell/
public/ddragon/{version}/passive/
```

로컬 저장 방식의 장점은 배포 후 CDN 응답 상태와 무관하게 이미지가 안정적으로 제공된다는 점이다.  
단점은 동기화 시간이 길어지고 저장 용량이 증가한다는 점이다.
