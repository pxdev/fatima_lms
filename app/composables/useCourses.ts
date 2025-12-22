/**
 * Courses Composable
 * Fetches active courses from Directus
 */

interface Course {
  id: string
  label: string
  slug: string
  description: string | null
  level: string | null
  sort: number | null
  is_active: boolean
}

export function useCourses() {
  const { getItems } = useDirectusItems()

  const courses = ref<Course[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCourses(): Promise<Course[]> {
    isLoading.value = true
    error.value = null

    try {
      const data = await getItems<Course>({
        collection: 'courses',
        params: {
          filter: {
            is_active: { _eq: true }
          },
          sort: ['sort']
        }
      })

      courses.value = data || []
      return courses.value
    } catch (err: any) {
      error.value = err?.data?.errors?.[0]?.message || err?.message || 'Failed to fetch courses'
      return []
    } finally {
      isLoading.value = false
    }
  }

  function getCourseById(id: string): Course | undefined {
    return courses.value.find(c => c.id === id)
  }

  return {
    courses,
    isLoading,
    error,
    fetchCourses,
    getCourseById
  }
}

