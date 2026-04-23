// types/tenant.ts

export type BusinessType = 'OFICINA' | 'RESTAURANTE' | 'ACADEMIA' | 'GENERICO'
export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL'

export interface Tenant {
    id: string
    name: string
    slug: string
    businessType: BusinessType
    status: TenantStatus
    logo?: string | null
    domain?: string | null
    maxUsers: number
    maxCustomers: number
    modules?: Record<string, unknown> | null
    trialEndsAt?: string | null
    createdAt: string
    updatedAt: string
    _count?: {
        users: number
        customers: number
        services: number
    }
}

export interface CreateTenantDTO {
    name: string
    slug: string
    businessType: BusinessType
    status?: TenantStatus
    maxUsers?: number
    maxCustomers?: number
    trialEndsAt?: string | null
}

export interface UpdateTenantDTO {
    name?: string
    status?: TenantStatus
    maxUsers?: number
    maxCustomers?: number
    trialEndsAt?: string | null
}