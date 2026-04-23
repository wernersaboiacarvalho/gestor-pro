// app/dashboard/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/ui/stats-card'
import {
    Users, Wrench, Package, TrendingUp, TrendingDown,
    Car, AlertTriangle, CheckCircle, Clock, Activity
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
    kpis: {
        totalCustomers: number
        totalVehicles: number
        totalProducts: number
        activeServices: number
        revenueThisMonth: number
        revenueLastMonth: number
        revenueGrowth: number
        completedThisMonth: number
        lowStockProducts: number
    }
    charts: {
        servicesByStatus: Array<{ name: string; value: number; color: string }>
        revenueByMonth: Array<{ month: string; revenue: number; count: number }>
    }
    recentServices: Array<{
        id: string
        description: string
        status: string
        type: string
        totalValue: number
        createdAt: string
        customer: { name: string }
        vehicle: { plate: string; brand: string; model: string } | null
    }>
    recentActivities: Array<{
        id: string
        action: string
        description: string
        createdAt: string
        user: { name: string } | null
    }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    PENDENTE:     { label: 'Pendente',     variant: 'outline' },
    EM_ANDAMENTO: { label: 'Em Andamento', variant: 'default' },
    CONCLUIDO:    { label: 'Concluído',    variant: 'secondary' },
    CANCELADO:    { label: 'Cancelado',    variant: 'destructive' },
}

function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Custom Tooltip para o gráfico de barras ─────────────────────────────────

function RevenueTooltip({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number }>
    label?: string
}) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
            <p className="font-medium mb-1">{label}</p>
            <p className="text-green-600">{formatCurrency(payload[0].value)}</p>
        </div>
    )
}

// ─── Conteúdo principal ───────────────────────────────────────────────────────

function DashboardContent() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/dashboard/stats')
                const data = await res.json()
                if (data.success) {
                    setStats(data.data)
                } else {
                    setError('Erro ao carregar estatísticas')
                }
            } catch {
                setError('Erro de conexão')
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Visão geral do seu negócio</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <div className="h-16 bg-muted animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (error || !stats) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">{error ?? 'Erro desconhecido'}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { kpis, charts, recentServices, recentActivities } = stats
    const revenueGrowthPositive = kpis.revenueGrowth >= 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Visão geral do seu negócio</p>
            </div>

            {/* KPIs — linha 1: métricas principais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total de Clientes"
                    value={kpis.totalCustomers}
                    icon={Users}
                />
                <StatsCard
                    title="Veículos Cadastrados"
                    value={kpis.totalVehicles}
                    icon={Car}
                />
                <StatsCard
                    title="Serviços Ativos"
                    value={kpis.activeServices}
                    icon={Wrench}
                    description="Pendentes + em andamento"
                />
                <StatsCard
                    title="Concluídos este Mês"
                    value={kpis.completedThisMonth}
                    icon={CheckCircle}
                />
            </div>

            {/* KPIs — linha 2: financeiro + estoque */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                    title="Faturamento do Mês"
                    value={formatCurrency(kpis.revenueThisMonth)}
                    icon={revenueGrowthPositive ? TrendingUp : TrendingDown}
                    trend={revenueGrowthPositive ? 'up' : 'down'}
                    trendValue={`${revenueGrowthPositive ? '+' : ''}${kpis.revenueGrowth}% vs mês anterior`}
                />
                <StatsCard
                    title="Faturamento Mês Anterior"
                    value={formatCurrency(kpis.revenueLastMonth)}
                    icon={TrendingUp}
                />
                <StatsCard
                    title="Estoque Baixo"
                    value={kpis.lowStockProducts}
                    icon={AlertTriangle}
                    variant={kpis.lowStockProducts > 0 ? 'destructive' : 'default'}
                    description={kpis.lowStockProducts > 0 ? 'Produtos abaixo do mínimo' : 'Estoque saudável'}
                />
            </div>

            {/* Gráficos */}
            <div className="grid gap-4 lg:grid-cols-7">

                {/* Gráfico de barras — Faturamento mensal */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Faturamento dos Últimos 6 Meses</CardTitle>
                        <CardDescription>Serviços concluídos por mês</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {charts.revenueByMonth.every(d => d.revenue === 0) ? (
                            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                                Nenhum serviço concluído ainda
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={charts.revenueByMonth} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 12 }}
                                        className="fill-muted-foreground"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        className="fill-muted-foreground"
                                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                                        width={50}
                                    />
                                    <Tooltip content={<RevenueTooltip />} />
                                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Gráfico de pizza — Serviços por status */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Serviços por Status</CardTitle>
                        <CardDescription>Distribuição atual</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {charts.servicesByStatus.every(d => d.value === 0) || charts.servicesByStatus.length === 0 ? (
                            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                                Nenhum serviço cadastrado ainda
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={charts.servicesByStatus}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {charts.servicesByStatus.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} serviços`, '']} />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => <span className="text-xs">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabelas — Últimos serviços + Atividades recentes */}
            <div className="grid gap-4 lg:grid-cols-7">

                {/* Últimos serviços */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Últimos Serviços</CardTitle>
                        <CardDescription>Os 5 serviços mais recentes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentServices.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                Nenhum serviço cadastrado ainda.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {recentServices.map((service) => {
                                    const status = statusConfig[service.status] ?? { label: service.status, variant: 'outline' as const }
                                    return (
                                        <div key={service.id} className="flex items-start justify-between gap-2 py-2 border-b last:border-0">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{service.customer.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                                                {service.vehicle && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {service.vehicle.plate} · {service.vehicle.brand} {service.vehicle.model}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <Badge variant={status.variant} className="text-xs">
                                                    {status.label}
                                                </Badge>
                                                <span className="text-xs font-medium text-green-600">
                                                    {formatCurrency(service.totalValue)}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Atividades recentes */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Atividades Recentes</CardTitle>
                        <CardDescription>Últimas ações no sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentActivities.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                Nenhuma atividade recente.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                                        <div className="mt-0.5 p-1.5 bg-muted rounded-full shrink-0">
                                            <Activity className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-foreground leading-snug truncate">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {activity.user?.name ?? 'Sistema'} ·{' '}
                                                {formatDistanceToNow(new Date(activity.createdAt), {
                                                    addSuffix: true,
                                                    locale: ptBR,
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// ─── Export com Suspense (obrigatório no Next.js 15) ──────────────────────────

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    )
}