// lib/errors/error-handler.ts
import { NextResponse } from 'next/server'
import { AppError } from './app-error'
import { logger } from '@/lib/logger/logger'
import { ERROR_CODES } from './error-codes'

interface ErrorDetails {
    code: string
    message: string
    statusCode: number
    metadata?: Record<string, unknown>
}

export function handleApiError(error: unknown, context?: { tenantId?: string; userId?: string }) {
    let errorDetails: ErrorDetails

    // Log do erro
    logger.error('API Error caught', {
        ...context,
        metadata: {
            errorType: error instanceof Error ? error.constructor.name : 'Unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
        },
    })

    if (error instanceof AppError) {
        errorDetails = {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode,
            metadata: error.metadata,
        }

        // Log específico para AppError
        logger.logAppError(error, context)
    } else if (error instanceof Error) {
        errorDetails = {
            code: ERROR_CODES.INTERNAL_SERVER_ERROR,
            message: error.message || 'Erro interno do servidor',
            statusCode: 500,
            metadata: {
                stack: error.stack,
            },
        }

        // Log de erro genérico
        logger.error(`Unhandled error: ${error.message}`, {
            ...context,
            metadata: {
                stack: error.stack,
                errorName: error.name,
            },
        })
    } else {
        errorDetails = {
            code: ERROR_CODES.INTERNAL_SERVER_ERROR,
            message: 'Erro desconhecido',
            statusCode: 500,
            metadata: {
                rawError: String(error),
            },
        }

        logger.error('Unknown error type', {
            ...context,
            metadata: {
                rawError: String(error),
            },
        })
    }

    return NextResponse.json(
        {
            success: false,
            error: errorDetails,
        },
        { status: errorDetails.statusCode }
    )
}

// =============================
// WRAPPER PARA SERVER COMPONENTS
// =============================
export async function handleServerComponentError<T>(
    fn: () => Promise<T>,
    fallback: T,
    context?: { tenantId?: string; userId?: string }
): Promise<T> {
    try {
        return await fn()
    } catch (error) {
        handleApiError(error, context)
        return fallback
    }
}