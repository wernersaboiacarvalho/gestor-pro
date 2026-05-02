'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Edit,
  FileText,
  ImageIcon,
  MessageSquareText,
  Printer,
  Share2,
  UserRound,
  Wrench,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Separator } from '@/components/ui/separator'
import { ServiceChecklist } from '@/components/services/service-checklist'
import { ServiceForm } from '@/components/services/service-form'
import { ServicePaymentPanel } from '@/components/services/service-payment-panel'
import { ServiceThirdPartyPanel } from '@/components/services/service-third-party-panel'
import { StatusBadge } from '@/components/services/status-badge'
import { TypeBadge } from '@/components/services/type-badge'
import { useToast } from '@/hooks/use-toast'
import {
  uploadServiceAttachment,
  useApproveService,
  useService,
  useServiceActivities,
  useServiceFormData,
  useUpdateService,
  useUpdateServiceStatus,
} from '@/hooks/use-services-query'
import { formatCurrency } from '@/lib/formatters/currency'
import type { PendingServicePhoto, Service, ServiceFormSubmitData } from '@/types/service.types'

const statusOptions: Array<{ value: Service['status']; label: string }> = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDO', label: 'Concluido' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const activityLabels: Record<string, string> = {
  SERVICE_CREATED: 'Documento criado',
  SERVICE_UPDATED: 'Documento atualizado',
  SERVICE_COMPLETED: 'OS concluida',
  SERVICE_STATUS_UPDATED: 'Status alterado',
  SERVICE_BUDGET_APPROVED: 'Orcamento aprovado',
  SERVICE_PUBLIC_LINK_CREATED: 'Link publico gerado',
  SERVICE_ATTACHMENT_ADDED: 'Foto adicionada',
  SERVICE_ATTACHMENT_REMOVED: 'Foto removida',
  SERVICE_PAYMENT_RECEIVED: 'Recebimento registrado',
  SERVICE_PAYMENT_SCHEDULED: 'Cobranca pendente registrada',
  SERVICE_CHECKLIST_ITEM_CREATED: 'Tarefa adicionada',
  SERVICE_CHECKLIST_ITEM_UPDATED: 'Tarefa atualizada',
  SERVICE_CHECKLIST_ITEM_COMPLETED: 'Tarefa concluida',
  SERVICE_CHECKLIST_ITEM_REOPENED: 'Tarefa reaberta',
  SERVICE_CHECKLIST_ITEM_DELETED: 'Tarefa removida',
  SERVICE_THIRD_PARTY_STATUS_UPDATED: 'Terceirizado atualizado',
  SERVICE_THIRD_PARTY_NOTES_UPDATED: 'Observacao do terceirizado',
  'service.updated': 'Documento atualizado',
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Nao informado'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nao informado'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

interface ServiceDetailViewProps {
  serviceId: string
}

export function ServiceDetailView({ serviceId }: ServiceDetailViewProps) {
  const [editing, setEditing] = useState(false)
  const [sharing, setSharing] = useState(false)
  const { success, error: showError } = useToast()

  const { data: service, isLoading, refetch } = useService(serviceId)
  const { data: activities = [] } = useServiceActivities(serviceId)
  const updateService = useUpdateService()
  const updateStatus = useUpdateServiceStatus()
  const approveService = useApproveService()
  const { customers, vehicles, mechanics, thirdPartyProviders } = useServiceFormData()

  const items = useMemo(() => service?.items || [], [service?.items])
  const thirdPartyServices = useMemo(
    () => service?.thirdPartyServices || [],
    [service?.thirdPartyServices]
  )
  const attachments = service?.attachments || []
  const serviceMechanics = service?.serviceMechanics || []
  const checklistItems = service?.checklistItems || []
  const pendingThirdPartyCount = thirdPartyServices.filter(
    (item) => item.status !== 'RETORNADO'
  ).length

  const totals = useMemo(() => {
    const parts = items
      .filter((item) => item.type === 'PART')
      .reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)
    const labor = items
      .filter((item) => item.type === 'LABOR')
      .reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)
    const outsourced = thirdPartyServices.reduce(
      (sum, item) => sum + Number(item.chargedValue || 0),
      0
    )

    return { parts, labor, outsourced }
  }, [items, thirdPartyServices])

  const uploadPendingPhotos = async (id: string, photos: PendingServicePhoto[]) => {
    if (photos.length === 0) return

    await Promise.all(photos.map((photo) => uploadServiceAttachment(id, photo.file)))
  }

  const handleEditSubmit = (data: ServiceFormSubmitData, pendingPhotos: PendingServicePhoto[]) => {
    if (!service) return

    updateService.mutate(
      { id: service.id, data },
      {
        onSuccess: async (updatedService) => {
          try {
            await uploadPendingPhotos(updatedService.id, pendingPhotos)
            success('Documento atualizado!')
          } catch (err) {
            showError(
              'Documento salvo, mas houve erro nas fotos',
              err instanceof Error ? err.message : ''
            )
          }

          setEditing(false)
          refetch()
        },
        onError: (err) => showError('Erro ao atualizar', err.message),
      }
    )
  }

  const handleApprove = () => {
    if (!service) return
    if (!confirm('Aprovar este orcamento e converter em ordem de servico?')) return

    approveService.mutate(service.id, {
      onSuccess: () => {
        refetch()
        success('Orcamento aprovado!', 'Ele foi convertido em ordem de servico.')
      },
      onError: (err) => showError('Erro ao aprovar', err.message),
    })
  }

  const handleShare = async () => {
    if (!service) return

    setSharing(true)
    try {
      const response = await fetch(`/api/services/${service.id}/public-link`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Nao foi possivel gerar o link.')
      }

      const link = data.data.link as string
      const message = `Ola! Segue o link para visualizar e aprovar seu orcamento: ${link}`

      await navigator.clipboard?.writeText(link)
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
      success('Link copiado!', 'Abrimos o WhatsApp com a mensagem pronta.')
    } catch (err) {
      showError('Erro ao compartilhar', err instanceof Error ? err.message : '')
    } finally {
      setSharing(false)
    }
  }

  const handleStatusChange = (status: Service['status']) => {
    if (!service || status === service.status) return

    updateStatus.mutate(
      { id: service.id, status },
      {
        onSuccess: () => {
          refetch()
          success('Status atualizado!')
        },
        onError: (err) => showError('Erro ao mudar status', err.message),
      }
    )
  }

  if (isLoading) {
    return <LoadingSpinner className="min-h-[360px]" text="Carregando documento..." />
  }

  if (!service) {
    return (
      <EmptyState
        icon={FileText}
        title="Documento nao encontrado"
        description="Verifique se o registro ainda existe ou se voce tem acesso a este tenant."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Button asChild variant="ghost" className="w-fit px-2">
            <Link href="/dashboard/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={service.type} />
              <StatusBadge status={service.status} />
              <Badge variant="outline">#{shortId(service.id)}</Badge>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-normal md:text-3xl">
                {service.type === 'ORCAMENTO' ? 'Orcamento' : 'Ordem de servico'} de{' '}
                {service.customer.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Criado em {formatDateTime(service.createdAt)} por{' '}
                {service.user?.name || 'usuario do tenant'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {service.type === 'ORCAMENTO' && (
            <Button variant="outline" disabled={approveService.isPending} onClick={handleApprove}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprovar
            </Button>
          )}
          <Button variant="outline" disabled={sharing} onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Enviar
          </Button>
          <Button asChild>
            <Link href={`/dashboard/services/${service.id}/print`} target="_blank">
              <Printer className="mr-2 h-4 w-4" />
              PDF
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ClipboardCheck className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(service.totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">{formatDateTime(service.scheduledDate)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              Aprovacao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">{formatDateTime(service.approvedAt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              Fotos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attachments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Terceiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thirdPartyServices.length}</div>
            {thirdPartyServices.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {pendingThirdPartyCount === 0
                  ? 'Todos retornaram'
                  : `${pendingThirdPartyCount} pendente(s)`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do trabalho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap text-sm leading-6">{service.description}</p>
              {service.notes && (
                <div className="rounded-md border bg-muted/40 p-4">
                  <div className="mb-1 text-sm font-semibold">Notas internas</div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {service.notes}
                  </p>
                </div>
              )}
              {service.clientApprovalNotes && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                  <div className="mb-1 text-sm font-semibold">Observacao do cliente</div>
                  <p className="whitespace-pre-wrap text-sm">{service.clientApprovalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Itens e valores</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 && thirdPartyServices.length === 0 ? (
                <EmptyState
                  icon={Wrench}
                  title="Nenhum item informado"
                  description="Inclua pecas, mao de obra ou servicos terceirizados pelo botao Editar."
                />
              ) : (
                <div className="space-y-5">
                  {items.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b text-left text-muted-foreground">
                          <tr>
                            <th className="py-2 font-medium">Item</th>
                            <th className="py-2 font-medium">Qtd.</th>
                            <th className="py-2 text-right font-medium">Unitario</th>
                            <th className="py-2 text-right font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr
                              key={item.id || item.description}
                              className="border-b last:border-0"
                            >
                              <td className="py-3">
                                <div className="font-medium">{item.description}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.type === 'PART' ? 'Peca' : 'Mao de obra'}
                                </div>
                              </td>
                              <td className="py-3">{item.quantity}</td>
                              <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                              <td className="py-3 text-right font-semibold">
                                {formatCurrency(item.totalPrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {thirdPartyServices.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-semibold">Servicos terceirizados</div>
                      {thirdPartyServices.map((item) => (
                        <div
                          key={item.id || item.description}
                          className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <div className="font-medium">{item.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.provider?.name || 'Fornecedor nao informado'} - {item.status}
                            </div>
                          </div>
                          <div className="font-semibold">{formatCurrency(item.chargedValue)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <div className="text-muted-foreground">Pecas</div>
                      <div className="font-semibold">{formatCurrency(totals.parts)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Mao de obra</div>
                      <div className="font-semibold">{formatCurrency(totals.labor)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Terceiros</div>
                      <div className="font-semibold">{formatCurrency(totals.outsourced)}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <ServiceThirdPartyPanel serviceId={service.id} services={thirdPartyServices} />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fotos anexadas</CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title="Nenhuma foto anexada"
                  description="Use o formulario de edicao para tirar fotos ou enviar imagens do veiculo."
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group overflow-hidden rounded-md border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={attachment.url}
                        alt={attachment.caption || attachment.fileName || 'Foto do servico'}
                        className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fluxo da OS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={service.status === option.value ? 'default' : 'outline'}
                  className="w-full justify-start"
                  disabled={updateStatus.isPending || service.status === option.value}
                  onClick={() => handleStatusChange(option.value)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {option.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <ServiceChecklist serviceId={service.id} items={checklistItems} />

          <ServicePaymentPanel service={service} />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente e veiculo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <UserRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-semibold">{service.customer.name}</div>
                  <div className="text-muted-foreground">
                    {service.customer.phone || 'Sem telefone'}
                  </div>
                  {service.customer.email && (
                    <div className="text-muted-foreground">{service.customer.email}</div>
                  )}
                </div>
              </div>

              {service.vehicle ? (
                <div className="flex gap-3">
                  <Car className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">{service.vehicle.plate}</div>
                    <div className="text-muted-foreground">
                      {service.vehicle.brand} {service.vehicle.model}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Nenhum veiculo vinculado.</div>
              )}

              {serviceMechanics.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="font-semibold">Responsaveis</div>
                    {serviceMechanics.map((item) => (
                      <div key={item.id || item.mechanicId} className="text-muted-foreground">
                        {item.mechanic?.name || 'Mecanico'} - {item.hoursWorked || 0}h
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Linha do tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Os eventos desta OS aparecerao aqui conforme o time trabalhar nela.
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MessageSquareText className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">
                          {activityLabels[activity.action] || activity.action}
                        </div>
                        <div className="text-sm text-muted-foreground">{activity.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(activity.createdAt)}
                          {activity.user?.name ? ` - ${activity.user.name}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ServiceForm
        open={editing}
        onOpenChange={setEditing}
        onSubmit={handleEditSubmit}
        editingService={service}
        customers={customers.data || []}
        vehicles={vehicles.data || []}
        mechanics={mechanics.data || []}
        thirdPartyProviders={thirdPartyProviders.data || []}
      />
    </div>
  )
}
