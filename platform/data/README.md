# `data/`

Files you maintain by hand that the agents read.

## `outreach-targets.json` — NOT COMMITTED, AND MUST NOT BE

This file holds the names, roles and employers of real people. That is
personal information under PIPEDA, and this repository is public.

It is listed in `.gitignore`, and CI fails the build if it is ever tracked —
belt and braces, because the cost of getting this wrong is other people's
information on the public internet with their name attached, which cannot be
undone by deleting the file afterwards.

Copy `outreach-targets.example.json` to `outreach-targets.json` and fill it
in. `name` and `why` are both required; the agent refuses the file rather than
writing a generic note without them.

```
npm run agents:tick -- --only=outreach --force
```

Drafts land in the `ContentDraft` table and appear in the admin console. You
send them by hand — see `src/lib/agents/ops/outreach.ts` for why that is not
a limitation waiting to be removed.
