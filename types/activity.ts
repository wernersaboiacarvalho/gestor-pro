// types/activity.ts

export interface Activity {
    id: string
    tenantId: string | null
    userId: string | null
    action: string
    description: string
    metadata?: Record<string, unknown> | null
    createdAt: string
    user?: {
        id: string
        name: string
        email: string
        role: string
    } | null
    tenant?: {
        id: string
        name: string
        slug: string
    } | null
}

export interface CreateActivityDTO {
    tenantId?: string | null
    userId?: string | null
    action: string
    description: string
    metadata?: Record<string, unknown> | null
}

export interface ListActivitiesDTO {
    tenantId?: string
    userId?: string
    limit?: number
    skip?: number
}