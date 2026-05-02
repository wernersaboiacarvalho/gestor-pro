'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Car,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Edit,
  FileText,
  ImageIcon,
  ListChecks,
  Mail,
  MapPin,
  MessageSquareText,
  Package,
  Phone,
  Printer,
  Share2,
  UserCog,
  UserRound,
  WalletCards,
  Wrench,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

const statusHelp: Record<string, string> = {
  PENDENTE: 'Aguardando aprovacao, pecas ou inicio do trabalho.',
  EM_ANDAMENTO: 'Servico em execucao. Acompanhe checklist, fotos e terceiros.',
  CONCLUIDO: 'Servico finalizado. Confira recebimentos e entrega ao cliente.',
  CANCELADO: 'Documento cancelado e fora do fluxo operacional.',
}

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

function formatDate(value?: string | null) {
  if (!value) return 'Nao informado'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Nao informado'

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase()
}

function getServiceTitle(service: Service) {
  return service.type === 'ORCAMENTO' ? 'Orcamento' : 'Ordem de servico'
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
  const transactions = useMemo(() => service?.transactions || [], [service?.transactions])
  const pendingThirdPartyCount = thirdPartyServices.filter(
    (item) => item.status !== 'RETORNADO'
  ).length
  const completedChecklistCount = checklistItems.filter((item) => item.completed).length
  const checklistProgress =
    checklistItems.length > 0
      ? Math.round((completedChecklistCount / checklistItems.length) * 100)
      : 0
  const statusIndex = service
    ? Math.max(
        statusOptions.findIndex((option) => option.value === service.status),
        0
      )
    : 0
  const documentCode = service ? shortId(service.id) : ''
  const documentTitle = service ? getServiceTitle(service) : 'Documento'

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

  const financialSummary = useMemo(() => {
    const received = transactions
      .filter((transaction) => transaction.type === 'RECEITA' && transaction.isPaid)
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
    const pending = transactions
      .filter((transaction) => transaction.type === 'RECEITA' && !transaction.isPaid)
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
    const remaining = Math.max(Number(service?.totalValue || 0) - received, 0)

    return { received, pending, remaining }
  }, [service?.totalValue, transactions])

  const operationalFlags = useMemo(() => {
    const flags: Array<{ label: string; tone: string }> = []

    if (service?.type === 'ORCAMENTO' && !service.approvedAt) {
      flags.push({ label: 'Aguardando aprovacao', tone: 'border-amber-200 text-amber-700' })
    }

    if (pendingThirdPartyCount > 0) {
      flags.push({
        label: `${pendingThirdPartyCount} terceiro(s) pendente(s)`,
        tone: 'border-violet-200 text-violet-700',
      })
    }

    if (checklistItems.length > 0 && checklistProgress < 100) {
      flags.push({
        label: `${checklistProgress}% do checklist`,
        tone: 'border-blue-200 text-blue-700',
      })
    }

    if (financialSummary.remaining > 0 && service?.status === 'CONCLUIDO') {
      flags.push({ label: 'Saldo em aberto', tone: 'border-rose-200 text-rose-700' })
    }

    return flags
  }, [
    checklistItems.length,
    checklistProgress,
    financialSummary.remaining,
    pendingThirdPartyCount,
    service?.approvedAt,
    service?.status,
    service?.type,
  ])

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
      <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="shrink-0">
              <Link href="/dashboard/services" aria-label="Voltar para servicos">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={service.type} />
                <StatusBadge status={service.status} />
                <Badge variant="outline">#{documentCode}</Badge>
              </div>
              <div className="mt-1 truncate text-sm text-muted-foreground">
                {documentTitle} para {service.customer.name}
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
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-2">
                {operationalFlags.length === 0 ? (
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                    Operacao sem alertas
                  </Badge>
                ) : (
                  operationalFlags.map((flag) => (
                    <Badge key={flag.label} variant="outline" className={flag.tone}>
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      {flag.label}
                    </Badge>
                  ))
                )}
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-normal md:text-3xl">
                  {documentTitle} de {service.customer.name}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Criado em {formatDateTime(service.createdAt)} por{' '}
                  {service.user?.name || 'usuario do tenant'}. {statusHelp[service.status] || ''}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Total
                  </div>
                  <div className="mt-1 text-xl font-bold">{formatCurrency(service.totalValue)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <WalletCards className="h-3.5 w-3.5" />
                    Recebido
                  </div>
                  <div className="mt-1 text-xl font-bold text-emerald-700">
                    {formatCurrency(financialSummary.received)}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <ListChecks className="h-3.5 w-3.5" />
                    Checklist
                  </div>
                  <div className="mt-1 text-xl font-bold">{checklistProgress}%</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Agendamento
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    {formatDate(service.scheduledDate)}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t bg-muted/30 p-6 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Fluxo da OS</div>
                  <div className="text-xs text-muted-foreground">
                    Mude a etapa conforme a execucao avanca.
                  </div>
                </div>
                <Badge variant="outline">{statusIndex + 1}/4</Badge>
              </div>

              <div className="mt-5 space-y-2">
                {statusOptions.map((option, index) => {
                  const isCurrent = service.status === option.value
                  const isDone = index < statusIndex && service.status !== 'CANCELADO'

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={updateStatus.isPending || isCurrent}
                      onClick={() => handleStatusChange(option.value)}
                      className={`flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors ${
                        isCurrent
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted'
                      } disabled:cursor-not-allowed disabled:opacity-80`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          isCurrent
                            ? 'border-primary-foreground/40 bg-primary-foreground/20'
                            : isDone
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-muted-foreground/20 bg-muted text-muted-foreground'
                        }`}
                      >
                        {isDone ? (
                          <BadgeCheck className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">{option.label}</span>
                        <span
                          className={`block text-xs ${
                            isCurrent ? 'text-primary-foreground/80' : 'text-muted-foreground'
                          }`}
                        >
                          {statusHelp[option.value]}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <Tabs defaultValue="work" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-3">
              <TabsTrigger value="work" className="gap-2 py-2">
                <Wrench className="h-4 w-4" />
                Trabalho
              </TabsTrigger>
              <TabsTrigger value="finance" className="gap-2 py-2">
                <WalletCards className="h-4 w-4" />
                Financeiro
              </TabsTrigger>
              <TabsTrigger value="records" className="gap-2 py-2">
                <ImageIcon className="h-4 w-4" />
                Registros
              </TabsTrigger>
            </TabsList>

            <TabsContent value="work" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Diagnostico e escopo
                  </CardTitle>
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
                  <CardTitle className="flex items-center justify-between gap-3 text-lg">
                    <span className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Itens e valores
                    </span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(service.totalValue)}
                    </span>
                  </CardTitle>
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
                        <div className="overflow-x-auto rounded-md border">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2 font-medium">Item</th>
                                <th className="px-3 py-2 font-medium">Tipo</th>
                                <th className="px-3 py-2 text-right font-medium">Qtd.</th>
                                <th className="px-3 py-2 text-right font-medium">Unitario</th>
                                <th className="px-3 py-2 text-right font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item) => (
                                <tr
                                  key={item.id || item.description}
                                  className="border-t last:border-b-0"
                                >
                                  <td className="min-w-64 px-3 py-3">
                                    <div className="font-medium">{item.description}</div>
                                    {item.product?.sku && (
                                      <div className="text-xs text-muted-foreground">
                                        SKU {item.product.sku}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-3">
                                    <Badge variant="outline">
                                      {item.type === 'PART' ? 'Peca' : 'Mao de obra'}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-3 text-right">{item.quantity}</td>
                                  <td className="px-3 py-3 text-right">
                                    {formatCurrency(item.unitPrice)}
                                  </td>
                                  <td className="px-3 py-3 text-right font-semibold">
                                    {formatCurrency(item.totalPrice)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="grid gap-3 text-sm sm:grid-cols-3">
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Pecas</div>
                          <div className="font-semibold">{formatCurrency(totals.parts)}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Mao de obra</div>
                          <div className="font-semibold">{formatCurrency(totals.labor)}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-muted-foreground">Terceiros</div>
                          <div className="font-semibold">{formatCurrency(totals.outsourced)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <ServiceThirdPartyPanel serviceId={service.id} services={thirdPartyServices} />
              <ServiceChecklist serviceId={service.id} items={checklistItems} />
            </TabsContent>

            <TabsContent value="finance" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total do documento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(service.totalValue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Recebido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-700">
                      {formatCurrency(financialSummary.received)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      A receber
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(financialSummary.remaining)}
                    </div>
                    {financialSummary.pending > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatCurrency(financialSummary.pending)} lancado como pendente
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <ServicePaymentPanel service={service} />
            </TabsContent>

            <TabsContent value="records" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-3 text-lg">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      Fotos anexadas
                    </span>
                    <Badge variant="outline">{attachments.length} foto(s)</Badge>
                  </CardTitle>
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock3 className="h-5 w-5 text-primary" />
                    Datas importantes
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground">Criado em</div>
                    <div className="font-semibold">{formatDateTime(service.createdAt)}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground">Aprovado em</div>
                    <div className="font-semibold">{formatDateTime(service.approvedAt)}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground">Concluido em</div>
                    <div className="font-semibold">{formatDateTime(service.completedDate)}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserRound className="h-5 w-5 text-primary" />
                Cliente e veiculo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">Cliente</div>
                  <div className="mt-1 text-base font-semibold">{service.customer.name}</div>
                </div>
                {service.customer.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {service.customer.phone}
                  </div>
                )}
                {service.customer.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {service.customer.email}
                  </div>
                )}
                {service.customer.address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4" />
                    <span>{service.customer.address}</span>
                  </div>
                )}
              </div>

              <Separator />

              {service.vehicle ? (
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase text-muted-foreground">Veiculo</div>
                  <div className="flex items-start gap-3">
                    <Car className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">{service.vehicle.plate}</div>
                      <div className="text-muted-foreground">
                        {service.vehicle.brand} {service.vehicle.model}
                        {service.vehicle.year ? `, ${service.vehicle.year}` : ''}
                      </div>
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
                    <div className="flex items-center gap-2 font-semibold">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                      Responsaveis
                    </div>
                    {serviceMechanics.map((item) => (
                      <div
                        key={item.id || item.mechanicId}
                        className="flex items-center justify-between rounded-md border p-2 text-sm"
                      >
                        <span>{item.mechanic?.name || 'Mecanico'}</span>
                        <span className="text-muted-foreground">{item.hoursWorked || 0}h</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquareText className="h-5 w-5 text-primary" />
                Linha do tempo
              </CardTitle>
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
        </aside>
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
