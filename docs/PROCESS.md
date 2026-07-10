# PROCESS — bcalendar (b-hub 연동 업데이트 · 버그 수정 · AI · 버그 헌팅)

> 베이스 룰: `~/.claude/convention/*`. 합의: [docs/acknowledge/2026-07-10-hub-sync-decisions.md](./acknowledge/2026-07-10-hub-sync-decisions.md)
> 런타임 bun. 커밋: 영어 명령형 평문, 브랜치 vercel.

## 작업 1 — 의존성 최신화 · 기준선 검증 (Phase 1)

- [x] a. 전체 의존성 최신화 (typescript 5.x 유지 · @types/node major 유지 · eslint 은 peer 호환 범위 내에서만)
- [x] b. next 16.2.x (정확버전 고정 갱신) + eslint-config-next 동반 갱신
- [x] c. 검증: `bunx tsc --noEmit` → `bun run build` → `bun test` (기준선 68 pass 유지)
- [x] d. 커밋 (영어 평문)

## 작업 2 — 보안 (Phase 2)

- [x] a. Workflow(opus·xhigh) 심층 보안 감사
- [x] b. 발견 이슈 중 심각·운영 지장 이슈 즉시 수정 (verifyCsrf 약점 포함 검토)
- [x] c. 리포트 docs/ 기록 + 커밋

## 작업 3 — groupId 소실 버그 (합의 10번, Phase 6)

- [x] a. 실패 테스트 작성으로 재현: updateEventAction 이 미변경 groupId 를 null 로 직렬화 → hub toEventPatch 가 그룹 해제로 처리
- [x] b. 수정: 미변경 필드는 undefined 로 생략 (`groupId: rest.groupId || null` 제거)
- [x] c. 테스트 통과 확인 + 커밋

## 작업 4 — AI 기능 (Phase 6, 구현 전 설계 컨펌 필수)

- [x] a. hub AI 인프라(멀티 프로바이더 프록시) 완성 후 착수
- [x] b. 계정에 AI 연동 시에만 기능 노출 (프로바이더 status active 게이팅)
- [x] c. context = 해당 계정의 모든 일정. 답변은 context 내용 기준으로만 하도록 강제하는 로직
- [x] d. 검증 + 커밋
- [x] e. 원격 hub 계약 재작업 — providers/models/completions(stream) 로 API 재정렬, 프로바이더 status·모델 선택 UI 추가 (커밋 28ad835, test 106 pass)

## 작업 5 — 심층 버그 헌팅 (4개월 유지보수 공백 대응)

- [x] a. Workflow(opus·xhigh) 코드베이스 버그 헌팅 → 리포트 docs/bug-hunt-2026-07-10.md
- [x] b. 발견 버그 수정: groupId 소실(dd87f32, 클라) · BUG-3 조회범위 6주 그리드 정렬(1a94aa8, 클라) · BUG-1 rrule 서버 전개 · BUG-2 overlap 조회(BUG-1/2 는 hyun-hub 서버측 수정)
- [ ] c. 미수정 잔여(low, 지시 시 수정): BUG-5 더보기 드로어 그룹 가시성 · BUG-6 부분 PATCH isAllDay 기본값 · BUG-7 월이동 로딩 폴백

## 작업 6 — 컨벤션 리팩토링 (합의 11번)

- [x] a. shared/ui/theme-provider.tsx function → arrow 전환 (수작업 코드)
- [x] b. calendar-grid.tsx dnd 데이터 `as` 단언 정리 (가능 범위)
- [x] c. 검증 + 커밋

## 진행 로그

- 2026-07-10: 정찰 완료(기준선 tsc PASS · test 68 pass), 합의 문서 기록, 체크리스트 작성.
- 2026-07-10: 작업 1 완료 — next 16.2.10 핀 갱신 · tsc/build/test 68 pass · 커밋 11cc361.
- 2026-07-10: 보안 감사 완료. uidSchema 경로문자 제약(test 68 pass). 커밋 f5aef92. 리포트: docs/security-audit-2026-07-10.md
- 2026-07-10: groupId 소실 버그 실패테스트 재현→수정(커밋 dd87f32, test 71 pass). 버그헌팅 6건 발견 → docs/bug-hunt-2026-07-10.md (BUG-1 rrule 전개·BUG-2 range overlap·BUG-3 그리드 후행주 누락이 high/medium, 수정은 지시 후).
- 2026-07-10: 작업 6(컨벤션) 완료 — theme-provider arrow, getEventDetailAction dead code 제거. test 71 pass. 커밋 3e3856a.
- 2026-07-10: BUG-3(조회범위-그리드 후행주 누락) 수정 — getMonthGridRange 로 조회 endDate 를 6주 그리드에 정렬(page.tsx·calendar-widget.tsx). test 72 pass. 커밋 1a94aa8.
- 2026-07-10: 작업 4(AI) 초판 — 전체 일정 context, context 기준 답변 강제, SSE 채팅 패널. test 92 pass. 커밋 86d7fe7.
- 2026-07-10: 작업 4(AI) 재작업 — 원격 hub 계약 재정렬(providers/models/completions·stream), 프로바이더 status(active) 게이팅·모델 선택 UI. test 106 pass. 커밋 28ad835.
- 2026-07-10: 모델 목록에 GPT-5.1 계열 구모델만 노출되던 문제는 hub 측 원인(codex client_version 구버전·fallback·캐시 stale)으로 확인 — hyun-hub 에서 수정(client_version 0.144.1, fallback 은 현행 Codex 라인업 전체 7종, 기본 조회는 API 응답 전체 노출, 캐시 자동 갱신은 사용자 결정으로 미도입). 이 레포 코드 변경 없음. **hub 배포 완료 후** "모델 새로고침"으로 캐시를 교체해야 전체 라인업이 노출됨.
