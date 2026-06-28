# LoLInfo 프로젝트

LoLInfo는 리그 오브 레전드의 챔피언과 아이템 정보를 정리하는 백과사전형 웹 프로젝트다.

## 기술 스택

- Vite
- React
- TypeScript
- TailwindCSS
- Bun

## 데이터 소스

게임 데이터는 Riot Games의 DataDragon CDN에서 가져온다.

현재 동기화 스크립트:

```txt
scripts/sync-ddragon.ts
```

실행 명령:

```bash
bun run sync:ddragon
```

강제 갱신:

```bash
bun run sync:ddragon --force
```

동기화된 데이터는 다음 위치에 저장된다.

```txt
src/data/ddragon/
```

주요 파일:

```txt
src/data/ddragon/manifest.json
src/data/ddragon/versions.json
src/data/ddragon/champion-summary.json
src/data/ddragon/champions/*.json
src/data/ddragon/item.json
```

## 현재 기능

- 챔피언 / 아이템 화면 전환
- 챔피언 선택
- 챔피언 기본 능력치 표시
- 1~20레벨별 성장 능력치 계산
- 패시브 표시
- Q/W/E/R 스킬 정보 표시
- 아이템 선택
- 아이템 가격, 설명, 스탯, 조합 정보 표시

## 개발 서버

```bash
bun run dev
```

기본 접속 주소:

```txt
http://127.0.0.1:5173
```

## 참고 문서

- `docs/ddragon-icons.md`: DataDragon 아이콘 URL 규칙과 사용 방법
