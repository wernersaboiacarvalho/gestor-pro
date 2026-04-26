import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MODULE_CATALOG } from '@/lib/tenancy/module-catalog'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const [tenants, settingsCount, usersWithoutTenant, expiredTrials, modulesInUse] =
    await Promise.all([
      prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          businessType: true,
          trialEndsAt: true,
          maxUsers: true,
          maxCustomers: true,
          modules: true,
          settings: {
            select: {
              modulesEnabled: true,
            },
          },
          _count: {
            select: {
              users: true,
              customers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.setting.count(),
      prisma.user.count({
        where: {
          tenantId: null,
          role: { not: 'SUPER_ADMIN' },
        },
      }),
      prisma.tenant.count({
        where: {
          status: 'TRIAL',
          trialEndsAt: { lt: now },
        },
      }),
      prisma.tenant.findMany({
        select: {
          modules: true,
          settings: {
            select: {
              modulesEnabled: true,
            },
          },
        },
      }),
    ])

  const tenantsWithoutSettings = tenants.filter((tenant) => !tenant.settings).length
  const tenantsNearLimits = tenants.filter((tenant) => {
    const usersNearLimit = tenant.maxUsers > 0 && tenant._count.users / tenant.maxUsers >= 0.8
    const customersNearLimit =
      tenant.maxCustomers > 0 && tenant._count.customers / tenant.maxCustomers >= 0.8

    return usersNearLimit || customersNearLimit
  }).length

  const moduleUsage = Object.keys(MODULE_CATALOG).map((key) => ({
    key,
    label: MODULE_CATALOG[key as keyof typeof MODULE_CATALOG].label,
    tenants: modulesInUse.filter((tenant) => {
      const tenantModules = tenant.modules as Record<string, boolean> | null
      const settingsModules = tenant.settings?.modulesEnabled as Record<string, boolean> | null
      return Boolean(settingsModules?.[key] ?? tenantModules?.[key])
    }).length,
  }))

  const checks = [
    {
      key: 'settings',
      label: 'Configuracoes por tenant',
      status: tenantsWithoutSettings === 0 ? 'ok' : 'warning',
      description:
        tenantsWithoutSettings === 0
          ? 'Todos os tenants possuem registro de configuracao.'
          : `${tenantsWithoutSettings} tenant(s) ainda nao possuem configuracao dedicada.`,
    },
    {
      key: 'trial',
      label: 'Trials expirados',
      status: expiredTrials === 0 ? 'ok' : 'danger',
      description:
        expiredTrials === 0
          ? 'Nenhum trial expirado pendente de acao.'
          : `${expiredTrials} trial(s) expirado(s) precisam de revisao.`,
    },
    {
      key: 'users-without-tenant',
      label: 'Usuarios sem tenant',
      status: usersWithoutTenant === 0 ? 'ok' : 'warning',
      description:
        usersWithoutTenant === 0
          ? 'Nao existem usuarios operacionais soltos fora de tenant.'
          : `${usersWithoutTenant} usuario(s) sem tenant associado.`,
    },
    {
      key: 'limits',
      label: 'Capacidade dos tenants',
      status: tenantsNearLimits === 0 ? 'ok' : 'warning',
      description:
        tenantsNearLimits === 0
          ? 'Nenhum tenant esta proximo dos limites configurados.'
          : `${tenantsNearLimits} tenant(s) estao acima de 80% de uso.`,
    },
  ]

  return NextResponse.json({
    success: true,
    data: {
      checks,
      moduleUsage,
      totals: {
        tenants: tenants.length,
        settings: settingsCount,
        usersWithoutTenant,
        expiredTrials,
        tenantsNearLimits,
      },
    },
  })
}
