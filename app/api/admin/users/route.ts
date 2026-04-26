import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.trim()
  const role = searchParams.get('role')?.trim()
  const tenantId = searchParams.get('tenantId')?.trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0)

  const where = {
    ...(role && role !== 'all' ? { role: role as never } : {}),
    ...(tenantId && tenantId !== 'all' ? { tenantId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { tenant: { name: { contains: search, mode: 'insensitive' as const } } },
            { tenant: { slug: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [users, total, tenants, usersByRole, usersByTenant] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            businessType: true,
          },
        },
        _count: {
          select: {
            services: true,
            activities: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.user.count({ where }),
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: true,
    }),
    prisma.user.groupBy({
      by: ['tenantId'],
      where: { tenantId: { not: null } },
      _count: true,
      orderBy: {
        _count: {
          tenantId: 'desc',
        },
      },
      take: 5,
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      users,
      tenants,
      stats: {
        total,
        superAdmins: usersByRole.find((item) => item.role === 'SUPER_ADMIN')?._count ?? 0,
        owners: usersByRole.find((item) => item.role === 'OWNER')?._count ?? 0,
        admins: usersByRole.find((item) => item.role === 'ADMIN')?._count ?? 0,
        employees: usersByRole.find((item) => item.role === 'EMPLOYEE')?._count ?? 0,
        usersByRole,
        usersByTenant,
      },
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    },
  })
}
