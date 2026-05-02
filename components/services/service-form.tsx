'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  AlertTriangle,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardList,
  FileText,
  Package,
  Users,
  WalletCards,
  Wrench,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { CustomerVehicleSelector } from './customer-vehicle-selector'
import { MechanicsSelector } from './mechanics-selector'
import { ServiceItemsList } from './service-items-list'
import { ServicePhotosManager } from './service-photos-manager'
import { ServiceTypeSelector } from './service-type-selector'
import { ThirdPartyServicesList } from './third-party-services-list'
import { formatCurrency } from '@/lib/formatters/currency'
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

function formatScheduledDate(value?: string) {
  if (!value) return 'Sem agendamento'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sem agendamento'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
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

  const currentType = watch('type')
  const currentStatus = watch('status')
  const currentCustomerId = watch('customerId')
  const currentVehicleId = watch('vehicleId')
  const currentDescription = watch('description')
  const currentScheduledDate = watch('scheduledDate')
  const currentNotes = watch('notes')

  const partsTotal = useMemo(
    () =>
      serviceItems
        .filter((item) => item.type === 'PART')
        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [serviceItems]
  )
  const laborTotal = useMemo(
    () =>
      serviceItems
        .filter((item) => item.type === 'LABOR')
        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [serviceItems]
  )
  const thirdPartyTotal = useMemo(
    () => thirdPartyServices.reduce((sum, item) => sum + Number(item.chargedValue || 0), 0),
    [thirdPartyServices]
  )
  const totalValue = partsTotal + laborTotal + thirdPartyTotal

  const selectedCustomer = customers.find((customer) => customer.id === currentCustomerId)
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === currentVehicleId)
  const validItemCount = serviceItems.filter((item) => item.description.trim().length > 0).length
  const validThirdPartyCount = thirdPartyServices.filter(
    (item) => item.providerId && item.description.trim().length > 0
  ).length
  const isReadyToSave = Boolean(currentCustomerId && currentDescription?.trim())
  const scheduledLabel = formatScheduledDate(currentScheduledDate)

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
        editingService.items.map((item) => ({
          ...item,
          totalPrice: item.quantity * item.unitPrice,
        }))
      )
      setSelectedMechanics(
        editingService.serviceMechanics.map((mechanic) => ({
          mechanicId: mechanic.mechanicId,
          hoursWorked: mechanic.hoursWorked,
          commission: mechanic.commission || 0,
          notes: mechanic.notes || '',
        }))
      )
      setThirdPartyServices(
        (editingService.thirdPartyServices || []).map((service) => ({
          providerId: service.providerId,
          description: service.description,
          cost: service.cost,
          chargedValue: service.chargedValue,
          status: service.status || 'PENDENTE',
          sentAt: service.sentAt || null,
          returnedAt: service.returnedAt || null,
          notes: service.notes || null,
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
    setServiceItems(serviceItems.filter((_, itemIndex) => itemIndex !== index))
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
    setThirdPartyServices(thirdPartyServices.filter((_, serviceIndex) => serviceIndex !== index))
  }

  const handleAddMechanic = (mechanicId: string) => {
    const mechanic = mechanics.find((item) => item.id === mechanicId)
    if (mechanic && !selectedMechanics.find((item) => item.mechanicId === mechanicId)) {
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
    setSelectedMechanics(selectedMechanics.filter((item) => item.mechanicId !== mechanicId))
  }

  const handleUpdateMechanic = (
    mechanicId: string,
    field: keyof ServiceMechanic,
    value: number | string
  ) => {
    setSelectedMechanics(
      selectedMechanics.map((item) =>
        item.mechanicId === mechanicId ? { ...item, [field]: value } : item
      )
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
      <DialogContent className="flex max-h-[95vh] max-w-7xl overflow-hidden p-0">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex min-h-0 w-full flex-col">
          <div className="border-b bg-muted/30 px-6 py-5">
            <DialogHeader className="space-y-3">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={currentType === 'ORCAMENTO' ? 'outline' : 'default'}>
                      {currentType === 'ORCAMENTO' ? 'Orcamento' : 'Ordem de servico'}
                    </Badge>
                    <Badge variant="outline">{currentStatus || 'PENDENTE'}</Badge>
                    {!isReadyToSave && (
                      <Badge variant="outline" className="border-amber-200 text-amber-700">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Dados obrigatorios pendentes
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="mt-2 text-2xl">
                    {editingService ? 'Editar documento de servico' : 'Novo documento de servico'}
                  </DialogTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Monte o atendimento por etapas e acompanhe o valor antes de salvar.
                  </p>
                </div>

                <div className="rounded-md border bg-background p-4 text-right">
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    Total previsto
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {formatCurrency(totalValue)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {validItemCount} item(ns), {validThirdPartyCount} terceirizado(s)
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="hidden overflow-y-auto border-r bg-muted/20 p-5 lg:block">
              <div className="space-y-5">
                <div className="rounded-md border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="h-4 w-4 text-primary" />
                    Atendimento
                  </div>
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Cliente</div>
                      <div className="font-medium">
                        {selectedCustomer?.name || 'Nenhum cliente selecionado'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Veiculo</div>
                      <div className="font-medium">
                        {selectedVehicle
                          ? `${selectedVehicle.plate} - ${selectedVehicle.brand} ${selectedVehicle.model}`
                          : 'Nenhum veiculo selecionado'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Agenda</div>
                      <div className="font-medium">{scheduledLabel}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <WalletCards className="h-4 w-4 text-primary" />
                    Valores
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Pecas</span>
                      <span className="font-medium">{formatCurrency(partsTotal)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Mao de obra</span>
                      <span className="font-medium">{formatCurrency(laborTotal)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Terceiros</span>
                      <span className="font-medium">{formatCurrency(thirdPartyTotal)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between gap-3 text-base">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold">{formatCurrency(totalValue)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border bg-background p-4">
                  <div className="text-sm font-semibold">Resumo operacional</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-muted/50 p-3">
                      <div className="text-xl font-bold">{validItemCount}</div>
                      <div className="text-xs text-muted-foreground">Itens</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-3">
                      <div className="text-xl font-bold">{selectedMechanics.length}</div>
                      <div className="text-xs text-muted-foreground">Responsaveis</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-3">
                      <div className="text-xl font-bold">{validThirdPartyCount}</div>
                      <div className="text-xs text-muted-foreground">Terceiros</div>
                    </div>
                    <div className="rounded-md bg-muted/50 p-3">
                      <div className="text-xl font-bold">{pendingPhotos.length}</div>
                      <div className="text-xs text-muted-foreground">Fotos novas</div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <div className="min-h-0 overflow-y-auto p-6">
              <Tabs defaultValue="basics" className="space-y-5">
                <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4">
                  <TabsTrigger value="basics" className="gap-2 py-2">
                    <FileText className="h-4 w-4" />
                    Base
                  </TabsTrigger>
                  <TabsTrigger value="items" className="gap-2 py-2">
                    <Package className="h-4 w-4" />
                    Itens
                  </TabsTrigger>
                  <TabsTrigger value="operation" className="gap-2 py-2">
                    <Wrench className="h-4 w-4" />
                    Operacao
                  </TabsTrigger>
                  <TabsTrigger value="records" className="gap-2 py-2">
                    <Camera className="h-4 w-4" />
                    Fotos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basics" className="space-y-6">
                  <section className="rounded-lg border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">Identificacao do documento</h3>
                        <p className="text-sm text-muted-foreground">
                          Defina o tipo, status e o cliente que sera atendido.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                                <SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem>
                                <SelectItem value="CONCLUIDO">Concluido</SelectItem>
                                <SelectItem value="CANCELADO">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="rounded-md border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <CalendarClock className="h-4 w-4" />
                          Agendamento
                        </div>
                        <div className="mt-1 text-sm font-semibold">{scheduledLabel}</div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-lg border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">Cliente e veiculo</h3>
                        <p className="text-sm text-muted-foreground">
                          Escolha o cliente antes do veiculo para filtrar a frota corretamente.
                        </p>
                      </div>
                    </div>
                    <CustomerVehicleSelector
                      control={control}
                      customers={customers}
                      vehicles={vehicles}
                      selectedCustomerId={selectedCustomerId}
                      onCustomerChange={(customerId) => {
                        setSelectedCustomerId(customerId)
                        setValue('vehicleId', '')
                      }}
                    />
                  </section>

                  <section className="rounded-lg border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">Diagnostico e observacoes</h3>
                        <p className="text-sm text-muted-foreground">
                          Registre o problema relatado, diagnostico e combinados internos.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Diagnostico e descricao geral *</Label>
                        <Textarea
                          {...register('description')}
                          rows={8}
                          placeholder="Ex.: Cliente relata barulho ao frear. Verificar pastilhas, discos e fluido..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Notas internas</Label>
                        <Textarea
                          value={currentNotes || ''}
                          onChange={(event) => setValue('notes', event.target.value)}
                          rows={8}
                          placeholder="Ex.: confirmar autorizacao antes de trocar pecas adicionais..."
                        />
                      </div>
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="items" className="space-y-6">
                  <ServiceItemsList
                    items={serviceItems}
                    onAddItem={handleAddItem}
                    onUpdateItem={handleUpdateItem}
                    onRemoveItem={handleRemoveItem}
                  />

                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-md border p-3">
                      <div className="text-sm text-muted-foreground">Pecas</div>
                      <div className="text-lg font-semibold">{formatCurrency(partsTotal)}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-sm text-muted-foreground">Mao de obra</div>
                      <div className="text-lg font-semibold">{formatCurrency(laborTotal)}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-sm text-muted-foreground">Terceiros</div>
                      <div className="text-lg font-semibold">{formatCurrency(thirdPartyTotal)}</div>
                    </div>
                    <div className="rounded-md border bg-muted/30 p-3">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="text-lg font-bold">{formatCurrency(totalValue)}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="operation" className="space-y-6">
                  <MechanicsSelector
                    mechanics={mechanics}
                    selectedMechanics={selectedMechanics}
                    onAddMechanic={handleAddMechanic}
                    onRemoveMechanic={handleRemoveMechanic}
                    onUpdateMechanic={handleUpdateMechanic}
                    scheduledDate={currentScheduledDate}
                    onScheduledDateChange={(date) => setValue('scheduledDate', date)}
                  />

                  <ThirdPartyServicesList
                    providers={thirdPartyProviders}
                    services={thirdPartyServices}
                    onAddService={handleAddThirdParty}
                    onUpdateService={handleUpdateThirdParty}
                    onRemoveService={handleRemoveThirdParty}
                  />
                </TabsContent>

                <TabsContent value="records" className="space-y-6">
                  <ServicePhotosManager
                    serviceId={editingService?.id}
                    pendingPhotos={pendingPhotos}
                    onPendingPhotosChange={setPendingPhotos}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <DialogFooter className="border-t bg-background px-6 py-4">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isReadyToSave ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Pronto para salvar
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Informe cliente e diagnostico para salvar
                  </>
                )}
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="h-11">
                  {editingService ? 'Salvar alteracoes' : 'Criar documento'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
