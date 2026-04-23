// app/api/products/route.ts

import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { ProductService } from '@/lib/services/product.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody, validateQueryParams } from '@/lib/http/validate-request'
import {
    createProductSchema,
    listProductsQuerySchema,
    type CreateProductInput,
    type ListProductsQuery,
} from '@/schemas/product.schema'

// ============================================
// GET /api/products - Listar produtos com paginação
// ============================================
export const GET = withErrorHandling(async (req: NextRequest) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    const query = validateQueryParams(req, listProductsQuerySchema) as ListProductsQuery

    const result = await ProductService.listByTenant(
        tenantId!,
        {
            search: query.search,
            categoryId: query.categoryId,
            lowStock: query.lowStock,
            page: query.page,
            limit: query.limit,
        },
        session?.user?.id
    )

    return ApiResponse.success(result)
})

// ============================================
// POST /api/products - Criar novo produto
// ============================================
export const POST = withErrorHandling(async (req: NextRequest) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    const data = await validateRequestBody(req, createProductSchema) as CreateProductInput

    const product = await ProductService.create(
        {
            name: data.name,
            description: data.description,
            sku: data.sku,
            barcode: data.barcode,
            costPrice: data.costPrice,
            price: data.price,
            stock: data.stock,
            minStock: data.minStock,
            maxStock: data.maxStock,
            location: data.location,
            supplier: data.supplier,
            categoryId: data.categoryId,
        },
        tenantId!,
        session!.user.id
    )

    return ApiResponse.success(product, 201)
})