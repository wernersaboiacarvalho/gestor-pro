// lib/services/third-party-provider.service.ts

import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { logger } from '@/lib/logger/logger'
import { ActivityService } from '@/lib/services/activity.service'

export interface CreateThirdPartyProviderDTO {
    name: string
    type: string
    contact?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    notes?: string | null
}

export interface UpdateThirdPartyProviderDTO {
    name?: string
    type?: string
    contact?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    notes?: string | null
}

export class ThirdPartyProviderService {

    // =============================
    // LISTAR
    // =============================
    static async listByTenant(tenantId: string, userId?: string) {
        logger.info('Listing third party providers by tenant', {
            tenantId,
            userId,
            action: 'THIRD_PARTY_LIST',
        })

        const providers = await prisma.thirdPartyProvider.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: {
                        services: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        })

        logger.info(`Found ${providers.length} third party providers`, {
            tenantId,
            userId,
            action: 'THIRD_PARTY_LISTED',
            metadata: { count: providers.length },
        })

        return providers
    }

    // =============================
    // BUSCAR POR ID
    // =============================
    static async findById(providerId: string, tenantId: string, userId?: string) {
        logger.info('Finding third party provider by ID', {
            tenantId,
            userId,
            action: 'THIRD_PARTY_FIND_BY_ID',
            metadata: { providerId },
        })

        const provider = await prisma.thirdPartyProvider.findFirst({
            where: { id: providerId, tenantId },
            include: {
                _count: {
                    select: {
                        services: true,
                    },
                },
                services: {
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
            },
        })

        if (!provider) {
            logger.warn('Third party provider not found', {
                tenantId,
                userId,
                action: 'THIRD_PARTY_NOT_FOUND',
                metadata: { providerId },
            })

            throw new AppError({
                code: ERROR_CODES.THIRD_PARTY_NOT_FOUND,
                message: 'Parceiro terceirizado não encontrado',
                statusCode: 404,
                metadata: { providerId },
            })
        }

        return provider
    }

    // =============================
    // CRIAR
    // =============================
    static async create(
        data: CreateThirdPartyProviderDTO,
        tenantId: string,
        userId: string
    ) {
        logger.info('Creating new third party provider', {
            tenantId,
            userId,
            action: 'THIRD_PARTY_CREATE_INIT',
            metadata: {
                name: data.name,
                type: data.type,
            },
        })

        const provider = await prisma.thirdPartyProvider.create({
            data: {
                name: data.name,
                type: data.type,
                contact: data.contact ?? null,
                phone: data.phone ?? null,
                email: data.email ?? null,
                address: data.address ?? null,
                notes: data.notes ?? null,
                tenantId,
            },
        })

        // Log de atividade de negócio
        await logger.logActivity('THIRD_PARTY_CREATED', 'Novo parceiro terceirizado cadastrado', {
            tenantId,
            userId,
            metadata: {
                providerId: provider.id,
                name: data.name,
                type: data.type,
            },
        })

        await ActivityService.create({
            tenantId,
            userId,
            action: 'THIRD_PARTY_CREATED',
            description: `Parceiro ${data.name} (${data.type}) cadastrado`,
            metadata: {
                providerId: provider.id,
                name: data.name,
                type: data.type,
            },
        })

        logger.info('Third party provider created successfully', {
            tenantId,
            userId,
            action: 'THIRD_PARTY_CREATED_SUCCESS',
            metadata: {
                providerId: provider.id,
                name: data.name,
            },
        })

        return provider
    }

    // =============================
    // ATUALIZAR
    // =============================
    static async update(
        providerId: string,
        data: UpdateThirdPartyProviderDTO,
        tenantId: string,
        userId?: string
    ) {
        logger.info('Updating third party provider', {
            tenantId,
            userId,
            action: 'THIRD_PARTY_UPDATE_INIT',
            metadata: { providerId },
        })

        const existingProvider = await prisma.thirdPartyProvider.findFirst({
            where: { id: providerId, tenantId },
        })

        if (!existingProvider) {
            logger.warn('Third party provider not found for update', {
                tenantId,
                userId,
                action: 'THIRD_PARTY_UPDATE_NOT_FOUND',
                metadata: { providerId },
            })

            throw new AppError({
                code: ERROR_CODES.THIRD_PARTY_NOT_FOUND,
                message: 'Parceiro terceirizado não encontrado',
                statusCode: 404,
                metadata: { providerId },
            })
        }

        const provider = await prisma.thirdPartyProvider.update({
            where: { id: providerId, tenantId },
            data: {
                name: data.name,
                type: data.type,
                contact: data.contact ?? null,
                phone: data.phone ?? null,
                email: data.email ?? null,
                address: data.address ?? null,
                notes: data.notes ?? null,
            },
        })

        // Log de atividade de negócio
        await logger.logActivity('THIRD_PARTY_UPDATED', 'Parceiro terceirizado atualizado', {
            tenantId,
            userId,
            metadata: {
                providerId,
                name: provider.name,
            },
        })

        await ActivityService.create({
            tenantId,
            userId: userId || null,
            action: 'THIRD_PARTY_UPDATED',
            description: `Parceiro ${provider.name} atualizado`,
            metadata: {
                providerId,
                name: provider.name,
            },
        })

        logger.info('Third party provider updated successfully', {
            tenantId,
            userId,
            action: 'THIRD_PARTY_UPDATED_SUCCESS',
            metadata: { providerId },
        })

        return provider
    }

    // =============================
    // EXCLUIR
    // =============================
    static async delete(providerId: string, tenantId: string, userId?: string) {
        logger.info('Deleting third party provider', {
            tenantId,
            userId,
            action: 'THIRD_PARTY_DELETE_INIT',
            metadata: { providerId },
        })

        const existingProvider = await prisma.thirdPartyProvider.findFirst({
            where: { id: providerId, tenantId },
            include: {
                _count: {
                    select: {
                        services: true,
                    },
                },
            },
        })

        if (!existingProvider) {
            logger.warn('Third party provider not found for delete', {
                tenantId,
                userId,
                action: 'THIRD_PARTY_DELETE_NOT_FOUND',
                metadata: { providerId },
            })

            throw new AppError({
                code: ERROR_CODES.THIRD_PARTY_NOT_FOUND,
                message: 'Parceiro terceirizado não encontrado',
                statusCode: 404,
                metadata: { providerId },
            })
        }

        // Verifica dependências
        if (existingProvider._count.services > 0) {
            logger.warn('Third party provider delete failed - has dependencies', {
                tenantId,
                userId,
                action: 'THIRD_PARTY_DELETE_HAS_DEPENDENCIES',
                metadata: {
                    providerId,
                    servicesCount: existingProvider._count.services,
                },
            })

            throw new AppError({
                code: ERROR_CODES.THIRD_PARTY_HAS_DEPENDENCIES,
                message: 'Não é possível excluir parceiro com serviços vinculados',
                statusCode: 409,
                metadata: {
                    servicesCount: existingProvider._count.services,
                },
            })
        }

        await prisma.thirdPartyProvider.delete({
            where: { id: providerId, tenantId },
        })

        // Log de atividade de negócio
        await logger.logActivity('THIRD_PARTY_DELETED', 'Parceiro terceirizado excluído', {
            tenantId,
            userId,
            metadata: {
                providerId,
                name: existingProvider.name,
            },
        })

        await ActivityService.create({
            tenantId,
            userId: userId || null,
            action: 'THIRD_PARTY_DELETED',
            description: `Parceiro ${existingProvider.name} excluído`,
            metadata: {
                providerId,
                name: existingProvider.name,
            },
        })

        logger.info('Third party provider deleted successfully', {
            tenantId,
            userId,
            action: 'THIRD_PARTY_DELETED_SUCCESS',
            metadata: { providerId },
        })

        return { success: true, providerId }
    }
}