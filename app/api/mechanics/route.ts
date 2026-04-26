// app/api/mechanics/route.ts

import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { MechanicService } from '@/lib/services/mechanic.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { validateRequestBody, validateQueryParams } from '@/lib/http/validate-request'
import { ApiResponse } from '@/lib/http/api-response'
import { createMechanicSchema, listMechanicsQuerySchema } from '@/schemas/mechanic.schema'

/**
 * GET /api/mechanics
 * Lista mecânicos do tenant com paginação
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'mechanics' })
  if (error) return error

  // Validar query params
  const query = validateQueryParams(req, listMechanicsQuerySchema)

  // Buscar mecânicos
  const result = await MechanicService.listByTenant(tenantId!, query, session?.user.id)

  return ApiResponse.success(result)
})

/**
 * POST /api/mechanics
 * Cria novo mecânico
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'mechanics' })
  if (error) return error

  // Validar body com Zod
  const data = await validateRequestBody(req, createMechanicSchema)

  // Criar mecânico
  const mechanic = await MechanicService.create(data, tenantId!, session!.user.id)

  return ApiResponse.success(mechanic, 201)
})
