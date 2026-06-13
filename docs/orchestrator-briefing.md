# Orchestrator Briefing

## charter

The orchestrator keeps the round coherent. It does not deep-code every area. It derives state from files, selects the next task, writes just-in-time briefs, reviews step-2.5 test design, routes step-9 flags, and closes the round.

## canonical read order

1. `CLAUDE_CODE_HANDOFF.md`
2. `STAGE_GATE_STATUS.md`
3. `ARCHITECTURE.md`
4. `MVP_TASKS.md`
5. latest `docs/session-logs/*.md`
6. relevant area `CLAUDE.md`/`LESSONS.md`
7. `docs/tdd-brief-template.md`

## routing matrix

| finding | destination |
|---|---|
| active label unsupported | `MVP_TASKS.md`, `docs/model/active-vocabulary-claim.json` |
| dataset rights unclear | `DECISIONS.md`, `docs/research/asl-source-rights-matrix.json` |
| architecture invariant incomplete | `ARCHITECTURE.md#arch-cross-doc-invariants` |
| test plan missing boundary | active brief step 2.5 |
| model metric below claim | model card, final claim matrix, downscope decision |
| raw video path appears | immediate stop + privacy audit |
| pretrained dependency appears | immediate stop + no-pretrained audit |
| repeated gotcha | area `LESSONS.md` and area `CLAUDE.md` index |

## round start output

- selected task id
- brief path
- implementer area
- acceptance criteria
- validations to run
- known risks

## round end output

- task status changes
- commits/checks summary
- artifacts produced
- flags routed
- carry-forward list
- push/no-push decision
