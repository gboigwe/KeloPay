// API Utility Functions
// Consistent response formatting and error handling

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Standard success response
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

/**
 * Standard error response
 */
export function errorResponse(
  message: string,
  status: number = 400,
  errors?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errors,
    },
    { status }
  )
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return errorResponse(
      'Validation failed',
      400,
      error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    )
  }

  // Prisma errors
  if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
    return errorResponse('Database error', 500)
  }

  // Generic errors
  if (error instanceof Error) {
    return errorResponse(error.message, 500)
  }

  return errorResponse('An unexpected error occurred', 500)
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: Request) {
  // TODO: Implement after NextAuth setup
  // For now, return null (will be replaced with actual user)
  return null
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: string[]) {
  return requiredRoles.includes(userRole)
}
