// Alchemy Webhook Endpoint
// Receives blockchain transaction events from Alchemy

import { NextRequest } from 'next/server'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { parseAlchemyWebhook, processTransaction } from '@/lib/blockchain/processor'
import crypto from 'crypto'

/**
 * POST /api/webhooks/alchemy
 * Receives transaction events from Alchemy webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook body
    const body = await request.text()
    const payload = JSON.parse(body)

    // Verify webhook signature
    const signature = request.headers.get('x-alchemy-signature')
    if (!verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature')
      return errorResponse('Invalid signature', 401)
    }

    console.log('✅ Webhook signature verified')
    console.log('📥 Received webhook:', payload.type)

    // Parse webhook payload
    const transactionData = parseAlchemyWebhook(payload)
    if (!transactionData) {
      return errorResponse('Invalid webhook payload', 400)
    }

    // Process and store transaction
    const transaction = await processTransaction(transactionData)

    console.log(`✅ Transaction ${transaction.txHash} processed`)

    return successResponse(
      {
        processed: true,
        txHash: transaction.txHash,
        transactionId: transaction.id,
      },
      200
    )
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return handleApiError(error)
  }
}

/**
 * GET /api/webhooks/alchemy
 * Health check endpoint
 */
export async function GET() {
  return successResponse({
    status: 'healthy',
    service: 'alchemy-webhook',
    timestamp: new Date().toISOString(),
  })
}

/**
 * Verify Alchemy webhook signature
 * Ensures the webhook actually came from Alchemy
 */
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  // Get webhook signing key from environment
  const signingKey = process.env.ALCHEMY_WEBHOOK_SECRET

  if (!signingKey) {
    console.warn('⚠️ ALCHEMY_WEBHOOK_SECRET not set - skipping signature verification')
    return true // Allow in development (but warn)
  }

  if (!signature) {
    return false
  }

  try {
    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', signingKey)
    hmac.update(body)
    const digest = hmac.digest('hex')

    // Compare signatures (constant-time comparison to prevent timing attacks)
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  } catch (error) {
    console.error('Error verifying signature:', error)
    return false
  }
}
