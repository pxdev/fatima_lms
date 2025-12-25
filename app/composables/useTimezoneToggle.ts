/**
 * Global Timezone Toggle Composable
 * Uses the profile's use_timezone field instead of global state
 * The toggle is now managed in the profile page
 */

export function useTimezoneToggle() {
  const { profile } = useProfile()
  
  // Only allow timezone conversion if user has timezone set
  const hasTimezone = computed(() => {
    return !!profile.value?.timezone
  })
  
  // Use profile's use_timezone field (defaults to true if not set)
  // This replaces the global toggle state - the toggle is now in the profile page
  const isToggled = computed(() => {
    if (!hasTimezone.value) return false
    // Default to true if use_timezone is not set (for backward compatibility)
    return profile.value?.use_timezone !== false
  })
  
  return {
    isToggled,
    hasTimezone
  }
}

