---
date: 2026-10-14
angle: sec-no-long-lived-creds
pillar: Secure by default
image: 2026-10-14-sec-no-long-lived-creds.svg
status: awaiting-review
---

<!-- Everything below the rule is the post, exactly as it will appear. -->
<!-- Edit it freely. Nothing publishes this; a person does.          -->

**Alt text for the image:** Diagram. Why are there no long-lived cloud credentials in our pipelines? Four stages: Workflow requests a token, then Identity provider attests, then Short-lived credential, then Expires by itself.

---

Why are there no long-lived cloud credentials in our pipelines?

OIDC federation removes the secret entirely. There is nothing to rotate and nothing to leak.

The pipeline asks its identity provider for a token that lasts minutes and is scoped to one job. There is no stored secret, so there is nothing to rotate on a schedule and nothing to find in a log.

Written up in full on the site:

https://www.rrrsolutionproviders.ca/security?utm_source=linkedin&utm_medium=social&utm_campaign=pillars&utm_content=sec-no-long-lived-creds

#PlatformEngineering #DevOps #DevSecOps

---

How it was built:
  - strategist: Secure by default - "Why are there no long-lived cloud credentials in our pipelines?"
  - writer: drafted 389 characters
  - editor: nothing to cut
  - designer: diagram 1200x1200
  - officer: clear
  - reviewer: passed clean
