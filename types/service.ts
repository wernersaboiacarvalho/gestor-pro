// types/service.ts

import type { Customer } from './customer'
import type { Vehicle } from './vehicle'
import type { Mechanic, ServiceMechanic } from './mechanic'
import type { ThirdPartyProvider, ThirdPartyService } from './third-party-provider'

export type ServiceType = 'ORCAMENTO' | 'ORDEM_SERVICO'
export type ServiceStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO'

export interface ServiceItem {
    id?: string
    type: 'PART' | 'LABOR'
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
    productId?: string | null
}

export interface Service {
    id: string
    type: ServiceType
    customerId: string
    customer: Customer
    vehicleId: string | null
    vehicle: Vehicle | null
    userId: string | null
    status: ServiceStatus
    description: string
    scheduledDate: string | null
    completedDate: string | null
    approvedAt: string | null
    expiresAt: string | null
    totalValue: number
    discount?: number | null
    notes: string | null
    tenantId: string
    createdAt: string
    updatedAt: string
    items: ServiceItem[]
    serviceMechanics: ServiceMechanic[]
    thirdPartyServices: ThirdPartyService[]
}

export interface ServiceStats {
    total: number
    pending: number
    inProgress: number
    completed: number
    cancelled: number
    totalRevenue: number
    pendingRevenue: number
}

export interface ServiceFormData {
    type: ServiceType
    customerId: string
    vehicleId?: string | null
    description: string
    status: ServiceStatus
    scheduledDate?: string | null
    notes?: string | null
}

export interface ServiceFormSubmitData extends ServiceFormData {
    mechanics: ServiceMechanic[]
    items: ServiceItem[]
    thirdPartyServices: ThirdPartyService[]
    totalValue: number
}

export interface CreateServiceDTO {
    customerId: string
    vehicleId?: string | null
    type?: ServiceType
    status?: ServiceStatus
    description: string
    scheduledDate?: string | null
    notes?: string | null
    items?: ServiceItem[]
    mechanics?: ServiceMechanic[]
    thirdPartyServices?: ThirdPartyService[]
}

export interface UpdateServiceDTO {
    type?: ServiceType
    status?: ServiceStatus
    description?: string
    customerId?: string
    vehicleId?: string | null
    totalValue?: number
    notes?: string | null
    scheduledDate?: string | null
    items: ServiceItem[]
    mechanics: ServiceMechanic[]
}