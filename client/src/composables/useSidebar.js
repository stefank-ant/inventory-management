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
