'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters/currency'

interface OperationalAlertItem {
  id: string
  href: string
  customerName: string
  vehicleLabel: string | null
  description: string
  status: string
  totalValue: number
}

interface OperationalAlert {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  count: number
  href: string
  filter: string
  items: OperationalAlertItem[]
}

interface OperationalAlertsSummaryProps {
  alerts: OperationalAlert[]
}

const severityStyles = {
  low: 'border-blue-200 bg-blue-50 text-blue-950',
  medium: 'border-amber-200 bg-amber-50 text-amber-950',
  high: 'border-red-200 bg-red-50 text-red-950',
} as const

const severityLabels = {
  low: 'Atencao',
  medium: 'Prioridade',
  high: 'Critico',
} as const

function servicesHref(filter: string) {
  const attentionByFilter: Record<string, string> = {
    'waiting-budgets': '',
    'overdue-scheduled': 'overdue',
    'third-party-pending': 'third-party',
    'orders-without-checklist': 'without-checklist',
    'stale-orders': 'stale',
  }
  const attention = attentionByFilter[filter]

  if (filter === 'waiting-budgets') return '/dashboard/services?type=budgets'
  if (attention) return `/dashboard/services?type=orders&attention=${attention}`

  return `/dashboard/services?type=${filter}`
}

export function OperationalAlertsSummary({ alerts }: OperationalAlertsSummaryProps) {
  const totalAlerts = alerts.reduce((sum, alert) => sum + alert.count, 0)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Central de atencao
          </CardTitle>
          <CardDescription>Principais pendencias operacionais da oficina</CardDescription>
        </div>
        {alerts.length > 0 && <Badge variant="outline">{totalAlerts} ocorrencia(s)</Badge>}
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-semibold">Nenhuma pendencia critica agora</div>
              <p className="text-sm opacity-80">
                Orcamentos, OS, checklist e terceirizados estao sem alertas operacionais.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className={`rounded-md border p-4 ${severityStyles[alert.severity]}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <Badge variant="outline" className="bg-white/80">
                        {severityLabels[alert.severity]} · {alert.count}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm opacity-80">{alert.description}</p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="bg-white/80">
                    <Link href={servicesHref(alert.id)}>
                      Ver lista
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {alert.items.length > 0 && (
                  <div className="mt-3 grid gap-2 lg:grid-cols-3">
                    {alert.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="rounded-md border bg-white/80 p-3 text-sm transition-colors hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium">{item.customerName}</div>
                            <div className="truncate text-xs opacity-70">
                              {item.vehicleLabel || item.description}
                            </div>
                          </div>
                          <div className="shrink-0 text-xs font-semibold">
                            {formatCurrency(item.totalValue)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
