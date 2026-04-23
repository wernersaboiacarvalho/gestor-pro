// types/vehicle.ts

/**
 * Vehicle serializado para API (Date -> string)
 */
export interface Vehicle {
    id: string
    plate: string
    brand: string
    model: string
    year: number
    color: string | null
    chassis: string | null
    renavam: string | null
    km: number | null
    category: 'CARRO' | 'MOTO' | 'CAMINHAO' | 'OUTRO'
    specifications: Record<string, unknown> | null
    notes: string | null
    customerId: string
    tenantId: string
    createdAt: string
    updatedAt: string
    customer?: {
        id: string
        name: string
        phone: string
    }
    _count?: {
        services: number
    }
}

export type VehicleCategory = 'CARRO' | 'MOTO' | 'CAMINHAO' | 'OUTRO'

export interface CreateVehicleDTO {
    plate: string
    brand: string
    model: string
    year: number
    color?: string | null
    chassis?: string | null
    renavam?: string | null
    km?: number | null
    category?: VehicleCategory
    specifications?: Record<string, unknown> | null
    notes?: string | null
    customerId: string
}

export interface UpdateVehicleDTO {
    plate?: string
    brand?: string
    model?: string
    year?: number
    color?: string | null
    chassis?: string | null
    renavam?: string | null
    km?: number | null
    category?: VehicleCategory
    specifications?: Record<string, unknown> | null
    notes?: string | null
    customerId?: string
}