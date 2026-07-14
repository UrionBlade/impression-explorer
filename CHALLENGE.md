# Senior Full Stack Engineer Challenge — Impression Explorer

## Context

At Cuebiq we turn raw mobility data into measurement and advertising-analytics
products. In this challenge you'll build a full-stack web application that lets
an analyst explore advertising **impressions** (a single ad view coming from a
mobile device) across the United States.

We care about the whole stack — frontend, backend, and database — and about the
judgement you show while building it. There is no single correct solution.

Plan for roughly **one focused day** of work. If you run short, ship less but
ship it well, and note what you'd do next.

---

## The dataset

`assets/` contains:

- `impressions.csv` — records of `device_id, lat, lng, timestamp` (Unix epoch
  **seconds**, UTC)
- `map.json` — GeoJSON of US states (`albersUsa` projection)

---

## What to build

A web application, backed by an API and a database, that answers the questions
below and lets an analyst explore where impressions concentrate:

1. How many impressions come from each device?
2. How many impressions for each hour of the day?
3. How many impressions for each US state?
4. Black Friday impression rate through the years.

Make it something an analyst would actually want to use — an interactive map of
impression density is a natural centrepiece; how far you take the rest is your
call. We notice the details that separate a demo from a product.

How the application behaves as the dataset grows is something we look at closely.

---

## Stack & constraints

**Frontend** — modern component-based framework, React strongly preferred.
**TypeScript is mandatory.**

**Backend** — use the language you're most productive in; our stack is
**Kotlin + Spring Boot** and we'd be glad to see it. **If you choose Node,
TypeScript is mandatory.**

**Database** — a real database is required, **PostgreSQL preferred**. We want to
see your schema and query thinking.

Anything runnable locally is fine — `docker compose up` is a great default. We
should be able to clone, follow your README, and have it running quickly.

---

## AI-assisted development

We're a Claude Code shop and use coding agents heavily — **you're encouraged to
use one.** What we care about is *how you drive it*, not whether you did; "vibe
coding" (shipping code you can't defend) isn't our culture. Give us a short note
on how you worked with the agent, and leave the artifacts in the repo — prompts
or transcripts, a `CLAUDE.md` / rules file, and a commit history that shows the
code evolving. We'll ask you to walk through a decision or two.

---

## Deliverable

- A **`.zip`** with everything needed to run the project, including a `README.md`.
- A **git repository** with progressive commits — we read history.
- Production-minded code: quality, readability, structure. Third-party libraries
  are fine, as long as the core of the work is yours.

---

## Questions

Some of this brief is intentionally open. We appreciate good questions —
especially ones that come with your own proposed answer — before or during the
challenge. Where you decide something yourself, tell us what you chose and why.
Pushing back when something seems off is welcome; that's the job.
