// lib/http/api-response.ts
import { NextResponse } from 'next/server'
import type { ErrorCode } from '@/lib/errors/error-codes'

export class ApiResponse {

    static success<T>(data: T, status: number = 200) {
        return NextResponse.json(
            {
                success: true,
                data,
            },
            { status }
        )
    }

    static message(message: string, status: number = 200) {
        return NextResponse.json(
            {
                success: true,
                message,
            },
            { status }
        )
    }

    // ✅ Novo método para respostas de erro padronizadas
    static error(code: ErrorCode, message: string, statusCode: number = 400, metadata?: Record<string, unknown>) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code,
                    message,
                    statusCode,
                    metadata,
                },
            },
            { status: statusCode }
        )
    }
}