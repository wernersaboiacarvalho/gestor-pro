// lib/utils/serialize.ts

/**
 * Converte Date para string (ISO) em objetos Prisma
 * Útil para serializar dados do banco antes de enviar para o cliente
 */
export function serializeDates<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj

    if (obj instanceof Date) {
        return obj.toISOString() as unknown as T
    }

    if (Array.isArray(obj)) {
        return obj.map(item => serializeDates(item)) as unknown as T
    }

    if (typeof obj === 'object') {
        const serialized: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(obj)) {
            serialized[key] = serializeDates(value)
        }
        return serialized as T
    }

    return obj
}