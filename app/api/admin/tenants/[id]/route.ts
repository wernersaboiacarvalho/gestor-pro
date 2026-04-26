import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resolveTenantModules } from '@/lib/tenancy/business-templates'
import { CORE_TENANT_MODULES } from '@/lib/tenancy/module-catalog'

const updateTenantSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL']).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  domain: z.string().trim().max(120).optional().nullable(),
  maxUsers: z.number().int().min(1).max(1000).optional(),
  maxCustomers: z.number().int().min(1).max(100000).optional(),
  trialEndsAt: z.string().datetime().optional().nullable(),
  modules: z.record(z.boolean()).optional(),
})

function normalizeOptionalString(value?: string | null) {
  return value?.trim() ? value.trim() : null
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      settings: {
        select: {
          modulesEnabled: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          users: true,
          customers: true,
          services: true,
          products: true,
          vehicles: true,
          transactions: true,
        },
      },
    },
  })

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const modules = resolveTenantModules(
    tenant.businessType,
    tenant.modules as Record<string, boolean> | null,
    tenant.settings?.modulesEnabled as Record<string, boolean> | null
  )

  return NextResponse.json({
    ...tenant,
    modules,
    usage: {
      users: {
        current: tenant._count.users,
        limit: tenant.maxUsers,
        percentage:
          tenant.maxUsers > 0 ? Math.round((tenant._count.users / tenant.maxUsers) * 100) : 0,
      },
      customers: {
        current: tenant._count.customers,
        limit: tenant.maxCustomers,
        percentage:
          tenant.maxCustomers > 0
            ? Math.round((tenant._count.customers / tenant.maxCustomers) * 100)
            : 0,
      },
    },
    isTrialExpired:
      tenant.status === 'TRIAL' && tenant.trialEndsAt
        ? tenant.trialEndsAt.getTime() < Date.now()
        : false,
  })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = updateTenantSchema.parse(await req.json())
  const modules = body.modules ? { ...body.modules } : undefined

  if (modules) {
    for (const moduleKey of CORE_TENANT_MODULES) {
      modules[moduleKey] = true
    }
  }

  const tenant = await prisma.tenant.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.phone !== undefined ? { phone: normalizeOptionalString(body.phone) } : {}),
      ...(body.address !== undefined ? { address: normalizeOptionalString(body.address) } : {}),
      ...(body.domain !== undefined ? { domain: normalizeOptionalString(body.domain) } : {}),
      ...(body.maxUsers !== undefined ? { maxUsers: body.maxUsers } : {}),
      ...(body.maxCustomers !== undefined ? { maxCustomers: body.maxCustomers } : {}),
      ...(body.trialEndsAt !== undefined
        ? { trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : null }
        : {}),
      ...(modules ? { modules } : {}),
    },
  })

  if (modules) {
    await prisma.setting.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        modulesEnabled: modules,
      },
      update: {
        modulesEnabled: modules,
      },
    })
  }

  await prisma.activity.create({
    data: {
      action: 'tenant.updated',
      description: `Tenant "${tenant.name}" foi atualizado`,
      tenantId: tenant.id,
    },
  })

  return NextResponse.json(tenant)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  await prisma.tenant.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
