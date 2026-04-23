import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors/error-handler'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

type RouteHandler = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
) => Promise<NextResponse>

export function withErrorHandling<T extends RouteHandler>(
    handler: T
) {
    return async (...args: Parameters<T>): Promise<NextResponse> => {
        try {
            return await handler(...args)
        } catch (error) {
            // Tenta extrair contexto da sessão para logs mais ricos
            let context: { tenantId?: string; userId?: string } = {}

            try {
                const session = await getServerSession(authOptions)
                if (session?.user) {
                    context = {
                        userId: session.user.id,
                        tenantId: session.user.tenantId ?? undefined,
                    }
                }
            } catch {
                // Ignora erro de sessão - não podemos quebrar o tratamento de erro
            }

            return handleApiError(error, context)
        }
    }
}

// =============================
// WRAPPER COM CONTEXTO EXPLÍCITO
// =============================
export function withErrorHandlingAndContext<T extends RouteHandler>(
    handler: T,
    context: { tenantId?: string; userId?: string }
) {
    return async (...args: Parameters<T>): Promise<NextResponse> => {
        try {
            return await handler(...args)
        } catch (error) {
            return handleApiError(error, context)
        }
    }
}