/**
 * Throttled Action Composable
 * Provides rate-limited action execution with loading state
 * Uses VueUse's useThrottleFn for rate limiting
 */

import { useThrottleFn } from '@vueuse/core'

interface ThrottledActionOptions {
  /** Throttle delay in milliseconds (default: 1000ms) */
  throttleMs?: number
  /** Callback on success */
  onSuccess?: () => void
  /** Callback on error */
  onError?: (error: any) => void
}

/**
 * Creates a throttled action with loading state management
 * Prevents rapid repeated submissions and provides loading feedback
 * 
 * @example
 * const { execute, isLoading } = useThrottledAction(async () => {
 *   await $fetch('/api/submit', { method: 'POST', body: data })
 * }, { throttleMs: 1000 })
 * 
 * // In template: @submit="execute" :loading="isLoading"
 */
export function useThrottledAction<T = void>(
  action: () => Promise<T>,
  options: ThrottledActionOptions = {}
) {
  const { throttleMs = 1000, onSuccess, onError } = options

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const executeAction = async (): Promise<T | undefined> => {
    // Prevent concurrent executions
    if (isLoading.value) return undefined

    isLoading.value = true
    error.value = null

    try {
      const result = await action()
      onSuccess?.()
      return result
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Action failed'
      onError?.(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Throttle the action to prevent rapid repeated calls
  const execute = useThrottleFn(executeAction, throttleMs, false)

  return {
    /** Execute the throttled action */
    execute,
    /** Whether the action is currently executing */
    isLoading: readonly(isLoading),
    /** Last error message if any */
    error: readonly(error),
    /** Clear the error */
    clearError: () => { error.value = null }
  }
}

/**
 * Creates a throttled form submit handler
 * Specifically designed for form submissions with validation
 * 
 * @example
 * const { handleSubmit, isSubmitting } = useThrottledSubmit(
 *   async (data) => {
 *     await $fetch('/api/submit', { method: 'POST', body: data })
 *   },
 *   { throttleMs: 1000 }
 * )
 * 
 * // In template: @submit="handleSubmit"
 */
export function useThrottledSubmit<TData = any>(
  submitFn: (data: TData) => Promise<void>,
  options: ThrottledActionOptions = {}
) {
  const { throttleMs = 1000, onSuccess, onError } = options

  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)

  const doSubmit = async (event: { data: TData }) => {
    // Prevent concurrent submissions
    if (isSubmitting.value) return

    isSubmitting.value = true
    submitError.value = null

    try {
      await submitFn(event.data)
      onSuccess?.()
    } catch (err: any) {
      submitError.value = err?.data?.statusMessage || err?.data?.message || err?.message || 'Submission failed'
      onError?.(err)
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  // Throttle submissions
  const handleSubmit = useThrottleFn(doSubmit, throttleMs, false)

  return {
    /** Throttled submit handler for UForm @submit */
    handleSubmit,
    /** Whether form is currently submitting */
    isSubmitting: readonly(isSubmitting),
    /** Last submission error */
    submitError: readonly(submitError),
    /** Clear the error */
    clearError: () => { submitError.value = null }
  }
}

/**
 * Creates a throttled click handler for buttons
 * 
 * @example
 * const { onClick, isLoading } = useThrottledClick(async () => {
 *   await deleteItem(id)
 * })
 * 
 * // In template: @click="onClick" :loading="isLoading"
 */
export function useThrottledClick(
  clickFn: () => Promise<void>,
  options: ThrottledActionOptions = {}
) {
  const { execute, isLoading, error, clearError } = useThrottledAction(clickFn, options)

  return {
    onClick: execute,
    isLoading,
    error,
    clearError
  }
}

