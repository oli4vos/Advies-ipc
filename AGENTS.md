# Project context for coding agents

Read this file before changing the product. The durable product rationale lives in `docs/PRODUCT-STRATEGY.md`; the technical blueprint lives in `docs/ARCHITECTURE-BLUEPRINT.md`; founder intent and unresolved assumptions live in `docs/FOUNDER-VISION-CONTEXT.md`.

## Product direction

- Mission: let a business of any size obtain a sharply scoped, reliable answer from the right tax specialist without defaulting to a long, expensive advisory engagement. Start with MKB; serve larger businesses with specialist questions once the model is proven.
- First target segment: Dutch medium-sized sole traders and MKB businesses with meaningful turnover and budget, including BVs and employers. They value certainty and speed over the lowest possible price.
- First wedge: bounded VAT, deductible costs/business expenses and employer/payroll questions. Profit tax, corporate tax and cross-border business follow. Consumer tax topics are a later expansion, not the launch message.
- Customer language uses `belastingvraag`, `belastinghulp`, `vaste prijs` and `specialist`. Reserve `fiscaal`, `casus`, `jobboard`, `claim` and `vergoeding` for advisor/admin or internal interfaces.
- The customer starts with their situation, not a tax category. “Ik weet het niet” must remain a valid route.
- Accept free-form text, documents and an AI answer generated elsewhere. Never treat external AI text as verified advice.

## Customer promise

1. A free route check structures the question and determines whether free/self-service help may be enough.
2. If expert work is needed, show scope, the recommended specialist, responsibility and a clear total price before payment. Fixed scope/price is the pilot default; later, controlled market-based price differentiation may be introduced without an open reverse auction.
3. Extra information may increase the price only when the platform confirms it is necessary and the customer explicitly accepts it.
4. A final answer follows this fixed structure: short answer; impact on the business; action now; deadline; uncertainties/missing facts; sources; when more help is needed.

The public customer experience must not expose marketplace mechanics. The advisor jobboard, admin controls and investor case are separate destinations, linked outside the primary customer journey.

## Responsibility and trust

- Intended legal model: Fiscale Lijn is an intermediary for intake, matching, payment and invoicing; the selected advisor is responsible for the final advice within the agreed scope.
- This is a design assumption, not settled legal advice. Validate contracts, invoicing, professional liability, complaints and payment flows with Dutch legal/tax counsel before a paid pilot.
- Production expert onboarding must verify identity, relevant qualification/registration, subject experience and professional liability insurance.
- The production baseline for tax advisors is active registration with NOB or Register Belastingadviseurs (RB), plus identity, specialism, experience and insurance verification. Do not present demo profiles as verified.
- “No source, no firm conclusion.” Always expose uncertainty and missing facts.
- Original input, anonymised output, customer-supplied AI, platform AI, sources and human corrections are separate, versioned records.
- Operational feedback is never automatically training data. Consent or another documented legal basis, purpose limitation, second de-identification, quality review and dataset approval are mandatory. Never promise that raw customer dossiers can be sold, used for fine-tuning or exposed through an MCP.

## Founder priorities

- Sell confidence: a bounded answer that a business can act on and defend in a tax review, not “cheap AI advice”.
- Human review and honest uncertainty are non-negotiable. AI can offer free orientation, triage and drafts; only a qualified expert can deliver the paid final advice.
- Complex, document-heavy or enterprise-wide work must be routed to an advisory firm or partner, not forced into this product.
- Measure early success through paid questions, use of the free route, returning customers, customer satisfaction and expert supply/quality. Treat margin and speed as learning metrics, not optimisation targets in the first phase.
- Build a venture-scale, diligence-ready company: traceable decisions, clear ownership, defensible data governance and no shortcuts that would obstruct investment or a future sale.

## Architecture constraints

- Python/FastAPI is the only backend technology. Business rules, authorisation, workflow, provider adapters and persistence belong in Python.
- Next.js is the frontend. Do not add backend business logic to Next.js routes.
- Use a modular monolith before microservices.
- GitHub Pages is a static, fictional product demo only. It may use browser storage for continuity but must never accept real dossiers.
- The local app can connect to the FastAPI API. Production requires real authentication, PostgreSQL, private document storage, payment webhooks and EU-oriented deployment.
- Critical state transitions are server-authoritative and audited.
- Frontend changes are layered: screens render and emit user intents, hooks
  orchestrate workspace state and workflows, `app/lib/api.ts` owns HTTP/auth
  calls, and mappers translate API records into screen models. Do not add
  direct `fetch` calls, provider-specific logic or duplicated case mapping to
  page components. Keep the GitHub Pages fallback behind the same boundary.

## Working rules

- Preserve unrelated user work and untracked files. Stage only the files belonging to the current change.
- Make small, traceable commits. Keep product/UX changes and documentation decisions in separate commits when practical.
- Test before push: tracked frontend typecheck/build, Python tests and at least one customer/advisor happy-path smoke test proportional to the change.
- Never commit secrets, real personal data or real tax files.
- Update `docs/PRODUCT-STRATEGY.md` and the architecture blueprint when a decision changes product positioning, responsibility, pricing, workflow, data provenance or deployment.
- Do not present demo-only controls or mock data as production-ready functionality.
- When a workflow or provider changes, update the central adapter/hook and its
  tests first so all screens adapt consistently. Record material layering or
  source-of-truth decisions in the architecture blueprint.

## Current public URLs

- Repository: `https://github.com/oli4vos/Advies-ipc`
- GitHub Pages demo: `https://oli4vos.github.io/Advies-ipc/`

The working brand “Fiscale Lijn” remains temporary. Do not rename it without an explicit product decision.
