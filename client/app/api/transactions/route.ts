// Transactions List API
// Returns paginated transaction history with filtering

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError } from '@/lib/api/utils'
import { z } from 'zod'
import { TransactionType, TransactionStatus } from '@prisma/client'

// Query parameters schema
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  network: z.string().optional(),
  userId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const params = querySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      network: searchParams.get('network') || undefined,
      userId: searchParams.get('userId') || undefined,
    })

    // Build where clause
    const where: any = {}
    if (params.type) where.type = params.type
    if (params.status) where.status = params.status
    if (params.network) where.network = params.network
    if (params.userId) where.userId = params.userId

    // Get total count
    const total = await prisma.transaction.count({ where })

    // Calculate pagination
    const skip = (params.page - 1) * params.limit
    const pages = Math.ceil(total / params.limit)

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip,
      take: params.limit,
    })

    // Format response
    return successResponse({
      transactions,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages,
      },
    })

  } catch (error) {
    return handleApiError(error)
  }
}
