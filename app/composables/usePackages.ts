/**
 * Packages Composable
 * Fetches active packages from Directus
 */

interface Package {
  id: string
  label: string
  slug: string
  sessions_per_week: number
  weeks_per_cycle: number
  session_duration_min: number
  lemon_variant_id: string | null
  is_active: boolean
}

export function usePackages() {
  const { getItems } = useDirectusItems()

  const packages = ref<Package[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPackages(): Promise<Package[]> {
    isLoading.value = true
    error.value = null

    try {
      const data = await getItems<Package>({
        collection: 'packages',
        params: {
          filter: {
            is_active: { _eq: true }
          }
        }
      })

      packages.value = data || []
      return packages.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch packages'
      return []
    } finally {
      isLoading.value = false
    }
  }

  function getPackageById(id: string): Package | undefined {
    return packages.value.find(p => p.id === id)
  }

  /**
   * Calculate total sessions for a package
   */
  function getTotalSessions(pkg: Package): number {
    return pkg.sessions_per_week * pkg.weeks_per_cycle
  }

  return {
    packages,
    isLoading,
    error,
    fetchPackages,
    getPackageById,
    getTotalSessions
  }
}

