/**
 * Global Timezone Toggle Composable
 * Provides a single toggle state for all date/time displays across the application
 */

export function useTimezoneToggle() {
  // Global toggle state - false = raw (as stored), true = user timezone
  const isToggled = useState('timezone-toggle', () => false)
  
  const { profile } = useProfile()
  
  // Only allow toggling if user has timezone set
  const hasTimezone = computed(() => {
    return !!profile.value?.timezone
  })
  
  // Computed that returns the effective toggle state (only true if user has timezone)
  const effectiveToggle = computed(() => {
    return hasTimezone.value && isToggled.value
  })
  
  function toggle() {
    if (hasTimezone.value) {
      isToggled.value = !isToggled.value
    }
  }
  
  function setToggled(value: boolean) {
    if (hasTimezone.value) {
      isToggled.value = value
    }
  }
  
  return {
    isToggled: effectiveToggle,
    hasTimezone,
    toggle,
    setToggled
  }
}

