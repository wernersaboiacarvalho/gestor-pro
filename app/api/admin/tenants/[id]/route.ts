// app/api/admin/tenants/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
            users: true,
            _count: {
                select: {
                    customers: true,
                    services: true,
                    products: true,
                }
            }
        }
    })

    return NextResponse.json(tenant)
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const tenant = await prisma.tenant.update({
        where: { id },
        data: body
    })

    await prisma.activity.create({
        data: {
            action: 'tenant.updated',
            description: `Tenant "${tenant.name}" foi atualizado`,
            tenantId: tenant.id,
        }
    })

    return NextResponse.json(tenant)
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.tenant.delete({
        where: { id }
    })

    return NextResponse.json({ success: true })
}