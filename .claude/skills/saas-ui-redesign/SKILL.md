---
name: saas-ui-redesign
description: Redesigns this Vue 3 app's UI into a modern SaaS interface — left vertical sidebar nav, design tokens, consistent spacing, and unified card/modal primitives. Use this skill when asked to modernize, restyle, add a sidebar, or convert the frontend to a SaaS-style layout.
---

# SaaS UI Redesign

Transforms the Factory Inventory Management frontend (`client/`) from its current top-nav layout
into a modern SaaS interface: a **left vertical navigation sidebar**, a **design-token layer**,
**consistent 4/8px spacing**, **one unified card primitive**, **one shared modal**, and a
**collapsible + responsive** shell. The end state keeps the app's existing muted slate/blue
identity but raises the craft and consistency.

This skill is an **orchestrator**. It does not hand-edit `.vue` files itself — it drives the work
through the `vue-expert` subagent in safe, ordered phases, verifying with Playwright between each.

## When to use

Trigger when the user asks to: modernize / restyle / "make it look professional", add a sidebar or
side navigation, replace the top nav, or convert the frontend to a SaaS-style layout.

**Preconditions:**
- Both servers running (`/start` → frontend `:3000`, backend `:8001`).
- Work on a throwaway branch (`/demo-branch`) — this touches most of `client/src`.
- Read `reference/tokens.css` and `reference/patterns.md` (next to this file) before starting;
  they hold the exact token block and per-phase code. Hand the relevant section to `vue-expert`
  in each delegation.

## Non-negotiables

- ❌ **Never edit `.vue` files directly.** Per the repo's CLAUDE.md, **all** `.vue` create/modify
  MUST go through the **`vue-expert`** subagent (Task tool). This skill plans and delegates.
- ❌ **No emojis in the UI.** Navigation/menu icons are inline SVG (`NavIcon.vue`), `currentColor`.
- ✅ **Structure & style only.** Never change data fetching, API calls, computed logic, or
  component behavior. The redesign is purely presentational.
- ✅ **Token-first.** All new styling uses `var(--…)` tokens from `client/src/assets/theme.css`.
  Don't reintroduce hardcoded hexes or off-grid spacing.
- ✅ **Composition API + `<script setup>` + scoped styles** for every new/edited component.

## Design principles

- **Keep the system, raise the polish.** The off-the-shelf `frontend-design` plugin pushes bold,
  distinctive aesthetics and away from generic palettes — borrow its *craft* (rhythm, hierarchy,
  spacing discipline, considered states) but **keep this repo's muted slate/blue system**. Where
  they conflict, the repo's identity wins.
- **One source of truth.** Color, spacing, radius, shadow, type, and layout widths live as tokens
  in `theme.css`. Cards and modals each have exactly one definition.
- **Left-sidebar IA.** Primary nav is a vertical sidebar (brand top, nav middle, profile/language
  bottom). Active state is a left accent bar, not a bottom underline.
- **Strict 4/8px spacing** via `--space-*`. Retire the off-grid one-offs (`0.4rem`, `0.313rem`,
  and font sizes leaking into padding).

## Execution plan

Six phases, each a single coherent `vue-expert` delegation followed by a verify gate. Do them in
order — A is inert (proves the token layer changes nothing), and later phases depend on earlier
ones. Full code for every phase is in `reference/patterns.md` (sections "Phase A"…"Phase F").

| Phase | Goal | Key files | Verify gate |
|---|---|---|---|
| **A** | Token layer + locale (zero visual change) | `assets/theme.css` (new), `main.js`, `App.vue` body, `locales/{en,ja}.js` | App renders identically; `nav.reports` resolves |
| **B** | App shell → sidebar | `App.vue`, `icons/NavIcon.vue` (new), `FilterBar.vue`, `ProfileMenu.vue`, `LanguageSwitcher.vue` | All 6 routes show sidebar; correct exact-active; dropdowns open |
| **C** | Collapsible + responsive | `composables/useSidebar.js` (new), `App.vue`, `FilterBar.vue` | Desktop collapse persists; mobile drawer + overlay + close-on-nav |
| **D** | Unify cards + grids | `theme.css`, `views/{Reports,Inventory,Dashboard,Backlog}.vue`, grid sites | Cards consistent; badges unified; no regressions |
| **E** | Shared modal | `components/BaseModal.vue` (new) + the 6 modals | Each modal opens/closes; footer/width intact |
| **F** | Polish | chart series colors, dead `.top-nav` CSS | Charts legible; no orphan styles |

Re-capture the Playwright screenshot set after every **visual** phase (B, C, D, E) and compare to
baseline (see Verification).

## vue-expert delegation protocol

One delegation per phase. Each delegation brief MUST include:

1. **The phase goal** and the exact files to touch (from the table + `reference/patterns.md`).
2. **The code/snippets** for that phase — paste the relevant `reference/patterns.md` section and,
   for Phase A, the contents of `reference/tokens.css`.
3. **The guardrails verbatim:** "Structure/style only — do not change data, API calls, or
   component behavior. Use Composition API + `<script setup>` + scoped styles. Use tokens from
   `client/src/assets/theme.css`; no hardcoded hexes. No emojis — inline SVG icons only."
4. **An explicit Playwright instruction** when the phase is visual — `vue-expert` only runs
   Playwright *when told*. E.g.: "After editing, with the dev server at http://localhost:3000,
   use `mcp__playwright__*` to screenshot routes /, /inventory, /orders, /spending, /demand,
   /reports at 1440×900 and 390×844, and report what changed vs. the baseline."

Delegation skeleton:

```
Task → subagent: vue-expert
Goal: <phase goal>. Files: <list>.
Apply exactly these changes: <paste reference/patterns.md "Phase X" section>.
Guardrails: structure/style only; Composition API + <script setup> + scoped styles;
tokens from assets/theme.css; no hardcoded hexes; no emojis (inline SVG icons).
Then verify with Playwright: <screenshot/checklist instruction>. Report diffs vs baseline.
```

## Playwright verification

**Baseline (before any change):** confirm servers up; have `vue-expert` (it owns
`mcp__playwright__*`) navigate and screenshot all six routes — `/`, `/inventory`, `/orders`,
`/spending`, `/demand`, `/reports` — at **1440×900** and **390×844**, plus one open detail modal,
the ProfileMenu dropdown, the LanguageSwitcher dropdown, and the app in `日本語`. Stable names
(`baseline-overview-desktop.png`, …).

**After each visual phase**, re-capture the same set and check:
- All 6 nav links in the sidebar; correct **exact-active** highlight per route; "Reports" translates.
- No horizontal overflow; content not hidden behind the sidebar; centered max-width column intact.
- FilterBar sticky at the top of the content column; selects still work.
- Desktop collapse: icons-only, labels/subtitle hidden, hover tooltips, content reflows; **persists on reload**.
- Mobile 390px: sidebar hidden; hamburger opens drawer; overlay dims; tap-overlay/navigate closes; no overlap.
- Cards consistent (12px radius / 1.5rem padding / subtle shadow) across Dashboard, Reports,
  Inventory, Spending, Demand; badges unified.
- Modals center with overlay + close + footer; ProfileMenu/LanguageSwitcher dropdowns open
  **upward** from the sidebar bottom and aren't clipped (esp. when collapsed).

Backend `pytest` is unaffected (client-only change) — run `/test` if a full regression is wanted.

## Gotchas

- **Scoped-specificity trap (#1).** A view's scoped `.card` compiles to `.card[data-v-xxxx]`,
  which **beats** the global token `.card`. You must **delete** forked declarations, not just add
  the global one. After Phase D: `grep -rn "\.card\s*{" client/src/views` must return nothing.
  (Custom properties *do* inherit into scoped blocks, so tokens work everywhere without imports.)
- **Active matching:** use `.router-link-exact-active`, never `.router-link-active` — `/` is a
  prefix of every route and would light up Overview on all pages.
- **Add `nav.reports`** to both `en.js` and `ja.js`; the data-driven `t('nav.reports')` shows the
  raw key if missing (and this fixes the existing hardcoded "Reports" literal).
- **Dropdown re-anchoring.** ProfileMenu/LanguageSwitcher dropdowns are built to open downward
  (`top: calc(100%+0.5rem); right:0`). At the sidebar bottom, flip to open **upward**
  (`bottom: calc(100%+0.5rem); top:auto; left:0`); keep `.sidebar-footer { overflow: visible }`,
  and when collapsed give the dropdown a fixed `min-width` (or Teleport it) so it escapes the rail.
  Preserve ProfileMenu's `@show-profile-details`/`@show-tasks` → App.vue modal wiring.
- **Keep modals `Teleport to="body"`.** The new `.content-col` + sticky FilterBar create stacking
  contexts; without Teleport a modal can be clipped.
- **Orphan `Backlog.vue`** has no route but uses global classes — include it in the Phase D sweep
  so it stays valid. (`BacklogDetailModal.vue` *is* used by Dashboard — migrate it in Phase E.)
  Adding a `/backlog` nav entry is out of scope.
- **Breakpoint 768px is a fixed constant** — CSS media queries can't read CSS variables.
- **Chart series colors** are partly inline SVG attributes — retokenizing them is fiddly; defer to
  Phase F and gate on screenshots for legibility.

## Key reminders

- Delegate every `.vue` edit to **`vue-expert`**; never edit `.vue` files from this skill.
- Go phase by phase; **verify before advancing**. Phase A must produce zero visual diff.
- Tokens first, then structure, then behavior, then unify, then polish.
- No emojis. No behavior/data/API changes. Keep the slate/blue identity.
- The exact code lives in `reference/patterns.md` + `reference/tokens.css` — use it, don't improvise.
