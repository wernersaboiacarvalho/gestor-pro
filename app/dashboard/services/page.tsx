'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus } from 'lucide-react'
import { ServiceStats } from '@/components/services/service-stats'
import { ServiceForm } from '@/components/services/service-form'
import { ServiceTable } from '@/components/services/service-table'
import { ServiceOperationalAlerts } from '@/components/services/service-operational-alerts'
import { useToast } from '@/hooks/use-toast'
import {
  useServices,
  useCreateService,
  useUpdateService,
  useApproveService,
  useServiceFormData,
  uploadServiceAttachment,
} from '@/hooks/use-services-query'
import type { PendingServicePhoto, Service, ServiceFormSubmitData } from '@/types/service.types'

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [attentionFilter, setAttentionFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [sharingId, setSharingId] = useState<string | null>(null)

  const { data: services = [], isLoading, refetch } = useServices()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const approveService = useApproveService()
  const { customers, vehicles, mechanics, thirdPartyProviders } = useServiceFormData()
  const { success, error: showError } = useToast()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = params.get('type')
    const status = params.get('status')
    const attention = params.get('attention')

    if (type === 'budgets' || type === 'orders' || type === 'all') {
      setTypeFilter(type)
    }
    if (
      status === 'PENDENTE' ||
      status === 'EM_ANDAMENTO' ||
      status === 'CONCLUIDO' ||
      status === 'CANCELADO' ||
      status === 'all'
    ) {
      setStatusFilter(status)
    }
    if (
      attention === 'overdue' ||
      attention === 'third-party' ||
      attention === 'without-checklist' ||
      attention === 'stale' ||
      attention === 'all'
    ) {
      setAttentionFilter(attention)
    }
  }, [])

  const updateFilters = (updates: { type?: string; status?: string; attention?: string }) => {
    const nextType = updates.type ?? typeFilter
    const nextStatus = updates.status ?? statusFilter
    const nextAttention = updates.attention ?? attentionFilter

    setTypeFilter(nextType)
    setStatusFilter(nextStatus)
    setAttentionFilter(nextAttention)

    const params = new URLSearchParams()
    if (nextType !== 'all') params.set('type', nextType)
    if (nextStatus !== 'all') params.set('status', nextStatus)
    if (nextAttention !== 'all') params.set('attention', nextAttention)

    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      query ? `/dashboard/services?${query}` : '/dashboard/services'
    )
  }

  const startOfToday = () => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }

  const isOpenService = (service: Service) =>
    service.status !== 'CONCLUIDO' && service.status !== 'CANCELADO'

  const isAttentionMatch = (service: Service) => {
    if (attentionFilter === 'all') return true

    if (attentionFilter === 'overdue') {
      if (!service.scheduledDate || !isOpenService(service)) return false
      return new Date(service.scheduledDate) < startOfToday()
    }

    if (attentionFilter === 'third-party') {
      return (service.thirdPartyServices || []).some((item) => item.status !== 'RETORNADO')
    }

    if (attentionFilter === 'without-checklist') {
      return (
        service.type === 'ORDEM_SERVICO' &&
        isOpenService(service) &&
        (service.checklistItems || []).length === 0
      )
    }

    if (attentionFilter === 'stale') {
      const date = new Date(service.updatedAt || service.createdAt || '')
      if (Number.isNaN(date.getTime())) return false
      const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))

      return service.type === 'ORDEM_SERVICO' && service.status === 'EM_ANDAMENTO' && days >= 3
    }

    return true
  }

  const visibleServices = services
    .filter((service) => {
      if (typeFilter === 'budgets') return service.type === 'ORCAMENTO'
      if (typeFilter === 'orders') return service.type === 'ORDEM_SERVICO'
      return true
    })
    .filter((service) => (statusFilter === 'all' ? true : service.status === statusFilter))
    .filter(isAttentionMatch)

  const stats = {
    total: visibleServices.length,
    pending: visibleServices.filter((s) => s.status === 'PENDENTE').length,
    inProgress: visibleServices.filter((s) => s.status === 'EM_ANDAMENTO').length,
    completed: visibleServices.filter((s) => s.status === 'CONCLUIDO').length,
    totalRevenue: visibleServices
      .filter((s) => s.status === 'CONCLUIDO')
      .reduce((sum, s) => sum + s.totalValue, 0),
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setDialogOpen(true)
  }

  const handleNewService = () => {
    setEditingService(null)
    setDialogOpen(true)
  }

  const uploadPendingPhotos = async (serviceId: string, photos: PendingServicePhoto[]) => {
    if (photos.length === 0) return

    try {
      await Promise.all(photos.map((photo) => uploadServiceAttachment(serviceId, photo.file)))
      success('Fotos enviadas!', `${photos.length} foto(s) anexada(s) ao documento.`)
    } catch (err) {
      showError(
        'Documento salvo, mas houve erro nas fotos',
        err instanceof Error ? err.message : ''
      )
    }
  }

  const handleSubmit = (data: ServiceFormSubmitData, pendingPhotos: PendingServicePhoto[]) => {
    const isEdit = !!editingService

    if (isEdit) {
      updateService.mutate(
        { id: editingService!.id, data },
        {
          onSuccess: async (service) => {
            await uploadPendingPhotos(service.id, pendingPhotos)
            setDialogOpen(false)
            refetch()
            success('Servico atualizado com sucesso!')
          },
          onError: (err) => showError('Erro', err.message),
        }
      )
    } else {
      createService.mutate(data, {
        onSuccess: async (service) => {
          await uploadPendingPhotos(service.id, pendingPhotos)
          setDialogOpen(false)
          refetch()
          success('Servico criado com sucesso!')
        },
        onError: (err) => showError('Erro', err.message),
      })
    }
  }

  const handleApprove = (service: Service) => {
    if (!confirm('Aprovar este orcamento e converter em ordem de servico?')) return

    approveService.mutate(service.id, {
      onSuccess: () => {
        refetch()
        success('Orcamento aprovado!', 'Ele foi convertido em ordem de servico.')
      },
      onError: (err) => showError('Erro', err.message),
    })
  }

  const handleShare = async (service: Service) => {
    setSharingId(service.id)
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
      setSharingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-3 text-muted-foreground">Carregando servicos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Servicos</h1>
          <p className="text-sm text-muted-foreground">
            Crie orcamentos, aprove para OS e gere uma versao em PDF para o cliente.
          </p>
        </div>
        <Button onClick={handleNewService}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Documento
        </Button>
      </div>

      <ServiceStats {...stats} />

      <ServiceOperationalAlerts
        services={services}
        onFilterChange={(filter) => updateFilters({ type: filter, attention: 'all' })}
        onAttentionFilterChange={(filter) =>
          updateFilters({
            type: filter === 'budgets' ? 'budgets' : 'orders',
            attention: filter,
          })
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={typeFilter}
          onValueChange={(value) => updateFilters({ type: value, attention: 'all' })}
        >
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="budgets">Orcamentos</TabsTrigger>
            <TabsTrigger value="orders">Ordens de servico</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, placa ou descricao..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Todos os status' },
            { value: 'PENDENTE', label: 'Pendentes' },
            { value: 'EM_ANDAMENTO', label: 'Em andamento' },
            { value: 'CONCLUIDO', label: 'Concluidos' },
            { value: 'CANCELADO', label: 'Cancelados' },
          ].map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={statusFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilters({ status: option.value })}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Sem filtro operacional' },
            { value: 'overdue', label: 'Vencidos' },
            { value: 'third-party', label: 'Terceiros pendentes' },
            { value: 'without-checklist', label: 'Sem checklist' },
            { value: 'stale', label: 'Parados 3 dias' },
          ].map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={attentionFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                updateFilters({
                  attention: option.value,
                  type: option.value === 'all' ? typeFilter : 'orders',
                })
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <ServiceTable
        services={visibleServices}
        searchTerm={searchTerm}
        onEdit={handleEdit}
        onApprove={handleApprove}
        onShare={handleShare}
        approvingId={approveService.isPending ? approveService.variables : null}
        sharingId={sharingId}
      />

      <ServiceForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        editingService={editingService}
        customers={customers.data || []}
        vehicles={vehicles.data || []}
        mechanics={mechanics.data || []}
        thirdPartyProviders={thirdPartyProviders.data || []}
      />
    </div>
  )
}
