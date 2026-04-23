// app/api/admin/activities/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'

// GET /api/admin/activities
export const GET = withErrorHandling(async (request: Request) => {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        throw new AppError({
            code: ERROR_CODES.FORBIDDEN,
            message: 'Acesso restrito ao Super Admin',
            statusCode: 403,
        })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')
    const tenantId = searchParams.get('tenantId') || undefined
    const action = searchParams.get('action') || undefined

    const where: Record<string, unknown> = {}
    if (tenantId) where.tenantId = tenantId
    if (action) where.action = action

    const activities = await prisma.activity.findMany({
        where,
        include: {
            tenant: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100), // Máximo 100 por requisição
        skip,
    })

    const total = await prisma.activity.count({ where })

    return NextResponse.json({
        success: true,
        data: {
            activities,
            pagination: {
                total,
                limit: Math.min(limit, 100),
                skip,
                hasMore: skip + Math.min(limit, 100) < total,
            },
        },
    })
})