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

- [ ] a. 실패 테스트 작성으로 재현: updateEventAction 이 미변경 groupId 를 null 로 직렬화 → hub toEventPatch 가 그룹 해제로 처리
- [ ] b. 수정: 미변경 필드는 undefined 로 생략 (`groupId: rest.groupId || null` 제거)
- [ ] c. 테스트 통과 확인 + 커밋

## 작업 4 — AI 기능 (Phase 6, 구현 전 설계 컨펌 필수)

- [ ] a. hub AI 인프라(멀티 프로바이더 프록시) 완성 후 착수
- [ ] b. 계정에 AI 연동 시에만 기능 노출
- [ ] c. context = 해당 계정의 모든 일정. 답변은 context 내용 기준으로만 하도록 강제하는 로직
- [ ] d. 검증 + 커밋

## 작업 5 — 심층 버그 헌팅 (4개월 유지보수 공백 대응)

- [ ] a. Workflow(opus·xhigh) 코드베이스 버그 헌팅 → 사용자에게 보고 (수정은 지시 후)
- [ ] b. 표면 관찰 이미 확보: rrule(반복일정)이 toCalendarEvent 매퍼에서 소실 · getEventDetailAction dead code · 종일 이벤트 exclusive/inclusive 경계

## 작업 6 — 컨벤션 리팩토링 (합의 11번)

- [ ] a. shared/ui/theme-provider.tsx function → arrow 전환 (수작업 코드)
- [ ] b. calendar-grid.tsx dnd 데이터 `as` 단언 정리 (가능 범위)
- [ ] c. 검증 + 커밋

## 진행 로그

- 2026-07-10: 정찰 완료(기준선 tsc PASS · test 68 pass), 합의 문서 기록, 체크리스트 작성.
- 2026-07-10: 작업 1 완료 — next 16.2.10 핀 갱신 · tsc/build/test 68 pass · 커밋 11cc361.
- 2026-07-10: 보안 감사 완료. uidSchema 경로문자 제약(test 68 pass). 커밋 f5aef92. 리포트: docs/security-audit-2026-07-10.md
