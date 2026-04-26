import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTenantSession } from '@/lib/tenant-guard'

export async function GET() {
  const { error, tenantId, tenant, modules } = await getTenantSession({
    requiredModule: 'dashboard',
  })
  if (error) {
    return error
  }

  const scopedTenantId = tenantId!
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    totalCustomers,
    totalVehicles,
    totalProducts,
    totalMechanics,
    totalCategories,
    tenantUsers,
    activeServices,
    completedServicesThisMonth,
    completedServicesLastMonth,
    lowStockProducts,
    recentServices,
    recentActivities,
    servicesByStatus,
    revenueByMonth,
  ] = await Promise.all([
    prisma.customer.count({ where: { tenantId: scopedTenantId } }),
    prisma.vehicle.count({ where: { tenantId: scopedTenantId } }),
    prisma.product.count({ where: { tenantId: scopedTenantId } }),
    prisma.mechanic.count({ where: { tenantId: scopedTenantId, status: 'ACTIVE' } }),
    prisma.category.count({ where: { tenantId: scopedTenantId } }),
    prisma.user.count({ where: { tenantId: scopedTenantId, role: { not: 'SUPER_ADMIN' } } }),
    prisma.service.count({
      where: { tenantId: scopedTenantId, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } },
    }),
    prisma.service.aggregate({
      where: {
        tenantId: scopedTenantId,
        status: 'CONCLUIDO',
        completedDate: { gte: startOfMonth },
      },
      _sum: { totalValue: true },
      _count: true,
    }),
    prisma.service.aggregate({
      where: {
        tenantId: scopedTenantId,
        status: 'CONCLUIDO',
        completedDate: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { totalValue: true },
      _count: true,
    }),
    prisma.product
      .count({
        where: { tenantId: scopedTenantId, stock: { lte: prisma.product.fields.minStock } },
      })
      .catch(() =>
        prisma.$queryRaw<[{ count: bigint }]>`
                    SELECT COUNT(*) as count FROM "Product"
                    WHERE "tenantId" = ${scopedTenantId}
                    AND "minStock" IS NOT NULL
                    AND stock <= "minStock"
                `.then((rows) => Number(rows[0].count))
      ),
    prisma.service.findMany({
      where: { tenantId: scopedTenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: { select: { name: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
      },
    }),
    prisma.activity.findMany({
      where: { tenantId: scopedTenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.service.groupBy({
      by: ['status'],
      where: { tenantId: scopedTenantId },
      _count: true,
    }),
    prisma.$queryRaw<Array<{ month: string; revenue: number; count: bigint }>>`
            SELECT
                TO_CHAR("completedDate", 'YYYY-MM') as month,
                COALESCE(SUM("totalValue"), 0)::float as revenue,
                COUNT(*) as count
            FROM "Service"
            WHERE "tenantId" = ${scopedTenantId}
                AND status = 'CONCLUIDO'
                AND "completedDate" >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
            GROUP BY TO_CHAR("completedDate", 'YYYY-MM')
            ORDER BY month ASC
        `,
  ] as const)

  const revenueThisMonth = completedServicesThisMonth._sum?.totalValue ?? 0
  const revenueLastMonth = completedServicesLastMonth._sum?.totalValue ?? 0
  const revenueGrowth =
    revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0

  const statusLabels: Record<string, string> = {
    PENDENTE: 'Pendente',
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluido',
    CANCELADO: 'Cancelado',
  }

  const statusColors: Record<string, string> = {
    PENDENTE: '#f59e0b',
    EM_ANDAMENTO: '#3b82f6',
    CONCLUIDO: '#10b981',
    CANCELADO: '#ef4444',
  }

  const servicesChartData = servicesByStatus.map((service) => ({
    name: statusLabels[service.status] ?? service.status,
    value: service._count,
    color: statusColors[service.status] ?? '#6b7280',
  }))

  const monthNames = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]
  const revenueChartData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const found = revenueByMonth.find((entry) => entry.month === key)

    return {
      month: monthNames[date.getMonth()],
      revenue: found ? Number(found.revenue) : 0,
      count: found ? Number(found.count) : 0,
    }
  })

  const onboardingSteps = [
    {
      id: 'company',
      title: tenant?.businessType === 'OFICINA' ? 'Dados da oficina' : 'Dados da empresa',
      description:
        'Nome, telefone e endereco precisam estar preenchidos para documentos e atendimento.',
      href: '/dashboard/settings?tab=company',
      cta: 'Completar empresa',
      completed: Boolean(tenant?.name && tenant?.slug && tenant?.phone && tenant?.address),
    },
    {
      id: 'team',
      title: 'Equipe de acesso',
      description: 'Tenha pelo menos um usuario operacional alem do proprietario.',
      href: '/dashboard/settings?tab=employees',
      cta: 'Convidar equipe',
      completed: tenantUsers >= 2,
    },
    {
      id: 'categories',
      title: 'Categorias de servico',
      description: 'Categorias ajudam a organizar OS, relatorios e tipos de manutencao.',
      href: '/dashboard/services',
      cta: 'Revisar servicos',
      completed: !modules?.services || totalCategories > 0,
    },
    {
      id: 'mechanics',
      title: 'Mecanicos',
      description: 'Cadastre quem executa os servicos para acompanhar produtividade e comissoes.',
      href: '/dashboard/oficina/mecanicos',
      cta: 'Cadastrar mecanico',
      completed: !modules?.mechanics || totalMechanics > 0,
    },
    {
      id: 'customers',
      title: 'Primeiro cliente',
      description: 'O primeiro cliente libera o cadastro de veiculo e a primeira OS.',
      href: '/dashboard/customers',
      cta: 'Cadastrar cliente',
      completed: !modules?.customers || totalCustomers > 0,
    },
    {
      id: 'vehicles',
      title: 'Primeiro veiculo',
      description: 'Veiculos conectam cliente, historico e ordens de servico da oficina.',
      href: '/dashboard/oficina/veiculos',
      cta: 'Cadastrar veiculo',
      completed: !modules?.vehicles || totalVehicles > 0,
    },
    {
      id: 'products',
      title: 'Estoque inicial',
      description:
        'Inclua pecas ou materiais recorrentes para controlar estoque desde a primeira OS.',
      href: '/dashboard/products',
      cta: 'Adicionar produto',
      completed: !modules?.products || totalProducts > 0,
      optional: true,
    },
    {
      id: 'service',
      title: 'Primeira OS',
      description: 'Crie uma ordem de servico para validar o fluxo operacional completo.',
      href: '/dashboard/services',
      cta: 'Criar OS',
      completed: !modules?.services || activeServices > 0 || completedServicesThisMonth._count > 0,
    },
  ]

  const visibleOnboardingSteps = onboardingSteps.filter((step) => {
    if (step.id === 'mechanics') return Boolean(modules?.mechanics)
    if (step.id === 'vehicles') return Boolean(modules?.vehicles)
    if (step.id === 'products') return Boolean(modules?.products)
    if (step.id === 'service' || step.id === 'categories') return Boolean(modules?.services)
    if (step.id === 'customers') return Boolean(modules?.customers)
    return true
  })
  const requiredSteps = visibleOnboardingSteps.filter((step) => !step.optional)
  const completedRequired = requiredSteps.filter((step) => step.completed).length
  const onboardingProgress = Math.round((completedRequired / requiredSteps.length) * 100)
  const nextOnboardingStep =
    visibleOnboardingSteps.find((step) => !step.completed && !step.optional) ?? null
  const quickActions =
    tenant?.businessType === 'OFICINA' &&
    (totalCategories === 0 || (Boolean(modules?.products) && totalProducts === 0))
      ? [
          {
            id: 'workshop-starter',
            label: 'Instalar base da oficina',
            description:
              'Cria categorias operacionais e itens iniciais de estoque com quantidade zero.',
            endpoint: '/api/onboarding/workshop-starter',
            method: 'POST' as const,
          },
        ]
      : []

  return NextResponse.json({
    success: true,
    data: {
      onboarding: {
        title:
          tenant?.businessType === 'OFICINA' ? 'Onboarding da oficina' : 'Onboarding do negocio',
        show: onboardingProgress < 100,
        completed: completedRequired,
        total: requiredSteps.length,
        progress: onboardingProgress,
        nextStep: nextOnboardingStep,
        quickActions,
        steps: visibleOnboardingSteps,
      },
      kpis: {
        totalCustomers,
        totalVehicles,
        totalProducts,
        activeServices,
        revenueThisMonth,
        revenueLastMonth,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        completedThisMonth: completedServicesThisMonth._count,
        lowStockProducts: typeof lowStockProducts === 'number' ? lowStockProducts : 0,
      },
      charts: {
        servicesByStatus: servicesChartData,
        revenueByMonth: revenueChartData,
      },
      recentServices: recentServices.map((service) => ({
        id: service.id,
        description: service.description,
        status: service.status,
        type: service.type,
        totalValue: service.totalValue,
        createdAt: service.createdAt,
        customer: service.customer,
        vehicle: service.vehicle,
      })),
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        description: activity.description,
        createdAt: activity.createdAt,
        user: activity.user,
      })),
    },
  })
}
