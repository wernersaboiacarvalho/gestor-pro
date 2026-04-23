// types/pagination.ts

/**
 * 📄 Types de Paginação
 * Sistema padronizado de paginação para todas as listagens
 */

export interface PaginationParams {
    page?: number
    limit?: number
}

export interface PaginationMeta {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

export interface PaginatedResponse<T> {
    items: T[]
    pagination: PaginationMeta
}

/**
 * Helper para criar metadata de paginação
 */
export function createPaginationMeta(
    total: number,
    page: number,
    limit: number
): PaginationMeta {
    const totalPages = Math.ceil(total / limit)
    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    }
}

/**
 * Helper para calcular offset baseado em page/limit
 */
export function calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit
}