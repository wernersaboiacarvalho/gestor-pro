// types/mechanic.ts

export interface Mechanic {
    id: string
    name: string
    cpf?: string | null
    phone?: string | null
    email?: string | null
    specialty?: string | null
    commissionRate?: number | null
    status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
    notes?: string | null
    tenantId: string
    createdAt: string
    updatedAt: string
    _count?: {
        serviceMechanics: number
    }
}

export interface ServiceMechanic {
    id?: string
    mechanicId: string
    hoursWorked: number
    commission: number
    notes?: string | null
    mechanic?: Mechanic
}

export interface CreateMechanicDTO {
    name: string
    cpf?: string | null
    phone?: string | null
    email?: string | null
    specialty?: string | null
    commissionRate?: number | null
    status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
    notes?: string | null
}

export interface UpdateMechanicDTO {
    name?: string
    cpf?: string | null
    phone?: string | null
    email?: string | null
    specialty?: string | null
    commissionRate?: number | null
    status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
    notes?: string | null
}

export type MechanicStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'