# 검정 실험실

『통계학의 개념 및 제문제』(2019) 제7장 가설검정을 시뮬레이션과 정확 계산으로 배우는 정적 웹사이트.
사이트: https://databetter25.github.io/hypothesis-lab/

교재 예제는 수치 설정만 재현하며 교재 본문·그림은 싣지 않는다. 교재·워크북 PDF는 저장소에 포함하지 않는다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 엔진 기준값·불변식·시뮬레이션 테스트 (vitest)
npm run e2e      # 배포 빌드로 E2E·접근성(axe)·오프라인 테스트 (Playwright, 최초 1회 npx playwright install chromium)
npm run build    # dist/ 정적 산출물 (상대 경로라 어느 하위 경로에도 배포 가능)
```

## 구조

| 경로 | 내용 |
|---|---|
| `src/engine/` | 순수 계산 엔진 (UI 의존 없음). 모형 4개: `coin`, `normal`, `table`(BigInt 분수 정확 산술), `tea` |
| `src/engine/core/` | Φ·Φ⁻¹, xoshiro128** 난수(`xoshiro128ss-v1`), 유리수, 로그팩토리얼, Wilson 구간 |
| `src/engine/simulate.ts` | 반복 실험. 반복마다 표본 난수 → 확률화용 난수 1개 순서 고정 (PRD §11.7) |
| `src/workers/` | 시뮬레이션 Web Worker. 정지는 Worker 종료로 즉시 처리 |
| `src/state/labState.ts` | 실험 설정 ↔ URL 쿼리 (URL이 단일 진실원, 잘못된 값은 기본값 복원) |
| `src/modules/` | 실험 모듈 6종: p-값과 기각역, 두 오류, 검정력함수, p-값의 분포, 최강력검정, 가능도비검정 |
| `src/content/presets.ts` | 교재·워크북(T), 동전(E), Wilks(W) 프리셋 |
| `tools/golden.py` | SciPy로 기준값 생성 → `tests/golden/golden.json` |

기준값을 바꾸려면 `python tools/golden.py`를 실행한 뒤 `npm test`로 대조한다.

## 배포·오프라인·내보내기

- `npm run build` 결과(`dist/`)는 상대 경로라 어느 정적 호스팅·하위 경로에도 올릴 수 있다.
- 배포 빌드에는 서비스 워커(`sw.js`, `vite.config.ts`의 `offlineServiceWorker`)가 들어가 산출물 전체를 미리 캐시한다. 한 번 열면 인터넷 없이도 모든 페이지와 시뮬레이션이 동작한다. 확인은 `npm run preview`.
- 시뮬레이션 패널의 `⬇ CSV`는 현재 설정(URL), 시드·난수 버전, 기각 비율과 Wilson 구간, 원자료를 저장한다 (`src/lib/exportCsv.ts`).

## 테스트와 배포

- `e2e/a11y.spec.ts`: 모든 페이지·모형(데스크톱 43쪽, 모바일 13쪽)에서 axe-core WCAG 2.2 AA 위반 0건, 콘솔 오류 0건, 모바일 가로 넘침 없음.
- `e2e/flows.spec.ts`: 기준값 표시, α와 p-값의 독립(A04), 같은 시드 링크의 재현(A08), 잘못된 링크 복원(A09), 키보드 조작(A10), 안내 학습 저장, 용어사전, CSV(F19), 오프라인(F20).
- `main`에 푸시하면 GitHub Actions가 단위 테스트 → E2E → 빌드를 거쳐 통과할 때만 Pages에 배포한다.
- 개발 서버에서 빠르게 점검하려면 브라우저 콘솔에 `tools/a11y-audit.js`를 붙여 넣는다.
