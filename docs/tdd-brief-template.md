# brief NNN: <feature>

status: draft | approved | in-progress | complete
area: <web | models | data | docs | infra | product>
task source: `MVP_TASKS.md#task-XXX`
architecture anchors:
- `ARCHITECTURE.md#arch-...`

## feature

<what this slice adds or changes>

## safety banner

Include if touching model claims, privacy, auth, persistence, data provenance, no-pretrained compliance, thresholds, or learner-facing feedback.

## use case

<the user/system flow this slice enables>

## traceability

- task: `MVP_TASKS.md#task-XXX`
- architecture: `ARCHITECTURE.md#arch-...`
- area instructions: `<area>/CLAUDE.md`
- lessons consulted:
  - `<area>/LESSONS.md#lesson-...`

## invariants

- <invariant that must remain true>

## acceptance criteria

- [ ] <observable behavior>
- [ ] <failure behavior>
- [ ] <edge case>

## wiring / entry point

Real entry point to prove reachability:

- ui route:
- browser worker:
- api/repository call:
- training cli:
- validation cli:

## files expected to touch

- `<path>`

## red test outline

- happy path:
- boundary path:
- failure path:
- regression path:

## cross-doc invariant impact

Does this change any typed model, public interface, state machine, permission rule, model claim, or architecture invariant?

- yes/no:
- affected section:
- required doc update:

## things to flag at step 2.5

- Are boundary tests missing?
- Is the wiring path real?
- Does the test prove the cited invariant?
- Is the acceptance criterion observable?
- Is there a risk the test only proves a mock?
- Could this introduce raw video persistence/upload?
- Could this introduce pretrained dependency contamination?
- Could this overclaim active model coverage?

## dependencies

- <dependency or none>

## estimated commit count

<1 by default>

## lesson candidates

- <possible reusable gotcha or pattern>

## how to invoke

```bash
/tdd <feature>
```
