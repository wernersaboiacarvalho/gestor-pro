// lib/errors/app-error.ts
import type { ErrorCode } from './error-codes'

export interface AppErrorOptions {
    message: string
    code: ErrorCode
    statusCode?: number
    metadata?: Record<string, unknown>
}

export class AppError extends Error {
    public readonly code: string
    public readonly statusCode: number
    public readonly metadata?: Record<string, unknown>

    constructor(options: AppErrorOptions) {
        super(options.message)

        this.name = 'AppError'
        this.code = options.code
        this.statusCode = options.statusCode || 400
        this.metadata = options.metadata

        Object.setPrototypeOf(this, AppError.prototype)
    }
}