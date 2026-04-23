// lib/services/mechanic.service.ts

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { logger } from '@/lib/logger/logger'
import { ActivityService } from '@/lib/services/activity.service'
import { serializeDates } from '@/lib/utils/serialize'
import {
    PaginatedResponse,
    createPaginationMeta,
    calculateOffset,
} from '@/types/pagination'
import type { Mechanic, CreateMechanicDTO, UpdateMechanicDTO } from '@/types/mechanic'

/**
 * Opções de listagem de mecânicos
 */
export interface ListMechanicsOptions {
    search?: string
    status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
    page?: number
    limit?: number
}

/**
 * Service para gerenciamento de mecânicos
 */
export class MechanicService {
    /**
     * Lista mecânicos do tenant com paginação
     */
    static async listByTenant(
        tenantId: string,
        options: ListMechanicsOptions = {},
        userId?: string
    ): Promise<PaginatedResponse<Mechanic>> {
        const { search, status, page = 1, limit = 50 } = options

        logger.info('Listing mechanics by tenant', {
            tenantId,
            userId,
            action: 'MECHANIC_LIST',
            metadata: { search, status, page, limit },
        })

        // Construir filtros
        const where: Prisma.MechanicWhereInput = {
            tenantId,
            ...(status && { status }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { cpf: { contains: search } },
                    { phone: { contains: search } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { specialty: { contains: search, mode: 'insensitive' } },
                ],
            }),
        }

        // Buscar total e items
        const [total, items] = await Promise.all([
            prisma.mechanic.count({ where }),
            prisma.mechanic.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            serviceMechanics: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: calculateOffset(page, limit),
                take: limit,
            }),
        ])

        logger.info(`Found ${total} mechanics`, {
            tenantId,
            userId,
            action: 'MECHANIC_LISTED',
            metadata: { total, page, limit },
        })

        return {
            items: serializeDates(items) as unknown as Mechanic[],
            pagination: createPaginationMeta(total, page, limit),
        }
    }

    /**
     * Busca mecânico por ID
     */
    static async findById(
        mechanicId: string,
        tenantId: string,
        userId?: string
    ): Promise<Mechanic> {
        logger.info('Finding mechanic by ID', {
            tenantId,
            userId,
            action: 'MECHANIC_FIND_BY_ID',
            metadata: { mechanicId },
        })

        const mechanic = await prisma.mechanic.findFirst({
            where: { id: mechanicId, tenantId },
            include: {
                serviceMechanics: {
                    include: {
                        service: {
                            include: {
                                customer: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                vehicle: {
                                    select: {
                                        id: true,
                                        plate: true,
                                        brand: true,
                                        model: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                _count: {
                    select: {
                        serviceMechanics: true,
                    },
                },
            },
        })

        if (!mechanic) {
            logger.warn('Mechanic not found', {
                tenantId,
                userId,
                action: 'MECHANIC_NOT_FOUND',
                metadata: { mechanicId },
            })

            throw new AppError({
                code: ERROR_CODES.MECHANIC_NOT_FOUND,
                message: 'Mecânico não encontrado',
                statusCode: 404,
                metadata: { mechanicId },
            })
        }

        return serializeDates(mechanic) as unknown as Mechanic
    }

    /**
     * Cria novo mecânico
     */
    static async create(
        data: CreateMechanicDTO,
        tenantId: string,
        userId: string
    ): Promise<Mechanic> {
        logger.info('Creating new mechanic', {
            tenantId,
            userId,
            action: 'MECHANIC_CREATE_INIT',
            metadata: {
                name: data.name,
                hasCpf: !!data.cpf,
                specialty: data.specialty,
            },
        })

        // Verifica CPF duplicado
        if (data.cpf) {
            const existingMechanic = await prisma.mechanic.findFirst({
                where: {
                    cpf: data.cpf,
                    tenantId,
                },
            })

            if (existingMechanic) {
                logger.warn('Mechanic creation failed - duplicate CPF', {
                    tenantId,
                    userId,
                    action: 'MECHANIC_CREATE_DUPLICATE_CPF',
                    metadata: { cpf: data.cpf },
                })

                throw new AppError({
                    code: ERROR_CODES.MECHANIC_DUPLICATE_CPF,
                    message: 'Já existe um mecânico com este CPF',
                    statusCode: 409,
                    metadata: { cpf: data.cpf },
                })
            }
        }

        const mechanic = await prisma.mechanic.create({
            data: {
                name: data.name,
                cpf: data.cpf ?? null,
                phone: data.phone ?? null,
                email: data.email ?? null,
                specialty: data.specialty ?? null,
                commissionRate: data.commissionRate ?? 0,
                status: data.status ?? 'ACTIVE',
                notes: data.notes ?? null,
                tenantId,
            },
            include: {
                _count: {
                    select: {
                        serviceMechanics: true,
                    },
                },
            },
        })

        // Log de atividade
        await ActivityService.create({
            tenantId,
            userId,
            action: 'MECHANIC_CREATED',
            description: `Mecânico ${data.name} cadastrado`,
            metadata: {
                mechanicId: mechanic.id,
                name: data.name,
                cpf: data.cpf,
                specialty: data.specialty,
            },
        })

        logger.info('Mechanic created successfully', {
            tenantId,
            userId,
            action: 'MECHANIC_CREATED_SUCCESS',
            metadata: {
                mechanicId: mechanic.id,
                name: data.name,
            },
        })

        return serializeDates(mechanic) as unknown as Mechanic
    }

    /**
     * Atualiza mecânico
     */
    static async update(
        mechanicId: string,
        data: UpdateMechanicDTO,
        tenantId: string,
        userId?: string
    ): Promise<Mechanic> {
        logger.info('Updating mechanic', {
            tenantId,
            userId,
            action: 'MECHANIC_UPDATE_INIT',
            metadata: { mechanicId },
        })

        const existingMechanic = await prisma.mechanic.findFirst({
            where: { id: mechanicId, tenantId },
        })

        if (!existingMechanic) {
            logger.warn('Mechanic not found for update', {
                tenantId,
                userId,
                action: 'MECHANIC_UPDATE_NOT_FOUND',
                metadata: { mechanicId },
            })

            throw new AppError({
                code: ERROR_CODES.MECHANIC_NOT_FOUND,
                message: 'Mecânico não encontrado',
                statusCode: 404,
                metadata: { mechanicId },
            })
        }

        // Verifica CPF duplicado (se estiver alterando)
        if (data.cpf !== undefined && data.cpf && data.cpf !== existingMechanic.cpf) {
            const existingWithCpf = await prisma.mechanic.findFirst({
                where: {
                    cpf: data.cpf,
                    tenantId,
                    id: { not: mechanicId },
                },
            })

            if (existingWithCpf) {
                logger.warn('Mechanic update failed - duplicate CPF', {
                    tenantId,
                    userId,
                    action: 'MECHANIC_UPDATE_DUPLICATE_CPF',
                    metadata: { cpf: data.cpf },
                })

                throw new AppError({
                    code: ERROR_CODES.MECHANIC_DUPLICATE_CPF,
                    message: 'Já existe um mecânico com este CPF',
                    statusCode: 409,
                    metadata: { cpf: data.cpf },
                })
            }
        }

        // Construir objeto de atualização
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {}

        if (data.name !== undefined) updateData.name = data.name
        if (data.cpf !== undefined) updateData.cpf = data.cpf || null
        if (data.phone !== undefined) updateData.phone = data.phone || null
        if (data.email !== undefined) updateData.email = data.email || null
        if (data.specialty !== undefined) updateData.specialty = data.specialty || null
        if (data.commissionRate !== undefined) updateData.commissionRate = data.commissionRate ?? null
        if (data.status !== undefined) updateData.status = data.status
        if (data.notes !== undefined) updateData.notes = data.notes || null

        const mechanic = await prisma.mechanic.update({
            where: { id: mechanicId, tenantId },
            data: updateData,
            include: {
                _count: {
                    select: {
                        serviceMechanics: true,
                    },
                },
            },
        })

        // Log de atividade
        await ActivityService.create({
            tenantId,
            userId: userId || null,
            action: 'MECHANIC_UPDATED',
            description: `Mecânico ${mechanic.name} atualizado`,
            metadata: {
                mechanicId,
                name: mechanic.name,
                status: mechanic.status,
            },
        })

        logger.info('Mechanic updated successfully', {
            tenantId,
            userId,
            action: 'MECHANIC_UPDATED_SUCCESS',
            metadata: { mechanicId },
        })

        return serializeDates(mechanic) as unknown as Mechanic
    }

    /**
     * Exclui mecânico
     */
    static async delete(
        mechanicId: string,
        tenantId: string,
        userId?: string
    ): Promise<{ success: boolean; mechanicId: string }> {
        logger.info('Deleting mechanic', {
            tenantId,
            userId,
            action: 'MECHANIC_DELETE_INIT',
            metadata: { mechanicId },
        })

        const existingMechanic = await prisma.mechanic.findFirst({
            where: { id: mechanicId, tenantId },
            include: {
                _count: {
                    select: {
                        serviceMechanics: true,
                    },
                },
            },
        })

        if (!existingMechanic) {
            logger.warn('Mechanic not found for delete', {
                tenantId,
                userId,
                action: 'MECHANIC_DELETE_NOT_FOUND',
                metadata: { mechanicId },
            })

            throw new AppError({
                code: ERROR_CODES.MECHANIC_NOT_FOUND,
                message: 'Mecânico não encontrado',
                statusCode: 404,
                metadata: { mechanicId },
            })
        }

        // Verifica dependências
        if (existingMechanic._count.serviceMechanics > 0) {
            logger.warn('Mechanic delete failed - has dependencies', {
                tenantId,
                userId,
                action: 'MECHANIC_DELETE_HAS_DEPENDENCIES',
                metadata: {
                    mechanicId,
                    servicesCount: existingMechanic._count.serviceMechanics,
                },
            })

            throw new AppError({
                code: ERROR_CODES.MECHANIC_HAS_DEPENDENCIES,
                message: 'Não é possível excluir mecânico com serviços vinculados',
                statusCode: 409,
                metadata: {
                    servicesCount: existingMechanic._count.serviceMechanics,
                },
            })
        }

        await prisma.mechanic.delete({
            where: { id: mechanicId, tenantId },
        })

        // Log de atividade
        await ActivityService.create({
            tenantId,
            userId: userId || null,
            action: 'MECHANIC_DELETED',
            description: `Mecânico ${existingMechanic.name} excluído`,
            metadata: {
                mechanicId,
                name: existingMechanic.name,
            },
        })

        logger.info('Mechanic deleted successfully', {
            tenantId,
            userId,
            action: 'MECHANIC_DELETED_SUCCESS',
            metadata: { mechanicId },
        })

        return { success: true, mechanicId }
    }
}