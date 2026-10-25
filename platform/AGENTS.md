# RRR Solution Providers — platform

The website, the operations agents, and the marketing pipeline for a Canadian
cloud consultancy. Next.js 16, TypeScript strict, Prisma. SQLite locally,
Postgres in production. Deployed on Vercel from `main`.

## Start here

    npm run test            every suite; the gate before any push
    npm run test -- --fast  skips the browser and load suites (~12s)
    npm run agents:status   which operations agents are configured
    npm run presence:check  is the live site still healthy

`npm run test` is the definition of done. It runs typecheck first, then every
suite, and prints one summary. A change is not finished because it compiles.

## The rule that matters most

**Three former clients must never be named in anything this repo publishes.**
Their work was delivered under employment with a prior employer, on that
employer's accounts, so it is not ours to talk about. Two others — Rugby Canada
and Digitalogy LLC — are this firm's own clients and are named deliberately.

`attribution-test.ts` enforces this, and it is not only about prose. A client
name leaks through surfaces nobody thinks to check:

- the `client` field reaching the browser in a streamed RSC payload
- a case-study **slug**, which becomes a React key and a DOM `id`
- a repository name or description on GitHub

All three happened. Run `npm run test:attribution` after touching anything in
`src/lib/catalogue.ts`, `src/lib/case-view.ts`, or `/work`.

## Gates that exist, and must not be loosened

| Gate | What it refuses |
|---|---|
| `src/lib/marketing/compliance.ts` | Client names, invented metrics, follower/rating claims, PII, credentials |
| `src/lib/marketing/publish.ts` | Publishing without credentials AND an explicit human confirm |
| `scripts/attribution-test.ts` | Client identity in any published surface, including slugs |
| `scripts/page-quality-test.ts` | Heading-level skips, missing/duplicate meta, missing alt |
| `scripts/security-test.ts` | Unthrottled endpoints, consent defaults, the admin surface |

When a gate blocks something, the gate is usually right. Fix the content, not
the gate. If a gate is genuinely wrong, say so and fix it deliberately — two of
them had real false positives that were corrected rather than suppressed.

## Things that will waste your time

**Duplicate files from iCloud sync.** `Desktop` is synced, so `name 2.ts`
copies appear inside `.next-build` and TypeScript reads them as redeclarations.
`npm run test` sweeps them first; running `tsx scripts/regression.ts` directly
does not. If Types fails with "Duplicate identifier" and nothing is wrong, this
is why.

**The sitemap is an explicit list, not a glob.** A glob would add `/admin`.
Adding a page means adding it to `src/app/sitemap.ts` and giving it a
self-referencing canonical — `security-test.ts` asserts both sets match.

**Never put `alternates.canonical` in the root layout.** Every page inherits
it and declares itself a duplicate of the homepage.

## Where things are

    src/app/              pages; each has its own metadata + canonical
    src/lib/marketing/    pillars, the compliance gate, card rendering, publish
    src/lib/agents/ops/   10 agents on a tick loop — they propose, humans dispose
    scripts/              every suite, plus the marketing and growth CLIs
    marketing/queue/      drafted posts awaiting a human; committed on purpose

## Standing constraints

- Nothing publishes or sends without a person. Agents draft.
- No fabricated testimonials, follower counts or ratings — Competition Act.
- No commercial email until `CASL_MAILING_ADDRESS` is set.
- No scraping LinkedIn. Paste is the supported path.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
