// app/api/third-party-providers/route.ts
import { NextResponse } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { ThirdPartyProviderService } from '@/lib/services/third-party-provider.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'

// GET /api/third-party-providers - Listar todos os parceiros
export const GET = withErrorHandling(async () => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    const providers = await ThirdPartyProviderService.listByTenant(tenantId!, session?.user?.id)

    return NextResponse.json({
        success: true,
        data: {
            providers,
            count: providers.length,
        },
    })
})

// POST /api/third-party-providers - Criar novo parceiro
export const POST = withErrorHandling(async (request: Request) => {
    const { error, tenantId, session } = await getTenantSession()
    if (error) return error

    const body = await request.json()

    const { name, type, contact, phone, email, address, notes } = body

    if (!name || !type) {
        throw new AppError({
            code: ERROR_CODES.INVALID_REQUEST,
            message: 'Nome e tipo são obrigatórios',
            statusCode: 400,
        })
    }

    const provider = await ThirdPartyProviderService.create(
        {
            name,
            type,
            contact: contact ?? null,
            phone: phone ?? null,
            email: email ?? null,
            address: address ?? null,
            notes: notes ?? null,
        },
        tenantId!,
        session!.user.id
    )

    return NextResponse.json(
        {
            success: true,
            data: { provider },
        },
        { status: 201 }
    )
})