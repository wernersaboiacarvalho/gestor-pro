'use client'

import { Building2, CheckCircle2, Clock3, Send, Truck, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'
import { useUpdateThirdPartyService } from '@/hooks/use-services-query'
import { formatCurrency } from '@/lib/formatters/currency'
import type { ThirdPartyService } from '@/types/service.types'

interface ServiceThirdPartyPanelProps {
  serviceId: string
  services: ThirdPartyService[]
}

const statusSteps = [
  { value: 'PENDENTE', label: 'Pendente', icon: Clock3 },
  { value: 'ENVIADO', label: 'Enviado', icon: Send },
  { value: 'EM_EXECUCAO', label: 'Em execucao', icon: Wrench },
  { value: 'CONCLUIDO', label: 'Concluido', icon: CheckCircle2 },
  { value: 'RETORNADO', label: 'Retornado', icon: Truck },
] as const

const statusStyles: Record<string, string> = {
  PENDENTE: 'border-amber-200 bg-amber-50 text-amber-700',
  ENVIADO: 'border-blue-200 bg-blue-50 text-blue-700',
  EM_EXECUCAO: 'border-violet-200 bg-violet-50 text-violet-700',
  CONCLUIDO: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  RETORNADO: 'border-slate-200 bg-slate-100 text-slate-700',
}

function formatDate(value?: string | null) {
  if (!value) return 'Nao registrado'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nao registrado'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function calculateMargin(item: ThirdPartyService) {
  const cost = Number(item.cost || 0)
  const charged = Number(item.chargedValue || 0)
  const marginValue = charged - cost
  const marginPercent = cost > 0 ? (marginValue / cost) * 100 : 0

  return { marginValue, marginPercent }
}

export function ServiceThirdPartyPanel({ serviceId, services }: ServiceThirdPartyPanelProps) {
  const { success, error: showError } = useToast()
  const updateThirdPartyService = useUpdateThirdPartyService(serviceId)

  const pendingCount = services.filter((item) => item.status !== 'RETORNADO').length

  const handleStatusChange = (item: ThirdPartyService, status: string) => {
    if (!item.id || item.status === status) return

    updateThirdPartyService.mutate(
      { thirdPartyServiceId: item.id, status },
      {
        onSuccess: () => success('Terceirizado atualizado!'),
        onError: (err) => showError('Erro ao atualizar terceirizado', err.message),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-lg">
          <span className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Terceirizados
          </span>
          {services.length > 0 && (
            <Badge variant="outline">
              {pendingCount === 0 ? 'Todos retornaram' : `${pendingCount} pendente(s)`}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum terceirizado nesta OS"
            description="Servicos externos podem ser incluidos pelo botao Editar."
          />
        ) : (
          <div className="space-y-4">
            {services.map((item) => {
              const margin = calculateMargin(item)
              const currentStyle = statusStyles[item.status] || statusStyles.PENDENTE

              return (
                <div key={item.id || item.description} className="rounded-md border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{item.description}</h3>
                        <Badge variant="outline" className={currentStyle}>
                          {statusSteps.find((step) => step.value === item.status)?.label ||
                            item.status}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.provider?.name || 'Fornecedor nao informado'}
                        {item.provider?.phone ? ` - ${item.provider.phone}` : ''}
                      </div>
                    </div>

                    <div className="text-sm sm:text-right">
                      <div className="font-semibold">{formatCurrency(item.chargedValue)}</div>
                      <div className="text-muted-foreground">Custo {formatCurrency(item.cost)}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-md bg-muted/40 p-3">
                      <div className="text-xs text-muted-foreground">Margem</div>
                      <div className="font-semibold">
                        {formatCurrency(margin.marginValue)} ({margin.marginPercent.toFixed(0)}%)
                      </div>
                    </div>
                    <div className="rounded-md bg-muted/40 p-3">
                      <div className="text-xs text-muted-foreground">Enviado em</div>
                      <div className="font-semibold">{formatDate(item.sentAt)}</div>
                    </div>
                    <div className="rounded-md bg-muted/40 p-3">
                      <div className="text-xs text-muted-foreground">Retornou em</div>
                      <div className="font-semibold">{formatDate(item.returnedAt)}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                    {statusSteps.map((step) => {
                      const Icon = step.icon
                      const isCurrent = item.status === step.value

                      return (
                        <Button
                          key={step.value}
                          type="button"
                          variant={isCurrent ? 'default' : 'outline'}
                          size="sm"
                          className="justify-start"
                          disabled={updateThirdPartyService.isPending || !item.id || isCurrent}
                          onClick={() => handleStatusChange(item, step.value)}
                        >
                          <Icon className="mr-2 h-3.5 w-3.5" />
                          {step.label}
                        </Button>
                      )
                    })}
                  </div>

                  {item.notes && (
                    <div className="mt-3 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                      {item.notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
