// app/dashboard/services/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus } from 'lucide-react'
import { ServiceStats } from '@/components/services/service-stats'
import { ServiceForm } from '@/components/services/service-form'
import { ServiceTable } from '@/components/services/service-table'
import { useToast } from '@/hooks/use-toast'
import {
  useServices,
  useCreateService,
  useUpdateService,
  useServiceFormData,
} from '@/hooks/use-services-query'
import type { Service, ServiceFormSubmitData } from '@/types/service.types'

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const { data: services = [], isLoading, refetch } = useServices()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const { customers, vehicles, mechanics, thirdPartyProviders } = useServiceFormData()
  const { success, error: showError } = useToast()

  // Estatísticas
  const stats = {
    total: services.length,
    pending: services.filter((s) => s.status === 'PENDENTE').length,
    inProgress: services.filter((s) => s.status === 'EM_ANDAMENTO').length,
    completed: services.filter((s) => s.status === 'CONCLUIDO').length,
    totalRevenue: services
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

  const handleSubmit = (data: ServiceFormSubmitData) => {
    const isEdit = !!editingService

    if (isEdit) {
      updateService.mutate(
        { id: editingService!.id, data },
        {
          onSuccess: () => {
            setDialogOpen(false)
            refetch()
            success('Serviço atualizado com sucesso!')
          },
          onError: (err) => showError('Erro', err.message),
        }
      )
    } else {
      createService.mutate(data, {
        onSuccess: () => {
          setDialogOpen(false)
          refetch()
          success('Serviço criado com sucesso!')
        },
        onError: (err) => showError('Erro', err.message),
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        <span className="ml-3 text-muted-foreground">Carregando serviços...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ordens & Orçamentos</h1>
        <Button onClick={handleNewService}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Estatísticas */}
      <ServiceStats {...stats} />

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, placa ou descrição..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabela */}
      <ServiceTable services={services} searchTerm={searchTerm} onEdit={handleEdit} />

      {/* Formulário */}
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
