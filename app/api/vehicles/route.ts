// app/api/vehicles/route.ts

import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { VehicleService } from '@/lib/services/vehicle.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody, validateQueryParams } from '@/lib/http/validate-request'
import { createVehicleSchema, listVehiclesQuerySchema } from '@/schemas'

/**
 * GET /api/vehicles
 * Lista veículos do tenant com paginação e busca
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    // Validar query params
    const query = validateQueryParams(req, listVehiclesQuerySchema)

    // Buscar veículos com paginação
    const result = await VehicleService.listByTenant(
        tenantId!,
        query,
        session?.user.id
    )

    return ApiResponse.success(result)
})

/**
 * POST /api/vehicles
 * Cria novo veículo com validação Zod
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    // Validar body com Zod schema
    const data = await validateRequestBody(req, createVehicleSchema)

    // Criar veículo
    const vehicle = await VehicleService.create(
        data,
        tenantId!,
        session!.user.id
    )

    return ApiResponse.success(vehicle, 201)
})