// app/api/vehicles/[id]/route.ts

import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { VehicleService } from '@/lib/services/vehicle.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody } from '@/lib/http/validate-request'
import { updateVehicleSchema } from '@/schemas'

/**
 * GET /api/vehicles/[id]
 * Busca veículo por ID
 */
export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'vehicles' })
    if (error) return error

    const vehicle = await VehicleService.findById(id, tenantId!, session?.user.id)

    return ApiResponse.success(vehicle)
  }
)

/**
 * PATCH /api/vehicles/[id]
 * Atualiza veículo com validação Zod
 */
export const PATCH = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'vehicles' })
    if (error) return error

    // Validar body com Zod schema
    const data = await validateRequestBody(req, updateVehicleSchema)

    // Atualizar veículo
    const vehicle = await VehicleService.update(id, data, tenantId!, session?.user.id)

    return ApiResponse.success(vehicle)
  }
)

/**
 * DELETE /api/vehicles/[id]
 * Exclui veículo (com verificação de dependências)
 */
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'vehicles' })
    if (error) return error

    const result = await VehicleService.delete(id, tenantId!, session?.user.id)

    return ApiResponse.success(result)
  }
)
