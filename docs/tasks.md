# 남은 작업 (TODO)

처음 제기된 아이템/스탯 관련 이슈와 데이터 결함은 모두 처리됨. 아래는 필수는 아니지만
추후 고려할 만한 선택 항목.

## 1. 자연어 검색 short alias 오탐 (저severity)
- `src/lib/naturalSearch.ts`의 `findItem`/`findChampion`은 `normalizedQuery.includes(alias)`
  방식이라, 큐레이션된 1~2글자 한글 별칭(예: "렐", "그가")이 무관한 질의의 부분 문자열에
  걸릴 수 있음.
- 현재는 alias 길이 기반 score 정렬로 어느 정도 완화되며 데이터가 큐레이션되어 실사용
  문제는 적음.
- 개선안: 최소 매칭 점수 임계 도입 또는 토큰 경계 기반 매칭으로 정확도 향상.
  (숫자 item.id 오탐은 이미 정확 일치로 제한 완료.)

## 참고: 이미 처리된 항목
- `isItemAvailableOnMap` 매직넘버 → 6자리 변형 id 판정으로 명확화 (`src/lib/data.ts`)
- `uniqueItemsByName` 비결정적 선택 → 최저 id(정본) 결정적 선택 (`src/App.tsx`)
- 레시피 클릭 시 선택 튕김 → 맵 변경 핸들러로 이전 (`src/App.tsx`)
- 아이템 스탯 누락 → description `<stats>` 블록 파싱, `stats` 객체 폴백
  (`src/lib/format.ts`, `ItemDetail.tsx`, `naturalSearch.ts`)
- 레벨당 공격력 0 → CommunityDragon raw 데이터로 보강 (`scripts/sync-ddragon.ts`)
- 번들 크기 최적화 → 챔피언 상세 173개(~4.7M)를 동적 `import()`로 지연 로드.
  `src/lib/data.ts`의 eager glob 제거 + 캐시 포함 `loadChampionDetail`, 검색·상세를
  async화. 초기 청크 ~3,595 kB → ~1,112 kB (gzip 679 → 233 kB).
  (item.json 880K는 그리드·검색이 전체 목록에 의존해 분리 보류.)
</content>
