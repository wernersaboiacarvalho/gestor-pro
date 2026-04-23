// app/api/admin/tenants/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenants = await prisma.tenant.findMany({
        include: {
            _count: {
                select: {
                    users: true,
                    customers: true,
                    services: true,
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return NextResponse.json(tenants)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const tenant = await prisma.tenant.create({
        data: {
            name: body.name,
            slug: body.slug,
            businessType: body.businessType,
            status: body.status || 'TRIAL',
            modules: body.modules || {},
        }
    })

    // Criar atividade de log
    await prisma.activity.create({
        data: {
            action: 'tenant.created',
            description: `Tenant "${tenant.name}" foi criado`,
            tenantId: tenant.id,
            metadata: {
                tenantId: tenant.id,
                businessType: tenant.businessType,
            }
        }
    })

    return NextResponse.json(tenant)
}