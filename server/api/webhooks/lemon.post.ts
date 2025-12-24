/**
 * Lemon Squeezy Webhook Handler
 * Handles payment events from Lemon Squeezy
 */

import crypto from 'crypto'

interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string
    custom_data?: {
      subscription_id?: string
      student_profile_id?: string
    }
  }
  data: {
    id: string
    attributes: {
      status: string
      first_order_item?: {
        variant_id: number
      }
      customer_id: number
      order_number: number
    }
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<LemonSqueezyWebhookPayload>(event)
  const rawBody = await readRawBody(event)
  
  // Get signature from headers
  const signature = getHeader(event, 'x-signature')
  const webhookSecret = config.lemonWebhookSecret

  // TODO: Implement proper signature verification when LEMON_WEBHOOK_SECRET is set
  if (webhookSecret && signature) {
    const hmac = crypto.createHmac('sha256', webhookSecret)
    const digest = hmac.update(rawBody || '').digest('hex')
    
    if (signature !== digest) {
      console.error('[Lemon Webhook] Invalid signature')
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid signature'
      })
    }
  } else {
    console.warn('[Lemon Webhook] WARNING: Signature verification skipped - LEMON_WEBHOOK_SECRET not configured')
  }

  // Extract event details
  const eventName = body.meta.event_name
  const customData = body.meta.custom_data
  const subscriptionId = customData?.subscription_id
  const lemonSubscriptionId = body.data.id

  console.log(`[Lemon Webhook] Received event: ${eventName}`)
  console.log(`[Lemon Webhook] Subscription ID: ${subscriptionId}`)

  // Only process order_created or subscription_created events
  if (!['order_created', 'subscription_created'].includes(eventName)) {
    return { received: true, processed: false, reason: 'Event type not handled' }
  }

  if (!subscriptionId) {
    console.error('[Lemon Webhook] Missing subscription_id in custom_data')
    return { received: true, processed: false, reason: 'Missing subscription_id' }
  }

  if (!config.directusAdminToken) {
    console.error('[Lemon Webhook] DIRECTUS_ADMIN_TOKEN not configured')
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error'
    })
  }

  if (!config.public.directus.url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server configuration error: Directus URL missing'
    })
  }

  const directusUrl = config.public.directus.url
  const adminToken = config.directusAdminToken

  try {
    // Update subscription status to payment_received
    await $fetch(`${directusUrl}/items/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: {
        status: 'payment_received',
        lemon_subscription_id: lemonSubscriptionId
      }
    })

    console.log(`[Lemon Webhook] Successfully updated subscription ${subscriptionId} to payment_received`)

    return {
      received: true,
      processed: true,
      subscription_id: subscriptionId,
      status: 'payment_received'
    }
  } catch (err: any) {
    console.error('[Lemon Webhook] Error updating subscription:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update subscription'
    })
  }
})

