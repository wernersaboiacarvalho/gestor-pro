// app/api/products/[id]/route.ts

import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { ProductService } from '@/lib/services/product.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody } from '@/lib/http/validate-request'
import { updateProductSchema, type UpdateProductInput } from '@/schemas/product.schema'

interface RouteParams {
    params: Promise<{ id: string }>
}

// ============================================
// GET /api/products/[id] - Buscar produto específico
// ============================================
export const GET = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    const { id } = await params

    const product = await ProductService.findById(id, tenantId!, session?.user?.id)

    return ApiResponse.success(product)
})

// ============================================
// PATCH /api/products/[id] - Atualizar produto
// ============================================
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    const { id } = await params
    const data = await validateRequestBody(req, updateProductSchema) as UpdateProductInput

    const product = await ProductService.update(
        id,
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
        session?.user?.id
    )

    return ApiResponse.success(product)
})

// ============================================
// DELETE /api/products/[id] - Excluir produto
// ============================================
export const DELETE = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    const { id } = await params

    const result = await ProductService.delete(id, tenantId!, session?.user?.id)

    return ApiResponse.success(result)
})