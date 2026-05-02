'use client'

import { Building2, CalendarDays, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency } from '@/lib/formatters/currency'

interface ThirdPartyProvider {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

interface ThirdPartyService {
  id?: string
  providerId: string
  description: string
  cost: number
  chargedValue: number
  status: string
  sentAt?: string | null
  returnedAt?: string | null
  notes?: string | null
}

interface ThirdPartyServicesListProps {
  providers: ThirdPartyProvider[]
  services: ThirdPartyService[]
  onAddService: () => void
  onUpdateService: (index: number, field: keyof ThirdPartyService, value: string | number) => void
  onRemoveService: (index: number) => void
}

const statusOptions = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'EM_EXECUCAO', label: 'Em execucao' },
  { value: 'CONCLUIDO', label: 'Concluido' },
  { value: 'RETORNADO', label: 'Retornado' },
]

const statusStyles: Record<string, string> = {
  PENDENTE: 'border-amber-200 text-amber-700',
  ENVIADO: 'border-blue-200 text-blue-700',
  EM_EXECUCAO: 'border-violet-200 text-violet-700',
  CONCLUIDO: 'border-emerald-200 text-emerald-700',
  RETORNADO: 'border-slate-200 text-slate-700',
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toISOString().slice(0, 16)
}

function calculateMargin(service: ThirdPartyService) {
  const cost = Number(service.cost || 0)
  const chargedValue = Number(service.chargedValue || 0)
  const margin = chargedValue - cost
  const percent = cost > 0 ? (margin / cost) * 100 : 0

  return { margin, percent }
}

export function ThirdPartyServicesList({
  providers,
  services,
  onAddService,
  onUpdateService,
  onRemoveService,
}: ThirdPartyServicesListProps) {
  const totalCost = services.reduce((sum, service) => sum + Number(service.cost || 0), 0)
  const totalCharged = services.reduce((sum, service) => sum + Number(service.chargedValue || 0), 0)
  const pendingCount = services.filter((service) => service.status !== 'RETORNADO').length

  return (
    <section className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-bold">
            <Building2 className="h-4 w-4 text-primary" />
            Servicos terceirizados
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Controle envio, retorno, custo e valor cobrado de servicos externos.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddService}>
          <Plus className="mr-1 h-3 w-3" />
          Adicionar terceiro
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-md border bg-background p-3">
          <div className="text-xs text-muted-foreground">Servicos</div>
          <div className="font-semibold">{services.length}</div>
        </div>
        <div className="rounded-md border bg-background p-3">
          <div className="text-xs text-muted-foreground">Pendentes</div>
          <div className="font-semibold">{pendingCount}</div>
        </div>
        <div className="rounded-md border bg-background p-3">
          <div className="text-xs text-muted-foreground">Custo oficina</div>
          <div className="font-semibold">{formatCurrency(totalCost)}</div>
        </div>
        <div className="rounded-md border bg-background p-3">
          <div className="text-xs text-muted-foreground">Cobrado cliente</div>
          <div className="font-semibold">{formatCurrency(totalCharged)}</div>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="rounded-md border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
          Nenhum servico terceirizado adicionado.
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service, index) => {
            const provider = providers.find((item) => item.id === service.providerId)
            const margin = calculateMargin(service)

            return (
              <div key={service.id || index} className="rounded-md border bg-background p-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={statusStyles[service.status]}>
                        {statusOptions.find((option) => option.value === service.status)?.label ||
                          'Pendente'}
                      </Badge>
                      {provider && (
                        <span className="text-sm font-medium text-muted-foreground">
                          {provider.name}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Margem: {formatCurrency(margin.margin)} ({margin.percent.toFixed(0)}%)
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveService(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 lg:grid-cols-12">
                  <div className="space-y-1 lg:col-span-3">
                    <Label className="text-xs">Parceiro</Label>
                    <Select
                      value={service.providerId}
                      onValueChange={(value) => onUpdateService(index, 'providerId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolher..." />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((providerOption) => (
                          <SelectItem key={providerOption.id} value={providerOption.id}>
                            {providerOption.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 lg:col-span-4">
                    <Label className="text-xs">Servico externo</Label>
                    <Input
                      value={service.description}
                      placeholder="Ex.: Retifica, pintura, higienizacao..."
                      onChange={(event) =>
                        onUpdateService(index, 'description', event.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <Label className="text-xs">Custo oficina</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={service.cost}
                      onChange={(event) =>
                        onUpdateService(index, 'cost', Number(event.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-1 lg:col-span-2">
                    <Label className="text-xs">Cobrado cliente</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={service.chargedValue}
                      onChange={(event) =>
                        onUpdateService(index, 'chargedValue', Number(event.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-1 lg:col-span-1">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={service.status}
                      onValueChange={(value) => onUpdateService(index, 'status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1 text-xs">
                      <CalendarDays className="h-3 w-3" />
                      Enviado em
                    </Label>
                    <Input
                      type="datetime-local"
                      value={toDateTimeLocal(service.sentAt)}
                      onChange={(event) => onUpdateService(index, 'sentAt', event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1 text-xs">
                      <CalendarDays className="h-3 w-3" />
                      Retornou em
                    </Label>
                    <Input
                      type="datetime-local"
                      value={toDateTimeLocal(service.returnedAt)}
                      onChange={(event) => onUpdateService(index, 'returnedAt', event.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <Label className="text-xs">Notas do terceirizado</Label>
                  <Textarea
                    value={service.notes || ''}
                    placeholder="Ex.: prazo combinado, pendencias, garantia do fornecedor..."
                    onChange={(event) => onUpdateService(index, 'notes', event.target.value)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
