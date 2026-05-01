'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  ExternalLink,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatters/currency'
import type { Service } from '@/types/service.types'

interface ServiceOperationalAlertsProps {
  services: Service[]
  onFilterChange: (filter: string) => void
  onAttentionFilterChange: (filter: string) => void
}

type AlertTone = 'amber' | 'blue' | 'red' | 'violet'

interface OperationalAlert {
  id: string
  tone: AlertTone
  icon: LucideIcon
  title: string
  description: string
  count: number
  href?: string
  filter?: string
}

const toneClasses: Record<AlertTone, string> = {
  amber: 'border-amber-200 bg-amber-50 text-amber-950',
  blue: 'border-blue-200 bg-blue-50 text-blue-950',
  red: 'border-red-200 bg-red-50 text-red-950',
  violet: 'border-violet-200 bg-violet-50 text-violet-950',
}

const badgeClasses: Record<AlertTone, string> = {
  amber: 'border-amber-300 bg-white text-amber-700',
  blue: 'border-blue-300 bg-white text-blue-700',
  red: 'border-red-300 bg-white text-red-700',
  violet: 'border-violet-300 bg-white text-violet-700',
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function daysSince(value?: string | null) {
  if (!value) return 0

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 0

  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function isOpenService(service: Service) {
  return service.status !== 'CONCLUIDO' && service.status !== 'CANCELADO'
}

function isScheduledOverdue(service: Service) {
  if (!service.scheduledDate || !isOpenService(service)) return false

  const scheduledDate = new Date(service.scheduledDate)
  if (Number.isNaN(scheduledDate.getTime())) return false

  return scheduledDate < startOfToday()
}

function firstServiceHref(services: Service[]) {
  return services[0] ? `/dashboard/services/${services[0].id}` : undefined
}

export function ServiceOperationalAlerts({
  services,
  onFilterChange,
  onAttentionFilterChange,
}: ServiceOperationalAlertsProps) {
  const waitingBudgets = services.filter(
    (service) => service.type === 'ORCAMENTO' && isOpenService(service)
  )
  const overdueScheduled = services.filter(isScheduledOverdue)
  const staleOrders = services.filter(
    (service) =>
      service.type === 'ORDEM_SERVICO' &&
      service.status === 'EM_ANDAMENTO' &&
      daysSince(service.updatedAt || service.createdAt) >= 3
  )
  const thirdPartyPending = services.filter((service) =>
    (service.thirdPartyServices || []).some((item) => item.status !== 'RETORNADO')
  )
  const ordersWithoutChecklist = services.filter(
    (service) =>
      service.type === 'ORDEM_SERVICO' &&
      isOpenService(service) &&
      (service.checklistItems || []).length === 0
  )

  const budgetTotal = waitingBudgets.reduce((sum, service) => sum + service.totalValue, 0)

  const alerts = (
    [
      {
        id: 'budgets',
        tone: 'amber',
        icon: Send,
        title: 'Orcamentos aguardando retorno',
        description: `${formatCurrency(budgetTotal)} em propostas ainda nao aprovadas.`,
        count: waitingBudgets.length,
        href: firstServiceHref(waitingBudgets),
        filter: 'budgets',
      },
      {
        id: 'overdue',
        tone: 'red',
        icon: CalendarClock,
        title: 'Agendamentos vencidos',
        description: 'Servicos abertos com data programada anterior a hoje.',
        count: overdueScheduled.length,
        href: firstServiceHref(overdueScheduled),
        filter: 'overdue',
      },
      {
        id: 'third-party',
        tone: 'violet',
        icon: ExternalLink,
        title: 'Terceirizados pendentes',
        description: 'OS com servicos externos ainda sem retorno para a oficina.',
        count: thirdPartyPending.length,
        href: firstServiceHref(thirdPartyPending),
        filter: 'third-party',
      },
      {
        id: 'checklist',
        tone: 'blue',
        icon: ClipboardCheck,
        title: 'OS sem checklist',
        description: 'Ordens abertas que ainda nao tem tarefas de execucao.',
        count: ordersWithoutChecklist.length,
        href: firstServiceHref(ordersWithoutChecklist),
        filter: 'without-checklist',
      },
      {
        id: 'stale',
        tone: 'amber',
        icon: AlertTriangle,
        title: 'OS paradas ha 3 dias',
        description: 'Servicos em andamento sem atualizacao recente.',
        count: staleOrders.length,
        href: firstServiceHref(staleOrders),
        filter: 'stale',
      },
    ] satisfies OperationalAlert[]
  ).filter((alert) => alert.count > 0)

  if (alerts.length === 0) {
    return (
      <div className="rounded-md border bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
        Operacao sem alertas criticos no momento.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">
          Alertas operacionais
        </h2>
        <Badge variant="outline">{alerts.length} ponto(s) de atencao</Badge>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {alerts.map((alert) => {
          const Icon = alert.icon

          return (
            <div key={alert.id} className={`rounded-md border p-4 ${toneClasses[alert.tone]}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <Badge variant="outline" className={badgeClasses[alert.tone]}>
                        {alert.count}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm opacity-80">{alert.description}</p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {alert.filter && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white/80"
                      onClick={() =>
                        alert.filter === 'budgets'
                          ? onFilterChange('budgets')
                          : onAttentionFilterChange(alert.filter!)
                      }
                    >
                      Filtrar
                    </Button>
                  )}
                  {alert.href && (
                    <Button asChild variant="outline" size="sm" className="bg-white/80">
                      <Link href={alert.href}>Abrir</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
