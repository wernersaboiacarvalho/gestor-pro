// types/third-party-provider.ts

export interface ThirdPartyProvider {
    id: string
    name: string
    type: string
    contact?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    notes?: string | null
    tenantId: string
    createdAt: string
    updatedAt: string
    _count?: {
        services: number
    }
}

export interface ThirdPartyService {
    id?: string
    providerId: string
    description: string
    cost: number
    chargedValue: number
    status: 'PENDENTE' | 'ENVIADO' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'RETORNADO'
    sentAt?: string | null
    returnedAt?: string | null
    notes?: string | null
    provider?: ThirdPartyProvider
}

export interface CreateThirdPartyProviderDTO {
    name: string
    type: string
    contact?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    notes?: string | null
}

export interface UpdateThirdPartyProviderDTO {
    name?: string
    type?: string
    contact?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    notes?: string | null
}