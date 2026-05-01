'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters/currency'
import { getServiceOperationalFlags } from '@/lib/services/service-operational-flags'
import type { Service } from '@/types/service.types'
import { CheckCircle2, Edit, Eye, FileText, PlayCircle, RotateCcw, Share2 } from 'lucide-react'

interface ServiceBoardProps {
  services: Service[]
  searchTerm: string
  onEdit: (service: Service) => void
  onApprove: (service: Service) => void
  onShare: (service: Service) => void
  onStatusChange: (service: Service, status: Service['status']) => void
  approvingId?: string | null
  sharingId?: string | null
  statusUpdatingId?: string | null
}

const columns: Array<{ value: Service['status']; label: string; className: string }> = [
  { value: 'PENDENTE', label: 'Pendentes', className: 'border-amber-200 bg-amber-50/60' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento', className: 'border-blue-200 bg-blue-50/60' },
  { value: 'CONCLUIDO', label: 'Concluidos', className: 'border-emerald-200 bg-emerald-50/60' },
  { value: 'CANCELADO', label: 'Cancelados', className: 'border-red-200 bg-red-50/60' },
]

const typeLabels = {
  ORCAMENTO: 'Orcamento',
  ORDEM_SERVICO: 'O.S.',
}

function formatDate(value?: string | null) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(date)
}

function nextStatusAction(service: Service) {
  if (service.type === 'ORCAMENTO') return null
  if (service.status === 'PENDENTE')
    return { label: 'Iniciar', status: 'EM_ANDAMENTO' as const, icon: PlayCircle }
  if (service.status === 'EM_ANDAMENTO')
    return { label: 'Concluir', status: 'CONCLUIDO' as const, icon: CheckCircle2 }
  if (service.status === 'CONCLUIDO')
    return { label: 'Reabrir', status: 'EM_ANDAMENTO' as const, icon: RotateCcw }
  if (service.status === 'CANCELADO')
    return { label: 'Reabrir', status: 'PENDENTE' as const, icon: RotateCcw }

  return null
}

export function ServiceBoard({
  services,
  searchTerm,
  onEdit,
  onApprove,
  onShare,
  onStatusChange,
  approvingId,
  sharingId,
  statusUpdatingId,
}: ServiceBoardProps) {
  const normalizedSearch = searchTerm.toLowerCase()
  const filteredServices = services.filter(
    (service) =>
      service.customer.name.toLowerCase().includes(normalizedSearch) ||
      service.vehicle?.plate.toLowerCase().includes(normalizedSearch) ||
      service.description.toLowerCase().includes(normalizedSearch)
  )

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {columns.map((column) => {
        const columnServices = filteredServices.filter((service) => service.status === column.value)
        const total = columnServices.reduce((sum, service) => sum + Number(service.totalValue), 0)

        return (
          <section key={column.value} className={`rounded-md border p-3 ${column.className}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{column.label}</h2>
                <p className="text-xs text-muted-foreground">{formatCurrency(total)}</p>
              </div>
              <Badge variant="outline" className="bg-white/80">
                {columnServices.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {columnServices.length === 0 ? (
                <div className="rounded-md border border-dashed bg-white/60 p-4 text-center text-sm text-muted-foreground">
                  Nenhum documento aqui.
                </div>
              ) : (
                columnServices.map((service) => {
                  const flags = getServiceOperationalFlags(service)
                  const action = nextStatusAction(service)
                  const scheduledDate = formatDate(service.scheduledDate)
                  const ActionIcon = action?.icon

                  return (
                    <Card key={service.id} className="rounded-md bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                service.type === 'ORCAMENTO'
                                  ? 'border-amber-200 text-amber-700'
                                  : 'border-blue-200 text-blue-700'
                              }
                            >
                              {typeLabels[service.type]}
                            </Badge>
                            {scheduledDate && (
                              <span className="text-xs text-muted-foreground">{scheduledDate}</span>
                            )}
                          </div>
                          <h3 className="mt-2 truncate font-semibold">{service.customer.name}</h3>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {service.description}
                          </p>
                          {service.vehicle && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {service.vehicle.plate} - {service.vehicle.brand}{' '}
                              {service.vehicle.model}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right text-sm font-bold">
                          {formatCurrency(service.totalValue)}
                        </div>
                      </div>

                      {flags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {flags.slice(0, 3).map((flag) => (
                            <Badge
                              key={flag.key}
                              variant="outline"
                              className={flag.className}
                              title={flag.description}
                            >
                              {flag.label}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/services/${service.id}`}>
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Abrir
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onEdit(service)}>
                          <Edit className="mr-1 h-3.5 w-3.5" />
                          Editar
                        </Button>
                        {service.type === 'ORCAMENTO' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={approvingId === service.id}
                            onClick={() => onApprove(service)}
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Aprovar
                          </Button>
                        )}
                        {action && ActionIcon && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={statusUpdatingId === service.id}
                            onClick={() => onStatusChange(service, action.status)}
                          >
                            <ActionIcon className="mr-1 h-3.5 w-3.5" />
                            {action.label}
                          </Button>
                        )}
                      </div>

                      <div className="mt-2 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          disabled={sharingId === service.id}
                          onClick={() => onShare(service)}
                        >
                          <Share2 className="mr-1 h-3.5 w-3.5" />
                          Enviar
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                          <Link href={`/dashboard/services/${service.id}/print`} target="_blank">
                            <FileText className="mr-1 h-3.5 w-3.5" />
                            PDF
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
