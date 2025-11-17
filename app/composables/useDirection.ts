export function useDirection() {
    const nuxtApp = tryUseNuxtApp()

    if (!nuxtApp) {
        throw new Error('useDirection must be called within a Vue component or Nuxt context')
    }

    const { t, locale } = useI18n();

    const isRTL = computed(() => {
        return locale.value === 'ar'
    })

    return {
        t,
        isRTL,
    }
}
