<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Also read `../AGENTS.md`, `../docs/PRODUCT-STRATEGY.md` and `../docs/ARCHITECTURE-BLUEPRINT.md` before changing product behaviour.

Frontend-specific rules:

- Keep customer wording in plain Dutch MKB language. Internal tax and marketplace terminology belongs in advisor/admin views.
- The GitHub Pages export is a fictional demo; do not imply secure uploads, authentication, live tax sources or real payments.
- Preserve keyboard focus, reduced-motion support, responsive behaviour and the customer/advisor/admin separation.
- Do not introduce Next.js API routes for business logic; use the Python FastAPI backend through `app/lib/api.ts`.
