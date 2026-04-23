// lib/services/customer.service.ts

import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { logger } from '@/lib/logger/logger'
import { ActivityService } from '@/lib/services/activity.service'
import { createPaginationMeta, calculateOffset } from '@/types/pagination'
import { serializeDates } from '@/lib/utils/serialize'
import type { PaginatedResponse } from '@/types/pagination'
import type { Customer } from '@/types/customer'

export interface CreateCustomerDTO {
    name: string
    email?: string | null
    phone: string
    cpf?: string | null
    address?: string | null
    notes?: string | null
}

export interface UpdateCustomerDTO {
    name?: string
    email?: string | null
    phone?: string
    cpf?: string | null
    address?: string | null
    notes?: string | null
}

export interface ListCustomersOptions {
    search?: string
    page?: number
    limit?: number
}

export class CustomerService {

    // =============================
    // LISTAR COM PAGINAÇÃO E BUSCA
    // =============================
    static async listByTenant(
        tenantId: string,
        options: ListCustomersOptions = {},
        userId?: string
    ): Promise<PaginatedResponse<Customer>> {
        const { search, page = 1, limit = 50 } = options
        const offset = calculateOffset(page, limit)

        logger.info('Listing customers by tenant', {
            tenantId,
            userId,
            action: 'CUSTOMER_LIST',
            metadata: { search, page, limit },
        })

        // Construir where clause
        const where = {
            tenantId,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                    { phone: { contains: search } },
                    { cpf: { contains: search } },
                ],
            }),
        }

        // Buscar dados e contagem em paralelo
        const [customersFromDB, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                include: {
                    vehicles: {
                        select: {
                            id: true,
                            plate: true,
                            brand: true,
                            model: true,
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                    _count: {
                        select: {
                            services: true,
                            vehicles: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.customer.count({ where }),
        ])

        // Serializar dates (Date -> string) com type assertion seguro
        const customers = serializeDates(customersFromDB) as unknown as Customer[]

        logger.info(`Found ${customers.length} customers (total: ${total})`, {
            tenantId,
            userId,
            action: 'CUSTOMER_LISTED',
            metadata: { count: customers.length, total, page, limit },
        })

        return {
            items: customers,
            pagination: createPaginationMeta(total, page, limit),
        }
    }

    // =============================
    // BUSCAR POR ID
    // =============================
    static async findById(customerId: string, tenantId: string, userId?: string) {
        logger.info('Finding customer by ID', {
            tenantId,
            userId,
            action: 'CUSTOMER_FIND_BY_ID',
            metadata: { customerId },
        })

        const customerFromDB = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
            include: {
                vehicles: true,
                services: {
                    include: {
                        vehicle: true,
                        items: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                _count: {
                    select: {
                        services: true,
                        vehicles: true,
                    },
                },
            },
        })

        if (!customerFromDB) {
            logger.warn('Customer not found', {
                tenantId,
                userId,
                action: 'CUSTOMER_NOT_FOUND',
                metadata: { customerId },
            })

            throw new AppError({
                code: ERROR_CODES.CUSTOMER_NOT_FOUND,
                message: 'Cliente não encontrado',
                statusCode: 404,
                metadata: { customerId },
            })
        }

        return serializeDates(customerFromDB) as unknown as Customer
    }

    // =============================
    // CRIAR
    // =============================
    static async create(
        data: CreateCustomerDTO,
        tenantId: string,
        userId: string
    ) {
        logger.info('Creating new customer', {
            tenantId,
            userId,
            action: 'CUSTOMER_CREATE_INIT',
            metadata: {
                name: data.name,
                hasEmail: !!data.email,
                hasCpf: !!data.cpf,
            },
        })

        // Verifica CPF duplicado
        if (data.cpf) {
            const existingCustomer = await prisma.customer.findFirst({
                where: {
                    cpf: data.cpf,
                    tenantId,
                },
            })

            if (existingCustomer) {
                logger.warn('Customer creation failed - duplicate CPF', {
                    tenantId,
                    userId,
                    action: 'CUSTOMER_CREATE_DUPLICATE_CPF',
                    metadata: { cpf: data.cpf },
                })

                throw new AppError({
                    code: ERROR_CODES.CUSTOMER_DUPLICATE_CPF,
                    message: 'Já existe um cliente com este CPF',
                    statusCode: 409,
                    metadata: { cpf: data.cpf },
                })
            }
        }

        const customerFromDB = await prisma.customer.create({
            data: {
                name: data.name,
                email: data.email ?? null,
                phone: data.phone,
                cpf: data.cpf ?? null,
                address: data.address ?? null,
                notes: data.notes ?? null,
                tenantId,
            },
            include: {
                vehicles: true,
                _count: {
                    select: {
                        services: true,
                        vehicles: true,
                    },
                },
            },
        })

        // Log de atividade
        await ActivityService.create({
            tenantId,
            userId,
            action: 'customer.created',
            description: `Cliente "${customerFromDB.name}" cadastrado`,
            metadata: {
                customerId: customerFromDB.id,
                name: customerFromDB.name,
                cpf: customerFromDB.cpf,
            },
        })

        logger.info('Customer created successfully', {
            tenantId,
            userId,
            action: 'CUSTOMER_CREATED_SUCCESS',
            metadata: {
                customerId: customerFromDB.id,
                name: customerFromDB.name,
            },
        })

        return serializeDates(customerFromDB) as unknown as Customer
    }

    // =============================
    // ATUALIZAR
    // =============================
    static async update(
        customerId: string,
        data: UpdateCustomerDTO,
        tenantId: string,
        userId?: string
    ) {
        logger.info('Updating customer', {
            tenantId,
            userId,
            action: 'CUSTOMER_UPDATE_INIT',
            metadata: { customerId },
        })

        const existingCustomer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
        })

        if (!existingCustomer) {
            throw new AppError({
                code: ERROR_CODES.CUSTOMER_NOT_FOUND,
                message: 'Cliente não encontrado',
                statusCode: 404,
                metadata: { customerId },
            })
        }

        // Verifica CPF duplicado (se estiver alterando)
        if (data.cpf && data.cpf !== existingCustomer.cpf) {
            const existingWithCpf = await prisma.customer.findFirst({
                where: {
                    cpf: data.cpf,
                    tenantId,
                    id: { not: customerId },
                },
            })

            if (existingWithCpf) {
                throw new AppError({
                    code: ERROR_CODES.CUSTOMER_DUPLICATE_CPF,
                    message: 'Já existe um cliente com este CPF',
                    statusCode: 409,
                    metadata: { cpf: data.cpf },
                })
            }
        }

        const customerFromDB = await prisma.customer.update({
            where: { id: customerId, tenantId },
            data: {
                name: data.name,
                email: data.email ?? null,
                phone: data.phone,
                cpf: data.cpf ?? null,
                address: data.address ?? null,
                notes: data.notes ?? null,
            },
            include: {
                vehicles: true,
                _count: {
                    select: {
                        services: true,
                        vehicles: true,
                    },
                },
            },
        })

        // Log de atividade
        await ActivityService.create({
            tenantId,
            userId: userId || null,
            action: 'customer.updated',
            description: `Cliente "${customerFromDB.name}" atualizado`,
            metadata: { customerId, name: customerFromDB.name },
        })

        logger.info('Customer updated successfully', {
            tenantId,
            userId,
            action: 'CUSTOMER_UPDATED_SUCCESS',
            metadata: { customerId },
        })

        return serializeDates(customerFromDB) as unknown as Customer
    }

    // =============================
    // EXCLUIR
    // =============================
    static async delete(customerId: string, tenantId: string, userId?: string) {
        logger.info('Deleting customer', {
            tenantId,
            userId,
            action: 'CUSTOMER_DELETE_INIT',
            metadata: { customerId },
        })

        const existingCustomer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
            include: {
                _count: {
                    select: {
                        services: true,
                        vehicles: true,
                    },
                },
            },
        })

        if (!existingCustomer) {
            throw new AppError({
                code: ERROR_CODES.CUSTOMER_NOT_FOUND,
                message: 'Cliente não encontrado',
                statusCode: 404,
                metadata: { customerId },
            })
        }

        // Verifica dependências
        if (existingCustomer._count.services > 0 || existingCustomer._count.vehicles > 0) {
            throw new AppError({
                code: ERROR_CODES.CUSTOMER_HAS_DEPENDENCIES,
                message: 'Não é possível excluir cliente com serviços ou veículos vinculados',
                statusCode: 409,
                metadata: {
                    servicesCount: existingCustomer._count.services,
                    vehiclesCount: existingCustomer._count.vehicles,
                },
            })
        }

        await prisma.customer.delete({
            where: { id: customerId, tenantId },
        })

        // Log de atividade
        await ActivityService.create({
            tenantId,
            userId: userId || null,
            action: 'customer.deleted',
            description: `Cliente "${existingCustomer.name}" excluído`,
            metadata: { customerId, name: existingCustomer.name },
        })

        logger.info('Customer deleted successfully', {
            tenantId,
            userId,
            action: 'CUSTOMER_DELETED_SUCCESS',
            metadata: { customerId },
        })

        return { success: true, customerId }
    }
}