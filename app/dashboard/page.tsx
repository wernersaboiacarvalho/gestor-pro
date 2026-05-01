// app/dashboard/page.tsx
'use client'

import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/ui/stats-card'
import {
  Users,
  Wrench,
  TrendingUp,
  TrendingDown,
  Car,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDashboardStats } from '@/hooks/use-dashboard-query'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCardsSkeleton } from '@/components/ui/card-skeleton'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'
import { OperationalAlertsSummary } from '@/components/dashboard/operational-alerts-summary'

// Helpers
const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  PENDENTE: { label: 'Pendente', variant: 'outline' },
  EM_ANDAMENTO: { label: 'Em Andamento', variant: 'default' },
  CONCLUIDO: { label: 'Concluído', variant: 'secondary' },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' },
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function RevenueTooltip({
  active,
  payload,
  label,
}: {
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

function DashboardContent() {
  const { data: stats, isLoading, isError } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <StatsCardsSkeleton count={4} />
        <StatsCardsSkeleton count={3} />
        <div className="grid gap-4 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[220px] w-full" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[220px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Erro ao carregar estatísticas</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { onboarding, kpis, charts, recentServices, recentActivities } = stats
  const revenueGrowthPositive = kpis.revenueGrowth >= 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <OnboardingChecklist onboarding={onboarding} />

      <OperationalAlertsSummary alerts={stats.operationalAlerts || []} />

      {/* KPIs linha 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total de Clientes" value={kpis.totalCustomers} icon={Users} />
        <StatsCard title="Veículos Cadastrados" value={kpis.totalVehicles} icon={Car} />
        <StatsCard
          title="Serviços Ativos"
          value={kpis.activeServices}
          icon={Wrench}
          description="Pendentes + em andamento"
        />
        <StatsCard title="Concluídos este Mês" value={kpis.completedThisMonth} icon={CheckCircle} />
      </div>

      {/* KPIs linha 2 - financeiro */}
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
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Faturamento dos Últimos 6 Meses</CardTitle>
            <CardDescription>Serviços concluídos por mês</CardDescription>
          </CardHeader>
          <CardContent>
            {charts.revenueByMonth.every((d) => d.revenue === 0) ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
                Nenhum serviço concluído ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={charts.revenueByMonth}
                  margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                >
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

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Serviços por Status</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent>
            {charts.servicesByStatus.every((d) => d.value === 0) ? (
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

      {/* Tabelas */}
      <div className="grid gap-4 lg:grid-cols-7">
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
                  const status = statusConfig[service.status] ?? {
                    label: service.status,
                    variant: 'outline' as const,
                  }
                  return (
                    <div
                      key={service.id}
                      className="flex items-start justify-between gap-2 py-2 border-b last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{service.customer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {service.description}
                        </p>
                        {service.vehicle && (
                          <p className="text-xs text-muted-foreground">
                            {service.vehicle.plate} · {service.vehicle.brand}{' '}
                            {service.vehicle.model}
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
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 py-2 border-b last:border-0"
                  >
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

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
