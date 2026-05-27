# Redesign patterns & code reference

Concrete, copy-ready code for each phase of the `saas-ui-redesign` skill. The `SKILL.md`
spine references these snippets by section; hand the relevant section to `vue-expert` in each
delegation. All component code uses **Vue 3 Composition API + `<script setup>`** and **scoped
styles**, per `client/CLAUDE.md`. **No emojis** — icons are inline SVG.

> Tokens referenced below (`var(--…)`) are defined in `reference/tokens.css`, copied to
> `client/src/assets/theme.css` in Phase A. They inherit into scoped blocks for free.

---

## Phase A — token layer + locale

1. Copy `reference/tokens.css` → `client/src/assets/theme.css` (verbatim).
2. In `client/src/main.js`, add as the **first** line so tokens exist at first paint:

```js
import './assets/theme.css'
```

3. In `App.vue`'s global `<style>`, change `body` to use the token:

```css
body {
  font-family: var(--font-family-base);
  background: var(--color-bg);
  color: var(--color-text);
}
```

4. Add the missing nav label key (the nav currently hardcodes the raw literal "Reports"):

```js
// client/src/locales/en.js  → inside the `nav` object
reports: 'Reports',
// client/src/locales/ja.js  → inside the `nav` object
reports: 'レポート',
```

**Verify:** the app renders byte-for-byte the same; `t('nav.reports')` resolves.

---

## Phase B — app shell (sidebar)

### B1. `App.vue` template

```vue
<template>
  <div class="app">
    <aside class="sidebar" :class="{ collapsed: isCollapsed, open: isMobileOpen }">
      <div class="sidebar-brand">
        <h1 class="brand-full">{{ t('nav.companyName') }}</h1>
        <span class="brand-mark">{{ brandInitials }}</span>
        <span class="subtitle">{{ t('nav.subtitle') }}</span>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-item"
          :title="t(link.labelKey)"
        >
          <NavIcon :name="link.icon" class="nav-icon" />
          <span class="nav-label">{{ t(link.labelKey) }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <LanguageSwitcher />
        <ProfileMenu
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
        <button class="collapse-toggle" :title="isCollapsed ? 'Expand' : 'Collapse'" @click="toggleCollapsed">
          <NavIcon :name="isCollapsed ? 'chevron-right' : 'chevron-left'" />
        </button>
      </div>
    </aside>

    <div class="sidebar-overlay" v-if="isMobileOpen" @click="closeMobile"></div>

    <div class="content-col">
      <FilterBar />
      <main class="main-content">
        <router-view />
      </main>
    </div>

    <ProfileDetailsModal :is-open="showProfileDetails" @close="showProfileDetails = false" />
    <TasksModal
      :is-open="showTasks" :tasks="tasks"
      @close="showTasks = false" @add-task="addTask"
      @delete-task="deleteTask" @toggle-task="toggleTask"
    />
  </div>
</template>
```

### B2. `App.vue` script — data-driven nav

Replaces the 6 hardcoded `<router-link>`s + manual `:class="{active: $route.path===…}"`:

```js
const navLinks = [
  { to: '/',          labelKey: 'nav.overview',       icon: 'grid' },
  { to: '/inventory', labelKey: 'nav.inventory',      icon: 'box' },
  { to: '/orders',    labelKey: 'nav.orders',         icon: 'cart' },
  { to: '/spending',  labelKey: 'nav.finance',        icon: 'dollar' },
  { to: '/demand',    labelKey: 'nav.demandForecast', icon: 'chart' },
  { to: '/reports',   labelKey: 'nav.reports',        icon: 'document' },
]
// brandInitials: computed monogram shown when the sidebar is collapsed
```

### B3. `App.vue` shell CSS (global `<style>`)

```css
.app { display: flex; flex-direction: row; min-height: 100vh; }

.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  transition: width 0.2s ease;
}
.sidebar-brand { padding: var(--space-6) var(--space-5); }
.sidebar-brand h1 { font-size: var(--font-2xl); font-weight: var(--weight-bold); color: var(--color-text); }
.sidebar-brand .subtitle { font-size: var(--font-sm); color: var(--color-text-muted); }
.sidebar-brand .brand-mark { display: none; }   /* shown only when collapsed (Phase C) */

.sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); padding: 0 var(--space-3); }

.nav-item {
  position: relative;
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-2-5) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--font-md); font-weight: var(--weight-medium);
  text-decoration: none;
  transition: var(--transition-base);
}
.nav-item:hover { color: var(--color-text); background: var(--color-slate-200); }
.nav-icon { width: 20px; height: 20px; flex-shrink: 0; }

/* Active = LEFT accent bar (replaces the old bottom ::after underline).
   MUST be router-link-exact-active: router-link-active would mark "/" (Overview)
   active on every route because "/" is a prefix of all paths. */
.nav-item.router-link-exact-active { color: var(--color-primary); background: var(--color-primary-bg); }
.nav-item.router-link-exact-active::before {
  content: ''; position: absolute; left: 0; top: 6px; bottom: 6px;
  width: 3px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--color-primary);
}

.sidebar-footer {
  margin-top: auto;
  display: flex; flex-direction: column; gap: var(--space-2);
  padding: var(--space-4) var(--space-3);
  border-top: 1px solid var(--color-border);
  overflow: visible;   /* let dropdowns escape upward */
}

.content-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }  /* min-width:0 stops flex blow-out from wide tables */
.main-content {
  flex: 1;
  max-width: var(--content-max-width);
  width: 100%; margin: 0 auto;
  padding: var(--space-6) var(--space-8);
}
```

### B4. `components/icons/NavIcon.vue`

Presentational, keeps the `v-for` clean and avoids `v-html`. Stroke style matches the existing
icons in `ProfileMenu`/`LanguageSwitcher` (20×20, `stroke="currentColor"`, `stroke-width:1.5`,
`fill:none`), so active/hover colors apply via `currentColor`.

```vue
<script setup>
defineProps({ name: { type: String, required: true } })
// Map name -> SVG path `d` string(s). Provide: grid, box, cart, dollar, chart, document,
// chevron-left, chevron-right, menu. Use simple 24-viewBox line-icon paths.
const paths = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8',
  cart: 'M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20a1 1 0 100 2 1 1 0 000-2zM18 20a1 1 0 100 2 1 1 0 000-2z',
  dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  chart: 'M3 3v18h18M7 14l4-4 4 4 5-6',
  document: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6',
  'chevron-left': 'M15 18l-6-6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  menu: 'M3 12h18M3 6h18M3 18h18',
}
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[name]" />
  </svg>
</template>
```

### B5. Re-anchor the two dropdowns (`ProfileMenu.vue`, `LanguageSwitcher.vue`)

They currently open **down** (`top: calc(100% + 0.5rem); right: 0`) — built for a top bar. At the
sidebar bottom that opens off-screen. Flip to open **upward**:

```css
.dropdown-menu {
  bottom: calc(100% + 0.5rem);
  top: auto;
  left: 0;
  z-index: var(--z-dropdown);
}
```

When the sidebar is **collapsed** (64px) the dropdown must escape the narrow rail — give it a
fixed `min-width` (e.g. 220px) so it overflows to the right, or `Teleport to="body"` it.
**Preserve** `ProfileMenu`'s `defineEmits(['show-profile-details','show-tasks'])` wiring — App.vue
still turns those into modals.

**Verify B:** all 6 routes show the sidebar; exact-active highlight correct per route; FilterBar
still sticky; both dropdowns open and are not clipped.

---

## Phase C — collapsible + responsive

### C1. `composables/useSidebar.js` (singleton, mirrors `useFilters`/`useI18n`)

```js
import { ref } from 'vue'

// Module-scope refs => shared singleton across App shell, FilterBar hamburger, footer toggle.
const isCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
const isMobileOpen = ref(false)

export function useSidebar() {
  const toggleCollapsed = () => {
    isCollapsed.value = !isCollapsed.value
    localStorage.setItem('sidebar-collapsed', String(isCollapsed.value))
  }
  const toggleMobile = () => { isMobileOpen.value = !isMobileOpen.value }
  const closeMobile = () => { isMobileOpen.value = false }
  return { isCollapsed, isMobileOpen, toggleCollapsed, toggleMobile, closeMobile }
}
```

In `App.vue setup`, close the drawer on navigation:

```js
import { useRoute } from 'vue-router'
import { watch } from 'vue'
const route = useRoute()
watch(() => route.path, () => closeMobile())
```

### C2. Desktop collapse-to-icons (global CSS)

```css
.sidebar.collapsed { width: var(--sidebar-width-collapsed); }
.sidebar.collapsed .nav-label,
.sidebar.collapsed .subtitle,
.sidebar.collapsed .brand-full { display: none; }
.sidebar.collapsed .brand-mark { display: block; }   /* monogram */
.sidebar.collapsed .nav-item { justify-content: center; padding: var(--space-2-5); }
.sidebar.collapsed .sidebar-brand { text-align: center; padding: var(--space-5) 0; }
/* keep title="" tooltips on .nav-item for hover labels when collapsed */
```

### C3. Mobile drawer + overlay (breakpoint 768px — fixed constant; media queries can't read CSS vars)

```css
@media (max-width: 768px) {
  .sidebar {
    position: fixed; left: 0; top: 0; bottom: 0; height: 100vh;
    transform: translateX(-100%); z-index: var(--z-sidebar);
    transition: transform 0.2s ease;
  }
  .sidebar.open { transform: translateX(0); }
  .sidebar-overlay {
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
    z-index: var(--z-sidebar-overlay);
  }
}
@media (min-width: 769px) {
  .sidebar-overlay { display: none; }
}
```

### C4. Hamburger trigger in `FilterBar.vue`

The top bar is gone, so put the menu button at the left of `.filters-container`:

```vue
<button class="mobile-menu-btn" @click="toggleMobile" aria-label="Open menu">
  <NavIcon name="menu" />
</button>
```
```css
.mobile-menu-btn { display: none; }
@media (max-width: 768px) { .mobile-menu-btn { display: inline-flex; } }
```

**Verify C:** desktop collapse persists across reload; at 390px the sidebar is hidden, hamburger
opens the drawer, overlay dims content, tapping overlay or navigating closes it.

---

## Phase D — card + grid unification

### D1. Canonical primitives → move into `theme.css`

Reconciles the App/Reports/Inventory/Dashboard forks into one definition (border + subtle shadow,
12px radius, 1.5rem padding):

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--space-6);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow-sm);
}
.card--flush { padding: 0; }                 /* full-bleed table cards (Inventory) */
.card--compact { padding: var(--space-4); }  /* KPI density */
.card-header {
  display: flex; justify-content: space-between; align-items: center; gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}
.card-title { font-size: var(--font-lg); font-weight: var(--weight-bold); color: var(--color-text); margin: 0; }
.stat-card { /* inherits .card; keep token-based .stat-value accents */ }
```

Also move `.badge` + variants, the global `table` rules, `.loading`, `.error` into `theme.css`,
retokenized. Badge variants map to status tokens, e.g.:

```css
.badge.success { background: var(--color-success-bg); color: var(--color-success-text); }
.badge.warning { background: var(--color-warning-bg); color: var(--color-warning-text); }
.badge.danger  { background: var(--color-danger-bg);  color: var(--color-danger-text); }
.badge.info    { background: var(--color-info-bg);    color: var(--color-info-text); }
```

### D2. DELETE the forked declarations (do not merely override — see gotcha)

- `views/Reports.vue`: `.card`, `.card-header`, `.card-title`, `.stat-card`/`.stat-label`/
  `.stat-value`, and its off-palette `.badge*` (uses `#dcfce7/#166534/#fef3c7/#fee2e2`). Keep only
  Reports-specific chart/table CSS.
- `views/Inventory.vue`: `.card-header`, `.card-title`. Mark its table card `class="card card--flush"`.
- `views/Dashboard.vue`: strip `background/border/border-radius/padding` from `.kpi-card`; change
  markup to `class="card card--compact kpi-card"`, keep only `.kpi-*` inner styles. Chart cards
  already use the global `.card`.
- `views/Backlog.vue` (orphan, no route): sweep so it stays valid; uses global classes already.

### D3. Normalize grids

Replace bespoke `grid-template-columns: repeat(auto-fit, minmax(Npx,1fr))` with the `.card-grid`
utility; set the tier via `--grid-min` (default 280; `card-grid--wide` 320 for Demand;
`card-grid--chart` 450 for Spending). KPI grids may use `style="--grid-min:240px"`.

**Verify D (per view):** cards visually consistent (radius/padding/shadow); badges unified; no
view regressed.

---

## Phase E — shared modal

### E1. `components/BaseModal.vue`

All **6** modals (`ProductDetailModal`, `BacklogDetailModal`, `InventoryDetailModal`,
`CostDetailModal`, `ProfileDetailsModal`, `TasksModal`) duplicate the same Teleport + Transition +
overlay + container + header/close + footer. Extract it (dedups JS and markup, not just CSS):

```vue
<script setup>
defineProps({
  isOpen: { type: Boolean, default: false },
  title: { type: String, default: '' },
  maxWidth: { type: String, default: '600px' },
})
defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="$emit('close')">
        <div class="modal-container" :style="{ maxWidth }" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="close-button" aria-label="Close" @click="$emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                   stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div class="modal-body"><slot /></div>
          <div class="modal-footer" v-if="$slots.footer"><slot name="footer" /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: var(--z-modal); padding: var(--space-4);
}
.modal-container {
  background: var(--color-surface); border-radius: var(--radius-xl);
  box-shadow: var(--shadow-modal); width: 100%; max-height: 90vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-border);
}
.modal-title { font-size: var(--font-lg); font-weight: var(--weight-bold); color: var(--color-text); }
.close-button { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: var(--space-1); }
.close-button svg { width: 20px; height: 20px; }
.modal-body { padding: var(--space-6); overflow-y: auto; }
.modal-footer { padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-border); }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
```

### E2. Migrate each modal

```vue
<BaseModal :is-open="isOpen" :title="t('...')" @close="$emit('close')">
  <!-- existing body markup -->
  <template #footer>
    <!-- existing footer buttons -->
  </template>
</BaseModal>
```

`TasksModal` passes its wider value via `:max-width="'720px'"` (replaces its bespoke
`tasks-modal-container`). Migrate one modal at a time — each is independently verifiable.

**Verify E:** each modal opens/closes via button + overlay click; body + footer intact; Teleport
preserved so nothing is clipped by the new `.content-col`/sticky FilterBar stacking contexts.

---

## Phase F — polish

- Swap the ~5 hardcoded chart series hexes to `var(--chart-*)`. CSS-defined gradient stops swap
  cleanly; SVG `fill="#..."`/`stroke="#..."` **attributes** in templates need `:fill="'var(--chart-1)'"`
  or a CSS class — fiddly, gate on screenshots for legibility.
- Delete now-dead `.top-nav` / `.nav-tabs*` / `.nav-container` CSS from `App.vue`.
- `grep -rn "max-width: *1600" client/src` and replace any stragglers with `var(--content-max-width)`.

**Verify F:** charts legible; `grep -rn "\.card\s*{" client/src/views` returns nothing (all forks
gone); no orphan styles.
