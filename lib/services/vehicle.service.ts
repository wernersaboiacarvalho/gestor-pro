// lib/services/vehicle.service.ts

import { prisma } from '@/lib/prisma'
import { VehicleType, Prisma } from '@prisma/client'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { logger } from '@/lib/logger/logger'
import { ActivityService } from '@/lib/services/activity.service'
import { createPaginationMeta, calculateOffset } from '@/types/pagination'
import { serializeDates } from '@/lib/utils/serialize'
import type { PaginatedResponse } from '@/types/pagination'
import type { Vehicle, CreateVehicleDTO, UpdateVehicleDTO } from '@/types/vehicle'

export interface ListVehiclesOptions {
    search?: string
    customerId?: string
    category?: string
    page?: number
    limit?: number
}

export class VehicleService {

    // =============================
    // LISTAR COM PAGINAÇÃO E BUSCA
    // =============================
    static async listByTenant(
        tenantId: string,
        options: ListVehiclesOptions = {},
        userId?: string
    ): Promise<PaginatedResponse<Vehicle>> {
        const { search, customerId, category, page = 1, limit = 50 } = options
        const offset = calculateOffset(page, limit)

        logger.info('Listing vehicles by tenant', {
            tenantId,
            userId,
            action: 'VEHICLE_LIST',
            metadata: { search, customerId, category, page, limit },
        })

        // Construir where clause com tipos corretos
        const where: Prisma.VehicleWhereInput = {
            tenantId,
            ...(customerId && { customerId }),
            ...(category && { category: category as VehicleType }),
            ...(search && {
                OR: [
                    { plate: { contains: search, mode: 'insensitive' } },
                    { brand: { contains: search, mode: 'insensitive' } },
                    { model: { contains: search, mode: 'insensitive' } },
                    { customer: { name: { contains: search, mode: 'insensitive' } } },
                ],
            }),
        }

        // Buscar dados e contagem em paralelo
        const [vehiclesFromDB, total] = await Promise.all([
            prisma.vehicle.findMany({
                where,
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                    _count: {
                        select: {
                            services: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.vehicle.count({ where }),
        ])

        // Serializar dates (Date -> string)
        const vehicles = serializeDates(vehiclesFromDB) as unknown as Vehicle[]

        logger.info(`Found ${vehicles.length} vehicles (total: ${total})`, {
            tenantId,
            userId,
            action: 'VEHICLE_LISTED',
            metadata: { count: vehicles.length, total, page, limit },
        })

        return {
            items: vehicles,
            pagination: createPaginationMeta(total, page, limit),
        }
    }

    // =============================
    // BUSCAR POR ID
    // =============================
    static async findById(vehicleId: string, tenantId: string, userId?: string) {
        logger.info('Finding vehicle by ID', {
            tenantId,
            userId,
            action: 'VEHICLE_FIND_BY_ID',
            metadata: { vehicleId },
        })

        const vehicleFromDB = await prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId },
            include: {
                customer: true,
                services: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        serviceMechanics: {
                            include: {
                                mechanic: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                        items: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                _count: {
                    select: {
                        services: true,
                    },
                },
            },
        })

        if (!vehicleFromDB) {
            logger.warn('Vehicle not found', {
                tenantId,
                userId,
                action: 'VEHICLE_NOT_FOUND',
                metadata: { vehicleId },
            })

            throw new AppError({
                code: ERROR_CODES.VEHICLE_NOT_FOUND,
                message: 'Veículo não encontrado',
                statusCode: 404,
                metadata: { vehicleId },
            })
        }

        return serializeDates(vehicleFromDB) as unknown as Vehicle
    }

    // =============================
    // CRIAR
    // =============================
    static async create(
        data: CreateVehicleDTO,
        tenantId: string,
        userId: string
    ) {
        logger.info('Creating new vehicle', {
            tenantId,
            userId,
            action: 'VEHICLE_CREATE_INIT',
            metadata: {
                plate: data.plate,
                brand: data.brand,
                model: data.model,
                customerId: data.customerId,
            },
        })

        // Verifica placa duplicada
        const existingVehicle = await prisma.vehicle.findFirst({
            where: {
                plate: data.plate.toUpperCase(),
                tenantId,
            },
        })

        if (existingVehicle) {
            throw new AppError({
                code: ERROR_CODES.VEHICLE_DUPLICATE_PLATE,
                message: 'Já existe um veículo com esta placa',
                statusCode: 409,
                metadata: { plate: data.plate },
            })
        }

        // Verifica se cliente pertence ao tenant
        const customer = await prisma.customer.findFirst({
            where: {
                id: data.customerId,
                tenantId,
            },
        })

        if (!customer) {
            throw new AppError({
                code: ERROR_CODES.VEHICLE_CUSTOMER_MISMATCH,
                message: 'Cliente não encontrado ou não pertence a este tenant',
                statusCode: 400,
                metadata: { customerId: data.customerId },
            })
        }

        const vehicleFromDB = await prisma.vehicle.create({
            data: {
                plate: data.plate.toUpperCase(),
                brand: data.brand,
                model: data.model,
                year: data.year,
                color: data.color ?? null,
                chassis: data.chassis ?? null,
                renavam: data.renavam ?? null,
                km: data.km ?? null,
                category: data.category ?? 'CARRO',
                specifications: data.specifications && Object.keys(data.specifications).length > 0
                    ? (data.specifications as Prisma.InputJsonValue)
                    : Prisma.DbNull, // ⬅️ Diretamente no create
                notes: data.notes ?? null,
                customerId: data.customerId,
                tenantId,
            },
            include: {
                customer: true,
                _count: {
                    select: {
                        services: true,
                    },
                },
            },
        })

        // Log de atividade
        await ActivityService.create({
            tenantId,
            userId,
            action: 'vehicle.created',
            description: `Veículo ${vehicleFromDB.plate} (${vehicleFromDB.brand} ${vehicleFromDB.model}) cadastrado`,
            metadata: {
                vehicleId: vehicleFromDB.id,
                plate: vehicleFromDB.plate,
                brand: vehicleFromDB.brand,
                model: vehicleFromDB.model,
                customerId: data.customerId,
            },
        })

        logger.info('Vehicle created successfully', {
            tenantId,
            userId,
            action: 'VEHICLE_CREATED_SUCCESS',
            metadata: {
                vehicleId: vehicleFromDB.id,
                plate: vehicleFromDB.plate,
            },
        })

        return serializeDates(vehicleFromDB) as unknown as Vehicle
    }

    // =============================
    // ATUALIZAR
    // =============================
    static async update(
        vehicleId: string,
        data: UpdateVehicleDTO,
        tenantId: string,
        userId?: string
    ) {
        logger.info('Updating vehicle', {
            tenantId,
            userId,
            action: 'VEHICLE_UPDATE_INIT',
            metadata: { vehicleId },
        })

        const existingVehicle = await prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId },
        })

        if (!existingVehicle) {
            throw new AppError({
                code: ERROR_CODES.VEHICLE_NOT_FOUND,
                message: 'Veículo não encontrado',
                statusCode: 404,
                metadata: { vehicleId },
            })
        }

        // Verifica placa duplicada (se estiver alterando)
        if (data.plate && data.plate.toUpperCase() !== existingVehicle.plate) {
            const existingWithPlate = await prisma.vehicle.findFirst({
                where: {
                    plate: data.plate.toUpperCase(),
                    tenantId,
                    id: { not: vehicleId },
                },
            })

            if (existingWithPlate) {
                throw new AppError({
                    code: ERROR_CODES.VEHICLE_DUPLICATE_PLATE,
                    message: 'Já existe um veículo com esta placa',
                    statusCode: 409,
                    metadata: { plate: data.plate },
                })
            }
        }

        // Verifica se cliente pertence ao tenant (se estiver alterando)
        if (data.customerId && data.customerId !== existingVehicle.customerId) {
            const customer = await prisma.customer.findFirst({
                where: {
                    id: data.customerId,
                    tenantId,
                },
            })

            if (!customer) {
                throw new AppError({
                    code: ERROR_CODES.VEHICLE_CUSTOMER_MISMATCH,
                    message: 'Cliente não encontrado ou não pertence a este tenant',
                    statusCode: 400,
                    metadata: { customerId: data.customerId },
                })
            }
        }

        // ⬇️ Construir objeto de atualização
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {}

        if (data.plate !== undefined) updateData.plate = data.plate.toUpperCase()
        if (data.brand !== undefined) updateData.brand = data.brand
        if (data.model !== undefined) updateData.model = data.model
        if (data.year !== undefined) updateData.year = data.year
        if (data.color !== undefined) updateData.color = data.color
        if (data.chassis !== undefined) updateData.chassis = data.chassis
        if (data.renavam !== undefined) updateData.renavam = data.renavam
        if (data.km !== undefined) updateData.km = data.km
        if (data.category !== undefined) updateData.category = data.category
        if (data.notes !== undefined) updateData.notes = data.notes

        // ⬇️ Tratar customerId como relação
        if (data.customerId !== undefined) {
            updateData.customer = { connect: { id: data.customerId } }
        }

        // ⬇️ Tratar specifications
        if (data.specifications !== undefined) {
            if (data.specifications && Object.keys(data.specifications).length > 0) {
                updateData.specifications = data.specifications as Prisma.InputJsonValue
            } else {
                updateData.specifications = Prisma.DbNull
            }
        }

        const vehicleFromDB = await prisma.vehicle.update({
            where: { id: vehicleId, tenantId },
            data: updateData,
            include: {
                customer: true,
                _count: {
                    select: {
                        services: true,
                    },
                },
            },
        })

        // Log de atividade
        await ActivityService.create({
            tenantId,
            userId: userId || null,
            action: 'vehicle.updated',
            description: `Veículo ${vehicleFromDB.plate} atualizado`,
            metadata: { vehicleId, plate: vehicleFromDB.plate },
        })

        logger.info('Vehicle updated successfully', {
            tenantId,
            userId,
            action: 'VEHICLE_UPDATED_SUCCESS',
            metadata: { vehicleId },
        })

        return serializeDates(vehicleFromDB) as unknown as Vehicle
    }

    // =============================
    // EXCLUIR
    // =============================
    static async delete(vehicleId: string, tenantId: string, userId?: string) {
        logger.info('Deleting vehicle', {
            tenantId,
            userId,
            action: 'VEHICLE_DELETE_INIT',
            metadata: { vehicleId },
        })

        const existingVehicle = await prisma.vehicle.findFirst({
            where: { id: vehicleId, tenantId },
            include: {
                _count: {
                    select: {
                        services: true,
                    },
                },
            },
        })

        if (!existingVehicle) {
            throw new AppError({
                code: ERROR_CODES.VEHICLE_NOT_FOUND,
                message: 'Veículo não encontrado',
                statusCode: 404,
                metadata: { vehicleId },
            })
        }

        // Verifica dependências
        if (existingVehicle._count.services > 0) {
            throw new AppError({
                code: ERROR_CODES.VEHICLE_HAS_DEPENDENCIES,
                message: 'Não é possível excluir veículo com serviços vinculados',
                statusCode: 409,
                metadata: {
                    servicesCount: existingVehicle._count.services,
                },
            })
        }

        await prisma.vehicle.delete({
            where: { id: vehicleId, tenantId },
        })

        // Log de atividade
        await ActivityService.create({
            tenantId,
            userId: userId || null,
            action: 'vehicle.deleted',
            description: `Veículo ${existingVehicle.plate} excluído`,
            metadata: { vehicleId, plate: existingVehicle.plate },
        })

        logger.info('Vehicle deleted successfully', {
            tenantId,
            userId,
            action: 'VEHICLE_DELETED_SUCCESS',
            metadata: { vehicleId },
        })

        return { success: true, vehicleId }
    }

    // =============================
    // BUSCAR POR PLACA
    // =============================
    static async findByPlate(plate: string, tenantId: string, userId?: string) {
        logger.info('Finding vehicle by plate', {
            tenantId,
            userId,
            action: 'VEHICLE_FIND_BY_PLATE',
            metadata: { plate },
        })

        const vehicleFromDB = await prisma.vehicle.findFirst({
            where: {
                plate: plate.toUpperCase(),
                tenantId,
            },
            include: {
                customer: true,
            },
        })

        if (!vehicleFromDB) {
            throw new AppError({
                code: ERROR_CODES.VEHICLE_NOT_FOUND,
                message: 'Veículo não encontrado',
                statusCode: 404,
                metadata: { plate },
            })
        }

        return serializeDates(vehicleFromDB) as unknown as Vehicle
    }
}