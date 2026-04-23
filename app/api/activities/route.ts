// app/api/activities/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { ActivityService } from '@/lib/services/activity.service'

// GET /api/activities
export const GET = withErrorHandling(async (request: Request) => {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.tenantId) {
        throw new AppError({
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Usuário não autenticado ou sem tenant',
            statusCode: 401,
        })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')
    const action = searchParams.get('action') || undefined

    const activities = await ActivityService.listByTenant(session.user.tenantId, {
        limit: Math.min(limit, 100),
        skip,
    })

    // Filtra por action se especificado
    const filteredActivities = action
        ? activities.filter(a => a.action === action)
        : activities

    const total = await ActivityService.countByTenant(session.user.tenantId)

    return NextResponse.json({
        success: true,
        data: {
            activities: filteredActivities,
            pagination: {
                total,
                limit: Math.min(limit, 100),
                skip,
                hasMore: skip + Math.min(limit, 100) < total,
            },
        },
    })
})