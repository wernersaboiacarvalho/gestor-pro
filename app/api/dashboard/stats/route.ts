// app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tenantId) {
        return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
    }

    const tenantId = session.user.tenantId

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Queries paralelas
    const [
        totalCustomers,
        totalVehicles,
        totalProducts,
        activeServices,
        completedServicesThisMonth,
        completedServicesLastMonth,
        lowStockProducts,
        recentServices,
        recentActivities,
        servicesByStatus,
        revenueByMonth,
    ] = await Promise.all([
        // KPIs básicos
        prisma.customer.count({ where: { tenantId } }),
        prisma.vehicle.count({ where: { tenantId } }),
        prisma.product.count({ where: { tenantId } }),
        prisma.service.count({ where: { tenantId, status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } } }),

        // Faturamento mês atual vs anterior
        prisma.service.aggregate({
            where: { tenantId, status: 'CONCLUIDO', completedDate: { gte: startOfMonth } },
            _sum: { totalValue: true },
            _count: true,
        }),
        prisma.service.aggregate({
            where: { tenantId, status: 'CONCLUIDO', completedDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
            _sum: { totalValue: true },
            _count: true,
        }),

        // Estoque baixo
        prisma.product.count({
            where: { tenantId, stock: { lte: prisma.product.fields.minStock } }
        }).catch(() =>
            // fallback: conta onde stock <= minStock usando raw approach
            prisma.$queryRaw<[{ count: bigint }]>`
                SELECT COUNT(*) as count FROM "Product"
                WHERE "tenantId" = ${tenantId}
                AND "minStock" IS NOT NULL
                AND stock <= "minStock"
            `.then(r => Number(r[0].count))
        ),

        // Últimos 5 serviços
        prisma.service.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                customer: { select: { name: true } },
                vehicle: { select: { plate: true, brand: true, model: true } },
            },
        }),

        // Últimas 5 atividades
        prisma.activity.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { user: { select: { name: true } } },
        }),

        // Serviços agrupados por status (para gráfico pizza)
        prisma.service.groupBy({
            by: ['status'],
            where: { tenantId },
            _count: true,
        }),

        // Faturamento dos últimos 6 meses (para gráfico de barras)
        prisma.$queryRaw<Array<{ month: string; revenue: number; count: bigint }>>`
            SELECT
                TO_CHAR("completedDate", 'YYYY-MM') as month,
                COALESCE(SUM("totalValue"), 0)::float as revenue,
                COUNT(*) as count
            FROM "Service"
            WHERE "tenantId" = ${tenantId}
                AND status = 'CONCLUIDO'
                AND "completedDate" >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
            GROUP BY TO_CHAR("completedDate", 'YYYY-MM')
            ORDER BY month ASC
        `,
    ])

    // Calcular variação de receita mês a mês
    const revenueThisMonth = completedServicesThisMonth._sum.totalValue ?? 0
    const revenueLastMonth = completedServicesLastMonth._sum.totalValue ?? 0
    const revenueGrowth = revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : 0

    // Formatar dados dos gráficos
    const statusLabels: Record<string, string> = {
        PENDENTE: 'Pendente',
        EM_ANDAMENTO: 'Em Andamento',
        CONCLUIDO: 'Concluído',
        CANCELADO: 'Cancelado',
    }

    const statusColors: Record<string, string> = {
        PENDENTE: '#f59e0b',
        EM_ANDAMENTO: '#3b82f6',
        CONCLUIDO: '#10b981',
        CANCELADO: '#ef4444',
    }

    const servicesChartData = servicesByStatus.map(s => ({
        name: statusLabels[s.status] ?? s.status,
        value: s._count,
        color: statusColors[s.status] ?? '#6b7280',
    }))

    // Preencher meses sem dados nos últimos 6 meses
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const revenueChartData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const found = revenueByMonth.find(r => r.month === key)
        return {
            month: monthNames[d.getMonth()],
            revenue: found ? Number(found.revenue) : 0,
            count: found ? Number(found.count) : 0,
        }
    })

    return NextResponse.json({
        success: true,
        data: {
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
            recentServices: recentServices.map(s => ({
                id: s.id,
                description: s.description,
                status: s.status,
                type: s.type,
                totalValue: s.totalValue,
                createdAt: s.createdAt,
                customer: s.customer,
                vehicle: s.vehicle,
            })),
            recentActivities: recentActivities.map(a => ({
                id: a.id,
                action: a.action,
                description: a.description,
                createdAt: a.createdAt,
                user: a.user,
            })),
        },
    })
}