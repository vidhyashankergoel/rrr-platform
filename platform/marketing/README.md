# Marketing

Three LinkedIn posts a week, drafted by a team of agents, blocked by a
compliance gate, reviewed by you in a pull request, and posted by a person.

## The weekly loop

Monday 09:00 ET, GitHub Actions runs `.github/workflows/marketing.yml`. It
composes the week's three posts and opens a pull request containing them.

You read the pull request. What sits between the `---` rules in each file is
exactly what will appear on LinkedIn — edit it freely, that is the point of
shipping it as a diff. Merge when you are happy with the wording.

Then, on each posting day, open the file, copy the text, and post it on the
company page with the matching image and its alt text.

Posting days are **Tuesday, Wednesday, Thursday**. Monday and Friday are where
posts go to be ignored.

## Running it by hand

```bash
npm run marketing:team       # who is on the line, and what each one is for
npm run marketing:plan       # compose the next three into marketing/queue/
npm run marketing:og         # rebuild the site's link-preview image
npm run marketing:analytics  # what actually performed
npm run test:marketing       # prove the compliance gate still refuses
```

## The line

Six agents, in order. Any of them can refuse, and a refusal stops the post.

| | Agent | Refuses when |
|---|---|---|
| 1 | Content strategist | every angle has been used — it will not repeat one |
| 2 | Post writer | — |
| 3 | Editor | — |
| 4 | Designer | it produced an image with no alt text |
| 5 | Compliance officer | a client is named, a metric is invented, PII or a credential appears |
| 6 | Reviewer | any of LinkedIn's published rules is broken |

The compliance officer is the one that matters. It blocks, it does not advise,
and `marketing-test.ts` spends most of its 142 assertions trying to get a bad
post past it.

## Adding subjects

`src/lib/marketing/pillars.ts`. Each angle needs a question, a takeaway,
`evidence` that could only be written about that angle, and a `source` — a
real page on the site, checked by the tests.

There are 24 angles, which is eight weeks before anything repeats. When the
rotation runs out the strategist refuses rather than repeating, which is your
signal to write more.

## What actually performed

Export it from LinkedIn — **page → Analytics → Content → Export** — and save
it as `platform/data/linkedin-analytics.csv`. Then:

```bash
npm run marketing:analytics
```

Posts queued by this system carry `utm_content=<angle-id>`, so engagement can
be traced back to the pillar that produced it, and the rotation weighted
towards what works.

**Nothing scrapes LinkedIn.** Reading other people's feeds and engagement with
an automated client breaches the User Agreement and collects personal
information about named individuals who never consented to being in our
dataset. The export above is your own data, it is complete, and it is better.

## Publishing automatically

Currently off, and the scheduled job has no credentials by design.

The only compliant route is the **Community Management API**: a registered
developer application, the company page verified as its owner, OAuth with the
`w_organization_social` scope. Everything else sold as "LinkedIn automation"
is browser automation or an unofficial client, both prohibited by name in
section 8.2 of the User Agreement. The penalty is losing the account — and
because a company page is administered through a personal profile, a ban takes
the founder's profile with it.

When the approval comes through, set:

```
LINKEDIN_ACCESS_TOKEN
LINKEDIN_ORGANIZATION_URN     # urn:li:organization:NNNNN — the page, not you
```

`publish.ts` still requires an explicit confirmation from a person on every
call. The scheduled job never sets it, and the tests assert that it cannot.
