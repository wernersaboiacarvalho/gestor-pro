// app/api/third-party-providers/[id]/route.ts

import { NextResponse } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { ThirdPartyProviderService } from '@/lib/services/third-party-provider.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/third-party-providers/[id] - Buscar parceiro específico
export const GET = withErrorHandling(async (request: Request, { params }: RouteParams) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    const { id } = await params

    const provider = await ThirdPartyProviderService.findById(id, tenantId!, session?.user?.id)

    return NextResponse.json({
        success: true,
        data: { provider },
    })
})

// PATCH /api/third-party-providers/[id] - Atualizar parceiro
export const PATCH = withErrorHandling(async (request: Request, { params }: RouteParams) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    const { id } = await params
    const body = await request.json()

    const provider = await ThirdPartyProviderService.update(
        id,
        {
            name: body.name,
            type: body.type,
            contact: body.contact ?? null,
            phone: body.phone ?? null,
            email: body.email ?? null,
            address: body.address ?? null,
            notes: body.notes ?? null,
        },
        tenantId!,
        session?.user?.id
    )

    return NextResponse.json({
        success: true,
        data: { provider },
    })
})

// DELETE /api/third-party-providers/[id] - Excluir parceiro
export const DELETE = withErrorHandling(async (request: Request, { params }: RouteParams) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    const { id } = await params

    const result = await ThirdPartyProviderService.delete(id, tenantId!, session?.user?.id)

    return NextResponse.json({
        success: true,
        data: result,
    })
})