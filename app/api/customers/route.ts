// app/api/customers/route.ts

import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { CustomerService } from '@/lib/services/customer.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody, validateQueryParams } from '@/lib/http/validate-request'
import { createCustomerSchema, listCustomersQuerySchema } from '@/schemas'

/**
 * GET /api/customers
 * Lista clientes do tenant com paginação e busca
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    // Validar query params (search, page, limit)
    const query = validateQueryParams(req, listCustomersQuerySchema)

    // Buscar clientes com paginação
    const result = await CustomerService.listByTenant(
        tenantId!,
        query,
        session?.user.id
    )

    return ApiResponse.success(result)
})

/**
 * POST /api/customers
 * Cria novo cliente com validação Zod
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    // Validar body com Zod schema
    const data = await validateRequestBody(req, createCustomerSchema)

    // Criar cliente
    const customer = await CustomerService.create(
        data,
        tenantId!,
        session!.user.id
    )

    return ApiResponse.success(customer, 201)
})