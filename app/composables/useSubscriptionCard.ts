/**
 * Subscription Card Utilities
 * Shared logic for subscription card components
 */

import type { Subscription } from './useSubscriptions'

export type SubscriptionStatus = 
  | 'draft'
  | 'pending_payment'
  | 'payment_received'
  | 'teacher_assigned'
  | 'active'
  | 'completed'
  | 'cancelled'

export interface StatusConfig {
  label: string
  icon: string
  color: string
  bg: string
  border: string
  description: string
}

export const STATUS_CONFIG: Record<SubscriptionStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    icon: 'i-heroicons-banknotes',
    color: 'amber',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    description: 'Complete your payment to activate your subscription and start learning.'
  },
  pending_payment: {
    label: 'Pending Payment',
    icon: 'i-heroicons-arrow-path',
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    description: 'Please complete your payment in the checkout window. This page will update automatically.'
  },
  payment_received: {
    label: 'Payment Received',
    icon: 'i-heroicons-check-badge',
    color: 'green',
    bg: 'bg-green-50',
    border: 'border-green-200',
    description: 'Your payment has been received. An admin will assign a teacher to you shortly.'
  },
  teacher_assigned: {
    label: 'Teacher Assigned',
    icon: 'i-heroicons-user-plus',
    color: 'primary',
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    description: 'Great news! Your teacher has been assigned. You can now schedule your sessions.'
  },
  active: {
    label: 'Active',
    icon: 'i-heroicons-rocket-launch',
    color: 'primary',
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    description: 'Your subscription is active and sessions are ready. Start learning!'
  },
  completed: {
    label: 'Completed',
    icon: 'i-heroicons-trophy',
    color: 'success',
    bg: 'bg-green-50',
    border: 'border-green-200',
    description: 'Congratulations! You\'ve completed all sessions. Ready to continue your learning journey?'
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'i-heroicons-x-circle',
    color: 'error',
    bg: 'bg-red-50',
    border: 'border-red-200',
    description: 'This subscription has been cancelled.'
  }
}

export function useSubscriptionCard() {
  const { getStatusColor } = useSubscriptions()
  const { getCourseById } = useCourses()
  const { getPackageById } = usePackages()

  /**
   * Get status configuration
   */
  function getStatusConfig(status: SubscriptionStatus | string): StatusConfig {
    return STATUS_CONFIG[status as SubscriptionStatus] || {
      label: status.replace(/_/g, ' '),
      icon: 'i-heroicons-book-open',
      color: 'neutral',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      description: 'Subscription status'
    }
  }

  /**
   * Calculate sessions progress
   */
  function getSessionsProgress(subscription: Subscription) {
    const completed = subscription.sessions_total - subscription.sessions_remaining
    const total = subscription.sessions_total
    return {
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total
    }
  }

  /**
   * Get course for subscription
   */
  function getSubscriptionCourse(subscription: Subscription) {
    // If course is already an object (expanded), return it
    if (typeof subscription.course === 'object' && subscription.course !== null) {
      return subscription.course as { id: string; label: string }
    }
    // Otherwise, look it up by ID
    return getCourseById(subscription.course as string)
  }

  /**
   * Get package for subscription
   */
  function getSubscriptionPackage(subscription: Subscription) {
    // If package is already an object (expanded), return it
    if (typeof subscription.package === 'object' && subscription.package !== null) {
      return subscription.package as { id: string; label: string }
    }
    // Otherwise, look it up by ID
    return getPackageById(subscription.package as string)
  }

  return {
    getStatusConfig,
    getSessionsProgress,
    getSubscriptionCourse,
    getSubscriptionPackage,
    getStatusColor
  }
}

