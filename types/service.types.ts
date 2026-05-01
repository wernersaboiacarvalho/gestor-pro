// types/service.types.ts

export interface Customer {
  id: string
  name: string
  phone: string
}

export interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  customerId: string
  year: number
}

export interface Mechanic {
  id: string
  name: string
  specialty: string | null
  commissionRate: number | null
  status: string
}

export interface ThirdPartyProvider {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

export interface ServiceItem {
  id?: string
  type: 'PART' | 'LABOR'
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface ServiceMechanic {
  id?: string
  mechanicId: string
  mechanic?: Mechanic
  hoursWorked: number
  commission: number
  notes?: string
}

export interface ThirdPartyService {
  id?: string
  providerId: string
  provider?: ThirdPartyProvider
  description: string
  cost: number
  chargedValue: number
  status: string
}

export interface ServiceAttachment {
  id: string
  serviceId: string
  tenantId: string
  url: string
  publicId: string | null
  storageProvider: string
  fileName: string | null
  mimeType: string
  size: number
  caption: string | null
  createdById: string | null
  createdAt: string
}

export interface ServiceChecklistItem {
  id: string
  serviceId: string
  tenantId: string
  title: string
  completed: boolean
  completedAt: string | null
  completedById: string | null
  createdById: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface PendingServicePhoto {
  id: string
  file: File
  previewUrl: string
  caption?: string
}

export interface Service {
  id: string
  type: 'ORCAMENTO' | 'ORDEM_SERVICO'
  customerId: string
  customer: { name: string; phone?: string | null; email?: string | null; address?: string | null }
  vehicle: { plate: string; model: string; brand: string; year?: number | null } | null
  user?: { id: string; name: string; email: string } | null
  serviceMechanics: ServiceMechanic[]
  items: ServiceItem[]
  thirdPartyServices?: ThirdPartyService[]
  attachments?: ServiceAttachment[]
  checklistItems?: ServiceChecklistItem[]
  description: string
  status: string
  totalValue: number
  notes: string | null
  scheduledDate: string | null
  completedDate?: string | null
  vehicleId: string | null
  approvedAt?: string | null
  expiresAt?: string | null
  clientApprovalName?: string | null
  clientApprovalDocument?: string | null
  clientApprovalNotes?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ServiceActivity {
  id: string
  action: string
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

export interface ServiceStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  totalRevenue: number
}

export interface ServiceFormData {
  type: 'ORCAMENTO' | 'ORDEM_SERVICO'
  customerId: string
  vehicleId?: string
  description: string
  status: string
  scheduledDate?: string
  notes?: string
}

export interface ServiceFormSubmitData extends ServiceFormData {
  mechanics: ServiceMechanic[]
  items: ServiceItem[]
  thirdPartyServices: ThirdPartyService[]
  totalValue: number
}
