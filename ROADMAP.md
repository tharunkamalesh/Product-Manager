# PM Daily Copilot — 9-Day Sprint (Day 2 of 10)

**Today:** 2026-04-26 · **Ship by:** 2026-05-04

The UI shell is done. What's missing is **the brain** (real AI) and **the trust layer** (replacing mocks with real data derived from memory/history).

---

## State today

| Area | Status |
|---|---|
| Routing (9 pages) | ✅ Done |
| UI components | ✅ Done |
| Theme toggle | ✅ Done |
| localStorage memory + history | ✅ Done |
| Inbox → Analyze flow | ✅ Done |
| All buttons wired | ✅ Done |
| Build compiles | ✅ Clean |
| **Real AI (Claude API)** | ❌ Still keyword heuristic |
| **Insights real metrics** | ⚠️ Hardcoded 82%/+14%/High |
| **Trend chart data** | ⚠️ Hardcoded TREND_DATA |
| **Priority card meta (assignee/source/dueDate)** | ⚠️ Mock fallbacks |
| **Filters popover** | ⚠️ UI only, doesn't filter |
| **Onboarding** | ⚠️ Component built, not hooked to first-run |
| **One real integration** | ❌ All "Coming Soon" |
| **Code splitting** | ❌ 832 kB single chunk |
| **Tests** | ❌ Only example.test.ts |
| **Deploy** | ❌ Not yet |

---

## Day 2 — 2026-04-26 (today) — Real AI engine

The single biggest credibility jump. Everything else is polish without this.

- [ ] Add `@anthropic-ai/sdk` to dependencies
- [ ] Create Vercel Edge Function `api/analyze.ts` that calls Claude
  - System prompt: "You are an AI decision engine for early-stage PMs/founders. Given messy input + memory context, return structured JSON `AnalysisResult`."
  - Use **tool use / structured output** to force the response shape from [src/types/copilot.ts](src/types/copilot.ts)
  - Inject `goal`, `pastPriorities`, `patterns` into user message when `useMemory=true`
  - Enable **prompt caching** on system prompt (cheaper repeat calls)
  - Model: `claude-sonnet-4-6`
- [ ] Replace [src/lib/analyzer.ts](src/lib/analyzer.ts) `analyzeInput` body to fetch `/api/analyze`. Keep same signature so [src/pages/Index.tsx](src/pages/Index.tsx) doesn't change
- [ ] Keep keyword analyzer behind `VITE_USE_LOCAL_ANALYZER=true` for offline demo
- [ ] Test with 5 real Slack/Jira/email dumps

**Done when:** pasting "users complaining checkout broken, also need to draft Q3 deck" gets a response that actually cites checkout urgency and Q3 timing.

---

## Day 3 — 2026-04-27 — Kill the mocks, part 1 (Insights + Trends)

Make the product feel real. Every hardcoded number lies to your users.

- [ ] [src/pages/Insights.tsx](src/pages/Insights.tsx):
  - **Focus Score** = % of last 7 sessions where top priority mentioned a goal keyword
  - **Velocity** = sessions analyzed this week vs last week
  - **Leverage** = ratio of High to Low priorities in last 7 sessions
  - **Recurring Themes** = real `memory.patterns` (already wired, just remove the MOCK_PATTERNS fallback when memory is empty — show empty state instead)
- [ ] [src/components/dashboard/RightRail.tsx](src/components/dashboard/RightRail.tsx):
  - Replace `TREND_DATA` with derived weekly counts from `useCopilot().history`
  - If <2 sessions, show "Run a few analyses to see trends"

**Done when:** new user sees honest "no data yet" instead of fake 82% Focus Score.

---

## Day 4 — 2026-04-28 — Kill the mocks, part 2 (Priority cards + Filters)

- [ ] Update Claude prompt to also return `assignee`, `source`, `dueDate` fields per priority — they're already optional in `Priority` type
- [ ] Remove the `item.assignee || (bucket === "high" ? "AV" : "JD")` fallback in [PriorityBoard.tsx:158-160](src/components/dashboard/PriorityBoard.tsx#L158-L160) — only show fields when real
- [ ] Wire [TopBar Filters popover](src/components/dashboard/TopBar.tsx#L92-L130) to lift state up via context or URL params, then filter the priority board on `/`, `/priorities`
- [ ] Replace hardcoded notifications with real events (last 5 from history: "Analysis run", "Memory updated", etc.)

**Done when:** Filter dropdown actually filters; cards only show fields the AI returned.

---

## Day 5 — 2026-04-29 — One real integration + Calendar

Pick lowest-friction options. Skip OAuth entirely for v1.

- [ ] **Calendar `.ics` export:** [src/pages/Calendar.tsx](src/pages/Calendar.tsx) "Add to my calendar" button generates a real `.ics` file from `actionPlan`. Works in Google/Outlook/Apple Calendar via import. No OAuth needed.
- [ ] **Slack via incoming webhook:** add a "Slack Webhook URL" field in [Settings](src/pages/Settings.tsx). When set, "Send to Slack" in RightRail POSTs the summary to it. No OAuth.
- [ ] Update [Integrations.tsx](src/pages/Integrations.tsx) — Calendar and Slack get "Connected" / "Configure" instead of "Coming Soon"

**Done when:** "Add to Calendar" downloads a working `.ics`; Slack webhook posts a real message.

---

## Day 6 — 2026-04-30 — Onboarding + first-run flow

The [OnboardingGuide](src/components/dashboard/OnboardingGuide.tsx) component already exists. Hook it up.

- [ ] On first visit (`localStorage.firstRun !== "false"`), show 3-step wizard:
  1. Welcome — what this does (60-second pitch)
  2. Set your strategic goal (required input)
  3. "Try a sample" — pre-fills the textarea + auto-clicks Analyze
- [ ] Set `localStorage.firstRun = "false"` after wizard completes
- [ ] Add "Restart tutorial" button in Settings

**Done when:** clearing localStorage and reloading walks you through onboarding to first analysis in <60 sec.

---

## Day 7 — 2026-05-01 — Performance, tests, mobile

- [ ] **Code splitting:** lazy-load each route via `React.lazy(() => import(...))` in [App.tsx](src/App.tsx). Should drop main bundle from 832 kB to ~300 kB.
- [ ] **Mobile:** sidebar collapses to a hamburger drawer on `<lg`, RightRail stacks below main content (already mostly OK — verify on real device)
- [ ] **Tests:** vitest component tests for InputBar (analyze gating), ActionPlanCard (toggle/assign), useMemory (persistence). 3 tests minimum.
- [ ] **Lint:** run `npm run lint` and clear all warnings

**Done when:** Lighthouse Performance >85 on mobile, 3 tests pass.

---

## Day 8 — 2026-05-02 — Polish + telemetry

- [ ] **Empty states everywhere:** Dashboard with no analysis, Inbox empty, History empty, Calendar empty, Insights empty — each should look intentional, not broken
- [ ] **Loading skeletons** during `analyzeInput` (use [skeleton.tsx](src/components/ui/skeleton.tsx))
- [ ] **Plausible** (no cookie banner) or **PostHog**: track `onboarding_completed`, `analyze_started`, `analyze_completed` (with duration), `priority_done`, `plan_exported`, `slack_sent`, `ics_downloaded`
- [ ] **Copy pass:** read every label and toast aloud — rewrite anything awkward. Especially the Dashboard hero text for first-time visitors.
- [ ] **Hardcoded "Aman Verma":** make it editable in Settings, default to "You"

**Done when:** every page looks intentional with zero data; telemetry firing in dev.

---

## Day 9 — 2026-05-03 — Deploy + smoke test

- [ ] Deploy to Vercel (drop-in for Vite + Edge Functions)
- [ ] Set `ANTHROPIC_API_KEY` in Vercel env
- [ ] Custom domain (optional)
- [ ] Smoke test full flow on prod URL: onboarding → analyze → priority → calendar export → Slack send
- [ ] Test Chrome desktop, Safari desktop, Safari mobile, Chrome Android — fix what breaks
- [ ] Buffer for whatever slipped from Days 2–8

**Done when:** public URL works for the full happy path.

---

## Day 10 — 2026-05-04 — User test + ship

- [ ] Send URL privately to 5 founders/PMs (DM, not public launch)
- [ ] Watch them use it (Loom/Zoom)
- [ ] Fix top 3 issues they hit
- [ ] Decide: public launch (Twitter/Product Hunt) or another sprint
- [ ] Write a 1-paragraph "what's next" post

**Done when:** 5 strangers have used it and you have real feedback.

---

## Cuts if you slip

Drop in this order:
1. Tests (Day 7) — keep build green, skip unit tests
2. Slack webhook (Day 5) — keep just `.ics` export
3. Code splitting (Day 7) — 832 kB still loads in <2s on broadband
4. Filters wiring (Day 4) — leave the popover with a "coming soon" badge
5. Mock killing in Insights (Day 3) — just hide the metrics cards if no data

**Non-negotiables:** Day 2 (real AI), Day 6 (onboarding), Day 9 (deploy), Day 10 (user test).

---

## What this 9-day MVP is NOT (be honest in your launch)

- Single-user, single-browser only
- One LLM provider (Claude)
- Two integrations (Calendar `.ics`, Slack webhook)
- Memory wipes if you clear cookies

Ship it, learn from real users, then build v2 with auth + Postgres + real OAuth.
