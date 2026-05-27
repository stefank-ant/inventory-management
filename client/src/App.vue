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
        <button
          class="collapse-toggle"
          :title="isCollapsed ? 'Expand' : 'Collapse'"
          @click="toggleCollapsed"
        >
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

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import { useSidebar } from './composables/useSidebar'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import NavIcon from './components/icons/NavIcon.vue'

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher,
    NavIcon
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const route = useRoute()
    const {
      isCollapsed,
      isMobileOpen,
      toggleCollapsed,
      closeMobile
    } = useSidebar()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Close the mobile drawer whenever the route changes
    watch(() => route.path, () => closeMobile())

    // Data-driven sidebar nav (maps to the 6 routes)
    const navLinks = [
      { to: '/',          labelKey: 'nav.overview',       icon: 'grid' },
      { to: '/inventory', labelKey: 'nav.inventory',      icon: 'box' },
      { to: '/orders',    labelKey: 'nav.orders',         icon: 'cart' },
      { to: '/spending',  labelKey: 'nav.finance',        icon: 'dollar' },
      { to: '/demand',    labelKey: 'nav.demandForecast', icon: 'chart' },
      { to: '/reports',   labelKey: 'nav.reports',        icon: 'document' },
    ]

    // Monogram shown when the sidebar is collapsed (Phase C)
    const brandInitials = computed(() => {
      return t('nav.companyName')
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    })

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    onMounted(loadTasks)

    return {
      t,
      navLinks,
      brandInitials,
      isCollapsed,
      isMobileOpen,
      toggleCollapsed,
      closeMobile,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family-base);
  background: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  display: flex;
  flex-direction: row;
  min-height: 100vh;
}

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

.sidebar-brand {
  padding: var(--space-6) var(--space-5);
}

.sidebar-brand h1 {
  font-size: var(--font-2xl);
  font-weight: var(--weight-bold);
  color: var(--color-text);
  letter-spacing: -0.025em;
}

.sidebar-brand .subtitle {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-sm);
  color: var(--color-text-muted);
}

.sidebar-brand .brand-mark {
  display: none; /* shown only when collapsed (Phase C) */
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: 0 var(--space-3);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2-5) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--font-md);
  font-weight: var(--weight-medium);
  text-decoration: none;
  transition: var(--transition-base);
}

.nav-item:hover {
  color: var(--color-text);
  background: var(--color-slate-200);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Active = LEFT accent bar. MUST be router-link-exact-active: router-link-active
   would mark "/" (Overview) active on every route since "/" prefixes all paths. */
.nav-item.router-link-exact-active {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.nav-item.router-link-exact-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--color-primary);
}

.sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-3);
  border-top: 1px solid var(--color-border);
  overflow: visible; /* let dropdowns escape upward */
}

.collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2);
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: var(--transition-base);
}

.collapse-toggle:hover {
  color: var(--color-text);
  background: var(--color-slate-200);
  border-color: var(--color-border-strong);
}

.collapse-toggle svg {
  width: 18px;
  height: 18px;
}

.content-col {
  flex: 1;
  min-width: 0; /* stops flex blow-out from wide tables */
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: var(--content-max-width);
  width: 100%;
  margin: 0 auto;
  padding: var(--space-6) var(--space-8);
}

/* ---- Phase C2: desktop collapse-to-icons --------------------------------- */
.sidebar.collapsed {
  width: var(--sidebar-width-collapsed);
}

.sidebar.collapsed .nav-label,
.sidebar.collapsed .subtitle,
.sidebar.collapsed .brand-full {
  display: none;
}

.sidebar.collapsed .brand-mark {
  display: block; /* monogram */
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: var(--space-2-5);
}

.sidebar.collapsed .sidebar-brand {
  text-align: center;
  padding: var(--space-5) 0;
}
/* keep title="" tooltips on .nav-item for hover labels when collapsed */

/* ---- Phase C3: mobile drawer + overlay ----------------------------------- */
/* 768px is a fixed constant — media queries can't read CSS custom properties. */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    height: 100vh;
    transform: translateX(-100%);
    z-index: var(--z-sidebar);
    transition: transform 0.2s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: var(--z-sidebar-overlay);
  }
}

@media (min-width: 769px) {
  .sidebar-overlay {
    display: none;
  }
}
</style>
