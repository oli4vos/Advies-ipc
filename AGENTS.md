# Project context for coding agents

Read this file before changing the product. The durable product rationale lives in `docs/PRODUCT-STRATEGY.md`; the technical blueprint lives in `docs/ARCHITECTURE-BLUEPRINT.md`.

## Product direction

- Mission: make high-quality tax advice accessible without forcing every question into an expensive full-service engagement.
- First target segment: Dutch small and medium-sized businesses (MKB), including sole traders, BVs and employers.
- First wedge: bounded VAT/invoicing and employer/payroll questions. Profit tax, corporate tax and cross-border business follow. Consumer tax topics are a later expansion, not the launch message.
- Customer language uses `belastingvraag`, `belastinghulp`, `vaste prijs` and `specialist`. Reserve `fiscaal`, `casus`, `jobboard`, `claim` and `vergoeding` for advisor/admin or internal interfaces.
- The customer starts with their situation, not a tax category. “Ik weet het niet” must remain a valid route.
- Accept free-form text, documents and an AI answer generated elsewhere. Never treat external AI text as verified advice.

## Customer promise

1. A free route check structures the question and determines whether free/self-service help may be enough.
2. If expert work is needed, show scope, the recommended specialist, responsibility and a fixed total price before payment.
3. Extra information may increase the price only when the platform confirms it is necessary and the customer explicitly accepts it.
4. A final answer follows this fixed structure: short answer; impact on the business; action now; deadline; uncertainties/missing facts; sources; when more help is needed.

The public customer experience must not expose marketplace mechanics. The advisor jobboard, admin controls and investor case are separate destinations, linked outside the primary customer journey.

## Responsibility and trust

- Intended legal model: Fiscale Lijn is an intermediary for intake, matching, payment and invoicing; the selected advisor is responsible for the final advice within the agreed scope.
- This is a design assumption, not settled legal advice. Validate contracts, invoicing, professional liability, complaints and payment flows with Dutch legal/tax counsel before a paid pilot.
- Production expert onboarding must verify identity, relevant qualification/registration, subject experience and professional liability insurance.
- “No source, no firm conclusion.” Always expose uncertainty and missing facts.
- Original input, anonymised output, customer-supplied AI, platform AI, sources and human corrections are separate, versioned records.
- Operational feedback is never automatically training data. Consent, purpose limitation, second de-identification and dataset approval are mandatory.

## Architecture constraints

- Python/FastAPI is the only backend technology. Business rules, authorisation, workflow, provider adapters and persistence belong in Python.
- Next.js is the frontend. Do not add backend business logic to Next.js routes.
- Use a modular monolith before microservices.
- GitHub Pages is a static, fictional product demo only. It may use browser storage for continuity but must never accept real dossiers.
- The local app can connect to the FastAPI API. Production requires real authentication, PostgreSQL, private document storage, payment webhooks and EU-oriented deployment.
- Critical state transitions are server-authoritative and audited.

## Working rules

- Preserve unrelated user work and untracked files. Stage only the files belonging to the current change.
- Make small, traceable commits. Keep product/UX changes and documentation decisions in separate commits when practical.
- Test before push: tracked frontend typecheck/build, Python tests and at least one customer/advisor happy-path smoke test proportional to the change.
- Never commit secrets, real personal data or real tax files.
- Update `docs/PRODUCT-STRATEGY.md` and the architecture blueprint when a decision changes product positioning, responsibility, pricing, workflow, data provenance or deployment.
- Do not present demo-only controls or mock data as production-ready functionality.

## Current public URLs

- Repository: `https://github.com/oli4vos/Advies-ipc`
- GitHub Pages demo: `https://oli4vos.github.io/Advies-ipc/`

The working brand “Fiscale Lijn” remains temporary. Do not rename it without an explicit product decision.
