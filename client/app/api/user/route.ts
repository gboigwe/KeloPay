// User API - Get or create user from wallet address
// Integrates with Reown AppKit wallet authentication

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

// Request body schema
const userSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  email: z.string().email().optional(),
  socialProvider: z.string().optional(),
})

/**
 * GET /api/user - Get user by wallet address
 * Query: ?address=0x...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')

    if (!address) {
      return errorResponse('Wallet address is required', 400)
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return errorResponse('Invalid wallet address format', 400)
    }

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        role: true,
        socialProvider: true,
        kycStatus: true,
        region: true,
        merchantId: true,
        merchantName: true,
        createdAt: true,
      },
    })

    if (!user) {
      return errorResponse('User not found', 404)
    }

    return successResponse(user)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/user - Create or update user
 * Body: { walletAddress, email?, socialProvider? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = userSchema.parse(body)

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { walletAddress: data.walletAddress.toLowerCase() },
    })

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: data.email || user.email,
          socialProvider: data.socialProvider || user.socialProvider,
        },
        select: {
          id: true,
          walletAddress: true,
          email: true,
          role: true,
          socialProvider: true,
          kycStatus: true,
          region: true,
          merchantId: true,
          merchantName: true,
          createdAt: true,
        },
      })

      return successResponse(user)
    }

    // Create new user with default role
    user = await prisma.user.create({
      data: {
        walletAddress: data.walletAddress.toLowerCase(),
        email: data.email,
        socialProvider: data.socialProvider,
        role: UserRole.USER, // Default role
      },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        role: true,
        socialProvider: true,
        kycStatus: true,
        region: true,
        merchantId: true,
        merchantName: true,
        createdAt: true,
      },
    })

    return successResponse(user, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
