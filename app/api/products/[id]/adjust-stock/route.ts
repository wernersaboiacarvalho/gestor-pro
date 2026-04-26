// app/api/products/[id]/adjust-stock/route.ts

import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { ProductService } from '@/lib/services/product.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody } from '@/lib/http/validate-request'
import { adjustStockSchema, type AdjustStockInput } from '@/schemas/product.schema'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ============================================
// POST /api/products/[id]/adjust-stock - Ajustar estoque
// ============================================
export const POST = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'products' })
  if (error) return error

  const { id } = await params
  const data = (await validateRequestBody(req, adjustStockSchema)) as AdjustStockInput

  const result = await ProductService.adjustStock(
    id,
    data.quantity,
    data.type,
    data.reason,
    tenantId!,
    session!.user.id,
    data.reference || undefined
  )

  return ApiResponse.success(result)
})
