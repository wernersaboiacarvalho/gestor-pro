// types/customer.ts

import type { Vehicle } from "@prisma/client"

/**
 * Customer serializado para API (Date -> string)
 */
export interface Customer {
    id: string
    name: string
    email: string | null
    phone: string
    cpf: string | null
    address: string | null
    notes: string | null
    tenantId: string
    createdAt: string
    updatedAt: string
    vehicles?: Vehicle[]
    _count?: {
        services: number
        vehicles: number
    }
}

export interface CreateCustomerDTO {
    name: string
    email?: string | null
    phone: string
    cpf?: string | null
    address?: string | null
    notes?: string | null
}

export interface UpdateCustomerDTO {
    name?: string
    email?: string | null
    phone?: string
    cpf?: string | null
    address?: string | null
    notes?: string | null
}