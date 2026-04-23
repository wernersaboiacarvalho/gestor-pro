// lib/services/activity.service.ts

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface CreateActivityDTO {
    tenantId?: string | null
    userId?: string | null
    action: string
    description: string
    metadata?: Prisma.InputJsonValue
}

export interface ListActivitiesDTO {
    tenantId?: string
    userId?: string
    limit?: number
    skip?: number
}

export class ActivityService {

    // =============================
    // CRIAR ATIVIDADE
    // =============================
    static async create(data: CreateActivityDTO) {
        try {
            return await prisma.activity.create({
                data: {
                    tenantId: data.tenantId ?? null,
                    userId: data.userId ?? null,
                    action: data.action,
                    description: data.description,
                    metadata: data.metadata ?? Prisma.JsonNull, // ← MUDANÇA AQUI
                },
            })
        } catch (error) {
            // Não lançamos erro para não quebrar o fluxo principal
            // Apenas logamos o erro de forma silenciosa
            console.error('[ActivityService] Failed to create activity:', error)
            return null
        }
    }

    // =============================
    // LISTAR ATIVIDADES
    // =============================
    static async listByTenant(tenantId: string, options?: { limit?: number; skip?: number }) {
        const limit = options?.limit ?? 50
        const skip = options?.skip ?? 0

        return prisma.activity.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        })
    }

    // =============================
    // LISTAR ATIVIDADES POR USUÁRIO
    // =============================
    static async listByUser(userId: string, options?: { limit?: number; skip?: number }) {
        const limit = options?.limit ?? 50
        const skip = options?.skip ?? 0

        return prisma.activity.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        })
    }

    // =============================
    // CONTAR ATIVIDADES
    // =============================
    static async countByTenant(tenantId: string) {
        return prisma.activity.count({
            where: { tenantId },
        })
    }

    // =============================
    // BUSCAR ATIVIDADES POR AÇÃO
    // =============================
    static async findByAction(tenantId: string, action: string, limit?: number) {
        return prisma.activity.findMany({
            where: {
                tenantId,
                action,
            },
            orderBy: { createdAt: 'desc' },
            take: limit ?? 20,
        })
    }

    // =============================
    // LIMPAR ATIVIDADES ANTIGAS
    // =============================
    // Útil para manter o banco limpo (ex: manter apenas últimos 90 dias)
    static async cleanupOldActivities(tenantId: string, daysToKeep: number = 90) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

        const result = await prisma.activity.deleteMany({
            where: {
                tenantId,
                createdAt: {
                    lt: cutoffDate,
                },
            },
        })

        return result.count
    }
}