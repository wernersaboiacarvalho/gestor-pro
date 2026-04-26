'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Plus } from 'lucide-react'
import { ServiceStats } from '@/components/services/service-stats'
import { ServiceForm } from '@/components/services/service-form'
import { ServiceTable } from '@/components/services/service-table'
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const { data: services = [], isLoading, refetch } = useServices()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const approveService = useApproveService()
  const { customers, vehicles, mechanics, thirdPartyProviders } = useServiceFormData()
  const { success, error: showError } = useToast()

  const visibleServices = services.filter((service) => {
    if (typeFilter === 'budgets') return service.type === 'ORCAMENTO'
    if (typeFilter === 'orders') return service.type === 'ORDEM_SERVICO'
    return true
  })

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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
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

      <ServiceTable
        services={visibleServices}
        searchTerm={searchTerm}
        onEdit={handleEdit}
        onApprove={handleApprove}
        approvingId={approveService.isPending ? approveService.variables : null}
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
