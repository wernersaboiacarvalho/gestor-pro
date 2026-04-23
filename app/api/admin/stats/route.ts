// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
        totalTenants,
        activeTenants,
        totalUsers,
        totalCustomers,
        recentActivities
    ] = await Promise.all([
        prisma.tenant.count(),
        prisma.tenant.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: { not: 'SUPER_ADMIN' } } }),
        prisma.customer.count(),
        prisma.activity.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                tenant: true,
                user: true,
            }
        })
    ])

    const tenantsByType = await prisma.tenant.groupBy({
        by: ['businessType'],
        _count: true
    })

    const tenantsByStatus = await prisma.tenant.groupBy({
        by: ['status'],
        _count: true
    })

    return NextResponse.json({
        totalTenants,
        activeTenants,
        totalUsers,
        totalCustomers,
        tenantsByType,
        tenantsByStatus,
        recentActivities
    })
}