// components/services/service-form.tsx

'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useForm, Controller } from 'react-hook-form'
import { ServiceTypeSelector } from './service-type-selector'
import { CustomerVehicleSelector } from './customer-vehicle-selector'
import { ServiceItemsList } from './service-items-list'
import { ThirdPartyServicesList } from './third-party-services-list'
import { MechanicsSelector } from './mechanics-selector'
import { ServicePhotosManager } from './service-photos-manager'
import type { PendingServicePhoto } from '@/types/service.types'

interface Customer {
  id: string
  name: string
  phone: string
}

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  customerId: string
  year: number
}

interface Mechanic {
  id: string
  name: string
  specialty: string | null
  commissionRate: number | null
  status: string
}

interface ThirdPartyProvider {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

interface ServiceItem {
  productId?: string | null
  type: 'PART' | 'LABOR'
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface ServiceMechanic {
  mechanicId: string
  hoursWorked: number
  commission: number
  notes?: string
}

interface ThirdPartyService {
  id?: string
  providerId: string
  provider?: ThirdPartyProvider
  description: string
  cost: number
  chargedValue: number
  status: string
  sentAt?: string | null
  returnedAt?: string | null
  notes?: string | null
}

interface ServiceFormData {
  type: 'ORCAMENTO' | 'ORDEM_SERVICO'
  customerId: string
  vehicleId?: string
  description: string
  status: string
  scheduledDate?: string
  notes?: string
}

interface Service {
  id: string
  type: 'ORCAMENTO' | 'ORDEM_SERVICO'
  customerId: string
  customer: { name: string }
  vehicle: { plate: string; model: string; brand: string } | null
  serviceMechanics: ServiceMechanic[]
  items: ServiceItem[]
  thirdPartyServices?: ThirdPartyService[]
  description: string
  status: string
  totalValue: number
  notes: string | null
  scheduledDate: string | null
  vehicleId: string | null
}

interface ServiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    data: ServiceFormData & {
      mechanics: ServiceMechanic[]
      items: ServiceItem[]
      thirdPartyServices: ThirdPartyService[]
      totalValue: number
    },
    pendingPhotos: PendingServicePhoto[]
  ) => void
  editingService: Service | null
  customers: Customer[]
  vehicles: Vehicle[]
  mechanics: Mechanic[]
  thirdPartyProviders: ThirdPartyProvider[]
}

export function ServiceForm({
  open,
  onOpenChange,
  onSubmit,
  editingService,
  customers,
  vehicles,
  mechanics,
  thirdPartyProviders,
}: ServiceFormProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [selectedMechanics, setSelectedMechanics] = useState<ServiceMechanic[]>([])
  const [thirdPartyServices, setThirdPartyServices] = useState<ThirdPartyService[]>([])
  const [pendingPhotos, setPendingPhotos] = useState<PendingServicePhoto[]>([])

  const { register, handleSubmit, reset, control, watch, setValue } = useForm<ServiceFormData>({
    defaultValues: {
      type: 'ORCAMENTO',
      status: 'PENDENTE',
      customerId: '',
      vehicleId: '',
      description: '',
      notes: '',
      scheduledDate: '',
    },
  })

  const totalValue = useMemo(() => {
    const itemsTotal = serviceItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0)
    const thirdPartyTotal = thirdPartyServices.reduce(
      (acc, item) => acc + Number(item.chargedValue),
      0
    )
    return itemsTotal + thirdPartyTotal
  }, [serviceItems, thirdPartyServices])

  // Reset form when editing service changes
  useEffect(() => {
    if (editingService) {
      reset({
        type: editingService.type,
        customerId: editingService.customerId,
        vehicleId: editingService.vehicleId || '',
        description: editingService.description,
        status: editingService.status,
        notes: editingService.notes || '',
        scheduledDate: editingService.scheduledDate
          ? new Date(editingService.scheduledDate).toISOString().slice(0, 16)
          : '',
      })
      setSelectedCustomerId(editingService.customerId)
      setServiceItems(
        editingService.items.map((i) => ({
          ...i,
          totalPrice: i.quantity * i.unitPrice,
        }))
      )
      setSelectedMechanics(
        editingService.serviceMechanics.map((sm) => ({
          mechanicId: sm.mechanicId,
          hoursWorked: sm.hoursWorked,
          commission: sm.commission || 0,
          notes: sm.notes || '',
        }))
      )
      setThirdPartyServices(
        (editingService.thirdPartyServices || []).map((tp) => ({
          providerId: tp.providerId,
          description: tp.description,
          cost: tp.cost,
          chargedValue: tp.chargedValue,
          status: tp.status || 'PENDENTE',
          sentAt: tp.sentAt || null,
          returnedAt: tp.returnedAt || null,
          notes: tp.notes || null,
        }))
      )
    } else {
      reset({
        type: 'ORCAMENTO',
        status: 'PENDENTE',
        customerId: '',
        vehicleId: '',
        description: '',
        notes: '',
        scheduledDate: '',
      })
      setSelectedCustomerId('')
      setServiceItems([])
      setSelectedMechanics([])
      setThirdPartyServices([])
    }
  }, [editingService, reset])

  useEffect(() => {
    if (open || pendingPhotos.length === 0) return

    pendingPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
    setPendingPhotos([])
  }, [open, pendingPhotos])

  const handleAddItem = () => {
    setServiceItems([
      ...serviceItems,
      { type: 'PART', description: '', quantity: 1, unitPrice: 0, totalPrice: 0 },
    ])
  }

  const handleUpdateItem = (
    index: number,
    field: keyof ServiceItem,
    value: string | number | null
  ) => {
    setServiceItems((currentItems) => {
      const newItems = [...currentItems]
      let finalValue = value

      if (field === 'quantity' || field === 'unitPrice') {
        finalValue = value === '' || value === null ? 0 : Number(value)
      }

      const item = { ...newItems[index], [field]: finalValue }

      if (field === 'quantity' || field === 'unitPrice') {
        item.totalPrice = Number(item.quantity) * Number(item.unitPrice)
      }

      newItems[index] = item as ServiceItem
      return newItems
    })
  }

  const handleRemoveItem = (index: number) => {
    setServiceItems(serviceItems.filter((_, i) => i !== index))
  }

  const handleAddThirdParty = () => {
    setThirdPartyServices([
      ...thirdPartyServices,
      {
        providerId: '',
        description: '',
        cost: 0,
        chargedValue: 0,
        status: 'PENDENTE',
      },
    ])
  }

  const handleUpdateThirdParty = (
    index: number,
    field: keyof ThirdPartyService,
    value: string | number
  ) => {
    const newServices = [...thirdPartyServices]
    newServices[index] = { ...newServices[index], [field]: value }
    setThirdPartyServices(newServices)
  }

  const handleRemoveThirdParty = (index: number) => {
    setThirdPartyServices(thirdPartyServices.filter((_, i) => i !== index))
  }

  const handleAddMechanic = (mechanicId: string) => {
    const mechanic = mechanics.find((m) => m.id === mechanicId)
    if (mechanic && !selectedMechanics.find((s) => s.mechanicId === mechanicId)) {
      setSelectedMechanics([
        ...selectedMechanics,
        {
          mechanicId,
          hoursWorked: 0,
          commission: mechanic.commissionRate || 0,
        },
      ])
    }
  }

  const handleRemoveMechanic = (mechanicId: string) => {
    setSelectedMechanics(selectedMechanics.filter((s) => s.mechanicId !== mechanicId))
  }

  const handleUpdateMechanic = (
    mechanicId: string,
    field: keyof ServiceMechanic,
    value: number | string
  ) => {
    setSelectedMechanics(
      selectedMechanics.map((sm) => (sm.mechanicId === mechanicId ? { ...sm, [field]: value } : sm))
    )
  }

  const handleFormSubmit = (data: ServiceFormData) => {
    const cleanItems = serviceItems.filter((item) => item.description.trim().length > 0)
    const cleanThirdPartyServices = thirdPartyServices.filter(
      (item) => item.providerId && item.description.trim().length > 0
    )

    onSubmit(
      {
        ...data,
        mechanics: selectedMechanics,
        items: cleanItems,
        thirdPartyServices: cleanThirdPartyServices,
        totalValue,
      },
      pendingPhotos
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingService ? 'Editar' : 'Novo'} Documento de Serviço</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
          {/* Tipo, Status e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/40 p-4 rounded-lg border">
            <ServiceTypeSelector control={control} />

            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                      <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                      <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="text-right flex flex-col justify-center">
              <Label className="text-muted-foreground">Valor Total</Label>
              <div className="text-3xl font-black text-blue-700">R$ {totalValue.toFixed(2)}</div>
            </div>
          </div>

          {/* Cliente e Veículo */}
          <CustomerVehicleSelector
            control={control}
            customers={customers}
            vehicles={vehicles}
            selectedCustomerId={selectedCustomerId}
            onCustomerChange={setSelectedCustomerId}
          />

          {/* Itens Dinâmicos */}
          <ServiceItemsList
            items={serviceItems}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />

          {/* Terceirizados */}
          <ThirdPartyServicesList
            providers={thirdPartyProviders}
            services={thirdPartyServices}
            onAddService={handleAddThirdParty}
            onUpdateService={handleUpdateThirdParty}
            onRemoveService={handleRemoveThirdParty}
          />

          <ServicePhotosManager
            serviceId={editingService?.id}
            pendingPhotos={pendingPhotos}
            onPendingPhotosChange={setPendingPhotos}
          />

          {/* Descrição e Mecânicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Diagnóstico e Descrição Geral</Label>
              <Textarea
                {...register('description')}
                rows={5}
                placeholder="Descreva os problemas relatados e o diagnóstico realizado..."
              />
            </div>
            <MechanicsSelector
              mechanics={mechanics}
              selectedMechanics={selectedMechanics}
              onAddMechanic={handleAddMechanic}
              onRemoveMechanic={handleRemoveMechanic}
              onUpdateMechanic={handleUpdateMechanic}
              scheduledDate={watch('scheduledDate')}
              onScheduledDateChange={(date) => setValue('scheduledDate', date)}
              notes={watch('notes')}
              onNotesChange={(notes) => setValue('notes', notes)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="h-12 text-lg">
              {editingService ? 'Salvar Alterações' : 'Criar Ordem / Orçamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
