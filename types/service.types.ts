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
    type: 'PART' | 'LABOR'
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
}

export interface ServiceMechanic {
    mechanicId: string
    hoursWorked: number
    commission: number
    notes?: string
}

export interface ThirdPartyService {
    providerId: string
    description: string
    cost: number
    chargedValue: number
    status: string
}

export interface Service {
    id: string
    type: 'ORCAMENTO' | 'ORDEM_SERVICO'
    customerId: string
    customer: { name: string }
    vehicle: { plate: string; model: string; brand: string } | null
    serviceMechanics: ServiceMechanic[]
    items: ServiceItem[]
    description: string
    status: string
    totalValue: number
    notes: string | null
    scheduledDate: string | null
    vehicleId: string | null
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