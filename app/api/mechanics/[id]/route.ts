// app/api/mechanics/[id]/route.ts

import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { MechanicService } from '@/lib/services/mechanic.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { validateRequestBody } from '@/lib/http/validate-request'
import { ApiResponse } from '@/lib/http/api-response'
import { updateMechanicSchema } from '@/schemas/mechanic.schema'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/mechanics/[id]
 * Busca mecânico por ID
 */
export const GET = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'mechanics' })
  if (error) return error

  const { id } = await params

  const mechanic = await MechanicService.findById(id, tenantId!, session?.user.id)

  return ApiResponse.success(mechanic)
})

/**
 * PATCH /api/mechanics/[id]
 * Atualiza mecânico
 */
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'mechanics' })
  if (error) return error

  const { id } = await params

  // Validar body com Zod
  const data = await validateRequestBody(req, updateMechanicSchema)

  const mechanic = await MechanicService.update(id, data, tenantId!, session?.user.id)

  return ApiResponse.success(mechanic)
})

/**
 * DELETE /api/mechanics/[id]
 * Exclui mecânico
 */
export const DELETE = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'mechanics' })
  if (error) return error

  const { id } = await params

  const result = await MechanicService.delete(id, tenantId!, session?.user.id)

  return ApiResponse.success(result)
})
