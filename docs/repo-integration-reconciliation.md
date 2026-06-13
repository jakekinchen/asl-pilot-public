# Repo Integration Reconciliation

## first build-session checklist

- [ ] Is this a greenfield repo or existing app?
- [ ] Package manager: npm, pnpm, yarn, other?
- [ ] Frontend framework: React/Vite, Next.js, other?
- [ ] Existing auth provider?
- [ ] Existing data layer?
- [ ] Existing model/browser runtime?
- [ ] Existing docs/audit conventions?
- [ ] Existing deployment target?
- [ ] Existing tests/checks?

## merge rule

If existing repo conventions conflict with this plan, update this plan's durable files rather than overriding working code silently.

## no parallel audit rule

Do not create duplicate validation systems if the repo already has audit surfaces. Adapt `docs/validation/*` names to existing conventions and record the mapping.
