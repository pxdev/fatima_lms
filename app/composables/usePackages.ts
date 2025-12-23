/**
 * Packages Composable
 * Fetches active packages from Directus
 */

interface Package {
  id: string
  label: string
  slug: string
  description: string | null    // Brief package description
  sessions_per_week: number
  weeks_per_cycle: number
  session_duration_min: number
  price: number                 // Price in cents/smallest currency unit
  currency: string              // Currency code (e.g., 'USD', 'SAR')
  price_per_session: number | null  // Calculated or manual per-session price
  discount_percent: number | null   // Show "Save X%" badge
  is_recommended: boolean       // Highlight as "Recommended"
  is_popular: boolean           // Show "Most Popular" badge
  features: string[] | null     // List of included features
  sort: number | null           // Display order
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
          },
          sort: ['sort', 'price']
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

  /**
   * Format price for display
   */
  function formatPrice(pkg: Package): string {
    const price = (pkg.price || 0) / 100 // Convert from cents
    const currency = pkg.currency || 'USD'
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  /**
   * Calculate price per session
   */
  function getPricePerSession(pkg: Package): string {
    const totalSessions = getTotalSessions(pkg)
    if (totalSessions === 0) return '-'
    
    const pricePerSession = (pkg.price || 0) / 100 / totalSessions
    const currency = pkg.currency || 'USD'
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(pricePerSession)
  }

  return {
    packages,
    isLoading,
    error,
    fetchPackages,
    getPackageById,
    getTotalSessions,
    formatPrice,
    getPricePerSession
  }
}

