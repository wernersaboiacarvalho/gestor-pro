// lib/http/validate-request.ts

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'

/**
 * Valida o body de uma request usando Zod schema
 * @throws AppError com código VALIDATION_ERROR se inválido
 */
export async function validateRequestBody<T extends z.ZodSchema>(
    req: NextRequest,
    schema: T
): Promise<z.infer<T>> {
    try {
        const body = await req.json()
        return schema.parse(body)
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Formata erros do Zod para ficar mais legível
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
            }))

            throw new AppError({
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Dados inválidos',
                statusCode: 400,
                metadata: { errors: formattedErrors }
            })
        }
        throw error
    }
}

/**
 * Valida query params de uma request usando Zod schema
 * @throws AppError com código VALIDATION_ERROR se inválido
 */
export function validateQueryParams<T extends z.ZodSchema>(
    req: NextRequest,
    schema: T
): z.infer<T> {
    try {
        const { searchParams } = new URL(req.url)
        const params = Object.fromEntries(searchParams.entries())
        return schema.parse(params)
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
            }))

            throw new AppError({
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Parâmetros de consulta inválidos',
                statusCode: 400,
                metadata: { errors: formattedErrors }
            })
        }
        throw error
    }
}