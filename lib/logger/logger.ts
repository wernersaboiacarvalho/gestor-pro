// lib/logger/logger.ts

import { ActivityService } from '@/lib/services/activity.service'
import { Prisma } from '@prisma/client'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogContext {
    tenantId?: string | null
    userId?: string | null
    action?: string
    metadata?: Prisma.InputJsonValue
}

export interface LogEntry {
    level: LogLevel
    message: string
    timestamp: string
    tenantId: string | null
    userId: string | null
    action: string | null
    metadata: Prisma.InputJsonValue | null
}

class Logger {

    private baseContext?: LogContext
    private persistToDb: boolean

    constructor(baseContext?: LogContext, persistToDb?: boolean) {
        this.baseContext = baseContext
        // Só persiste no banco em produção ou se explicitamente configurado
        this.persistToDb = persistToDb ?? process.env.NODE_ENV === 'production'
    }

    withContext(context: LogContext) {
        return new Logger({
            ...this.baseContext,
            ...context,
        }, this.persistToDb)
    }

    withPersistence(persist: boolean) {
        return new Logger(this.baseContext, persist)
    }

    private format(level: LogLevel, message: string, context?: LogContext): LogEntry {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            tenantId: context?.tenantId ?? this.baseContext?.tenantId ?? null,
            userId: context?.userId ?? this.baseContext?.userId ?? null,
            action: context?.action ?? this.baseContext?.action ?? null,
            metadata: context?.metadata ?? this.baseContext?.metadata ?? null,
        }
    }

    private async persistToDatabase(entry: LogEntry) {
        if (!this.persistToDb) return

        try {
            const actionMap: Record<LogLevel, string> = {
                info: 'LOG_INFO',
                warn: 'LOG_WARN',
                error: 'LOG_ERROR',
                debug: 'LOG_DEBUG',
            }

            // Serializa o metadata para garantir compatibilidade com Prisma.InputJsonValue
            const metadata = entry.metadata
                ? (JSON.parse(JSON.stringify(entry.metadata)) as Prisma.InputJsonValue)
                : undefined

            await ActivityService.create({
                tenantId: entry.tenantId,
                userId: entry.userId,
                action: entry.action ?? actionMap[entry.level],
                description: entry.message,
                metadata,
            })
        } catch (error) {
            console.error('[Logger] Failed to persist log to database:', error)
        }
    }

    info(message: string, context?: LogContext) {
        const entry = this.format('info', message, context)
        console.log(JSON.stringify(entry))
        this.persistToDatabase(entry)
    }

    warn(message: string, context?: LogContext) {
        const entry = this.format('warn', message, context)
        console.warn(JSON.stringify(entry))
        this.persistToDatabase(entry)
    }

    error(message: string, context?: LogContext) {
        const entry = this.format('error', message, context)
        console.error(JSON.stringify(entry))
        this.persistToDatabase(entry)
    }

    debug(message: string, context?: LogContext) {
        if (process.env.NODE_ENV !== 'production') {
            const entry = this.format('debug', message, context)
            console.debug(JSON.stringify(entry))
        }
    }

    // =============================
    // MÉTODO ESPECÍFICO PARA ATIVIDADES DE NEGÓCIO
    // =============================
    // Este método SEMPRE persiste no banco, independente do ambiente
    async logActivity(
        action: string,
        description: string,
        context?: Omit<LogContext, 'action'>
    ) {
        const entry = this.format('info', description, {
            ...context,
            action,
        })

        // Sempre loga no console
        console.log(JSON.stringify({
            ...entry,
            type: 'ACTIVITY',
        }))

        // Sempre persiste no banco (é uma atividade de negócio)
        await this.persistToDatabase(entry)
    }

    // =============================
    // MÉTODO PARA LOGAR ERROS DE APPERROR
    // =============================
    async logAppError(
        error: Error & { code?: string; statusCode?: number; metadata?: Record<string, unknown> },
        context?: LogContext
    ) {
        const entry = this.format('error', error.message, {
            ...context,
            metadata: {
                ...(context?.metadata as Record<string, unknown>),
                errorCode: error.code ?? 'UNKNOWN_ERROR',
                statusCode: error.statusCode ?? 500,
                errorMetadata: error.metadata ?? {},
                stack: error.stack,
            } as Prisma.InputJsonValue,
        })

        console.error(JSON.stringify(entry))
        await this.persistToDatabase(entry)
    }
}

export const logger = new Logger()

// Exporta uma instância com persistência forçada (para usar em services)
export const persistentLogger = new Logger(undefined, true)