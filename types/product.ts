// types/product.ts

import { PaginatedResponse } from './pagination'

export interface Product {
    id: string
    name: string
    description?: string | null
    sku?: string | null
    barcode?: string | null
    costPrice?: number | null
    price: number
    stock: number
    minStock?: number | null
    maxStock?: number | null
    location?: string | null
    supplier?: string | null
    categoryId?: string | null
    category?: Category | null
    tenantId: string
    createdAt: string
    updatedAt: string
    _count?: {
        serviceItems: number
    }
}

export interface Category {
    id: string
    name: string
    description?: string | null
    tenantId: string
}

export interface StockMovement {
    id: string
    productId: string
    type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'DEVOLUCAO'
    quantity: number
    reason: string
    reference?: string | null
    userId?: string | null
    user?: {
        id: string
        name: string
    } | null
    tenantId: string
    createdAt: string
}

export interface CreateProductDTO {
    name: string
    description?: string | null
    sku?: string | null
    barcode?: string | null
    costPrice?: number | null
    price: number
    stock?: number
    minStock?: number | null
    maxStock?: number | null
    location?: string | null
    supplier?: string | null
    categoryId?: string | null
}

export interface UpdateProductDTO {
    name?: string
    description?: string | null
    sku?: string | null
    barcode?: string | null
    costPrice?: number | null
    price?: number
    stock?: number
    minStock?: number | null
    maxStock?: number | null
    location?: string | null
    supplier?: string | null
    categoryId?: string | null
}

export interface AdjustStockDTO {
    quantity: number
    type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'DEVOLUCAO'
    reason: string
    reference?: string | null
}

// ============================================
// NOVO: Opções de listagem com paginação
// ============================================
export interface ListProductsOptions {
    search?: string
    categoryId?: string
    lowStock?: boolean
    minPrice?: number
    maxPrice?: number
    sortBy?: 'name' | 'price' | 'stock' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
}

export type PaginatedProductsResponse = PaginatedResponse<Product>