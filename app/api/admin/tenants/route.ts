import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  buildTenantModules,
  getBusinessTemplate,
  resolveTenantModules,
} from '@/lib/tenancy/business-templates'
import { CORE_TENANT_MODULES } from '@/lib/tenancy/module-catalog'

const createTenantSchema = z.object({
  name: z.string().trim().min(3).max(100),
  slug: z.string().trim().min(3).max(100),
  businessType: z.enum(['OFICINA', 'RESTAURANTE', 'ACADEMIA', 'GENERICO']),
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

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenants = await prisma.tenant.findMany({
    include: {
      settings: {
        select: {
          modulesEnabled: true,
        },
      },
      _count: {
        select: {
          users: true,
          customers: true,
          services: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return NextResponse.json(
    tenants.map((tenant) => ({
      ...tenant,
      resolvedModules: resolveTenantModules(
        tenant.businessType,
        tenant.modules as Record<string, boolean> | null,
        tenant.settings?.modulesEnabled as Record<string, boolean> | null
      ),
      usage: {
        users: {
          current: tenant._count.users,
          limit: tenant.maxUsers,
        },
        customers: {
          current: tenant._count.customers,
          limit: tenant.maxCustomers,
        },
      },
      isTrialExpired:
        tenant.status === 'TRIAL' && tenant.trialEndsAt
          ? tenant.trialEndsAt.getTime() < Date.now()
          : false,
    }))
  )
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = createTenantSchema.parse(await req.json())
  const template = getBusinessTemplate(body.businessType)
  const modules = {
    ...buildTenantModules(body.businessType),
    ...(body.modules ?? {}),
  }

  for (const moduleKey of CORE_TENANT_MODULES) {
    modules[moduleKey] = true
  }

  const tenant = await prisma.$transaction(async (tx) => {
    const createdTenant = await tx.tenant.create({
      data: {
        name: body.name,
        slug: body.slug,
        businessType: body.businessType,
        status: body.status || 'TRIAL',
        phone: normalizeOptionalString(body.phone),
        address: normalizeOptionalString(body.address),
        domain: normalizeOptionalString(body.domain),
        maxUsers: body.maxUsers ?? 5,
        maxCustomers: body.maxCustomers ?? 100,
        modules,
        trialEndsAt: body.trialEndsAt
          ? new Date(body.trialEndsAt)
          : (body.status || 'TRIAL') === 'TRIAL'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : null,
      },
    })

    await tx.category.createMany({
      data: template.defaultCategories.map((category) => ({
        ...category,
        tenantId: createdTenant.id,
      })),
    })

    await tx.setting.create({
      data: {
        tenantId: createdTenant.id,
        modulesEnabled: modules,
      },
    })

    return createdTenant
  })

  await prisma.activity.create({
    data: {
      action: 'tenant.created',
      description: `Tenant "${tenant.name}" foi criado`,
      tenantId: tenant.id,
      metadata: {
        tenantId: tenant.id,
        businessType: tenant.businessType,
      },
    },
  })

  return NextResponse.json(tenant)
}
