# /check-arch

## inputs

- active task id
- active brief
- cited `ARCHITECTURE.md` anchors
- changed files
- relevant area `CLAUDE.md`
- cross-doc invariant table

## checks

- [ ] Every active task references at least one architecture anchor.
- [ ] Changed interfaces/models are defined in cited architecture sections.
- [ ] If a model/interface changed, the defining architecture section changed in the same round or no contract change was needed.
- [ ] No implementation touched files outside declared area without explanation.
- [ ] Tests exist for acceptance criteria.
- [ ] No hidden pretrained dependency was introduced.
- [ ] No raw video upload/persistence was introduced.
- [ ] Active module recognition claim matches model manifest.

## output

- pass
- pass with warnings
- fail: missing anchor
- fail: architecture drift
- fail: unspecifiable interface
- fail: test gap
- fail: privacy/no-pretrained violation
