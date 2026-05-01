// lib/services/service.service.ts

import { prisma } from '@/lib/prisma'
import { ServiceStatus, ServiceType, ThirdPartyServiceStatus } from '@prisma/client'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { logger } from '@/lib/logger/logger'
import { ActivityService } from '@/lib/services/activity.service'

interface ThirdPartyServiceData {
  providerId: string
  description: string
  cost: number | string
  chargedValue: number | string
  status?: string
}

interface ServiceMechanicData {
  mechanicId: string
  hoursWorked: number | string
  commission: number | string
}

interface ApprovalMetadata {
  clientName?: string | null
  clientDocument?: string | null
  clientNotes?: string | null
  ip?: string | null
  userAgent?: string | null
}

interface ServiceItemData {
  type?: 'LABOR' | 'PART'
  description: string
  quantity: number | string
  unitPrice: number | string
}

export interface CreateServiceDTO {
  items?: ServiceItemData[]
  thirdPartyServices?: ThirdPartyServiceData[]
  mechanics?: ServiceMechanicData[]
  vehicleId?: string
  customerId: string
  type?: ServiceType
  status?: ServiceStatus
  description: string
  scheduledDate?: string
  totalValue?: number | string
  notes?: string
}

export interface UpdateServiceDTO {
  type?: ServiceType
  status?: ServiceStatus
  description?: string
  customerId?: string
  vehicleId?: string | null
  totalValue?: number | string
  notes?: string
  scheduledDate?: string
  items?: ServiceItemData[]
  mechanics?: ServiceMechanicData[]
  thirdPartyServices?: ThirdPartyServiceData[]
}

const serviceDetailInclude = {
  customer: true,
  vehicle: true,
  items: true,
  attachments: { orderBy: { createdAt: 'desc' as const } },
  thirdPartyServices: { include: { provider: true } },
  serviceMechanics: { include: { mechanic: true } },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
}

export class ServiceService {
  // =============================
  // LISTAR
  // =============================
  static async listByTenant(tenantId: string, userId?: string) {
    logger.info('Listing services by tenant', {
      tenantId,
      userId,
      action: 'SERVICE_LIST',
    })

    const services = await prisma.service.findMany({
      where: { tenantId },
      include: {
        customer: true,
        vehicle: true,
        items: true,
        thirdPartyServices: { include: { provider: true } },
        serviceMechanics: { include: { mechanic: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    logger.info(`Found ${services.length} services`, {
      tenantId,
      userId,
      action: 'SERVICE_LISTED',
      metadata: { count: services.length },
    })

    return services
  }

  // =============================
  // BUSCAR POR ID
  // =============================
  static async findById(serviceId: string, tenantId: string, userId?: string) {
    logger.info('Finding service by ID', {
      tenantId,
      userId,
      action: 'SERVICE_FIND_BY_ID',
      metadata: { serviceId },
    })

    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
      include: serviceDetailInclude,
    })

    if (!service) {
      logger.warn('Service not found', {
        tenantId,
        userId,
        action: 'SERVICE_NOT_FOUND',
        metadata: { serviceId },
      })
      throw new AppError({
        code: ERROR_CODES.SERVICE_NOT_FOUND,
        message: 'Serviço não encontrado',
        statusCode: 404,
        metadata: { serviceId },
      })
    }

    return service
  }

  // =============================
  // CRIAR
  // =============================
  static async create(data: CreateServiceDTO, tenantId: string, userId: string) {
    logger.info('Creating new service', {
      tenantId,
      userId,
      action: 'SERVICE_CREATE_INIT',
      metadata: {
        customerId: data.customerId,
        type: data.type,
        itemsCount: data.items?.length ?? 0,
      },
    })

    if (!data.customerId || !data.description) {
      throw new AppError({
        code: ERROR_CODES.SERVICE_INVALID_DATA,
        message: 'Cliente e descrição são obrigatórios',
        statusCode: 400,
      })
    }

    const itemsTotal =
      data.items?.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0) || 0

    const thirdPartyTotal =
      data.thirdPartyServices?.reduce((sum, tp) => sum + Number(tp.chargedValue), 0) || 0

    const finalTotal =
      itemsTotal + thirdPartyTotal > 0 ? itemsTotal + thirdPartyTotal : Number(data.totalValue || 0)

    const service = await prisma.service.create({
      data: {
        customerId: data.customerId,
        userId,
        vehicleId: data.vehicleId || null,
        type: (data.type || 'ORDEM_SERVICO') as ServiceType,
        status: (data.status || 'PENDENTE') as ServiceStatus,
        description: data.description,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        totalValue: finalTotal,
        notes: data.notes || null,
        tenantId,
        items: {
          create:
            data.items?.map((item) => ({
              type: item.type || 'PART',
              description: item.description,
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
              totalPrice: Number(item.quantity) * Number(item.unitPrice),
            })) || [],
        },
        thirdPartyServices: {
          create:
            data.thirdPartyServices?.map((tp) => ({
              providerId: tp.providerId,
              description: tp.description,
              cost: Number(tp.cost),
              chargedValue: Number(tp.chargedValue),
            })) || [],
        },
        serviceMechanics: {
          create:
            data.mechanics?.map((m) => ({
              mechanicId: m.mechanicId,
              hoursWorked: Number(m.hoursWorked) || 0,
              commission: Number(m.commission) || 0,
            })) || [],
        },
      },
      include: {
        customer: true,
        vehicle: true,
      },
    })

    await logger.logActivity('SERVICE_CREATED', 'Nova ordem de serviço criada', {
      tenantId,
      userId,
      metadata: {
        serviceId: service.id,
        customerId: data.customerId,
        totalValue: finalTotal,
        type: service.type,
      },
    })

    await ActivityService.create({
      tenantId,
      userId,
      action: 'SERVICE_CREATED',
      description: `Ordem de serviço #${service.id} criada para cliente ${data.customerId}`,
      metadata: {
        serviceId: service.id,
        customerId: data.customerId,
        totalValue: finalTotal,
        type: service.type,
        itemsCount: data.items?.length ?? 0,
      },
    })

    return service
  }

  // =============================
  // ATUALIZAR
  // =============================
  static async update(
    serviceId: string,
    data: UpdateServiceDTO,
    tenantId: string,
    userId?: string
  ) {
    logger.info('Updating service', {
      tenantId,
      userId,
      action: 'SERVICE_UPDATE_INIT',
      metadata: { serviceId },
    })

    const existingService = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    })

    if (!existingService) {
      throw new AppError({
        code: ERROR_CODES.SERVICE_NOT_FOUND,
        message: 'Serviço não encontrado',
        statusCode: 404,
        metadata: { serviceId },
      })
    }

    const newStatus = data.status as ServiceStatus | undefined
    const isBeingCompleted = newStatus === 'CONCLUIDO' && existingService.status !== 'CONCLUIDO'

    const items = data.items ?? []
    const mechanics = data.mechanics ?? []
    const thirdPartyServices = data.thirdPartyServices ?? []
    const itemsTotal = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    )
    const thirdPartyTotal = thirdPartyServices.reduce(
      (sum, item) => sum + Number(item.chargedValue),
      0
    )
    const totalValue =
      itemsTotal + thirdPartyTotal > 0 ? itemsTotal + thirdPartyTotal : Number(data.totalValue) || 0

    const updatedService = await prisma.$transaction(async (tx) => {
      // Deleta itens e mecânicos antigos
      await tx.serviceItem.deleteMany({ where: { serviceId } })
      await tx.serviceMechanic.deleteMany({ where: { serviceId } })
      await tx.thirdPartyService.deleteMany({ where: { serviceId } })

      // Atualiza o serviço
      const service = await tx.service.update({
        where: { id: serviceId },
        data: {
          ...(data.type && { type: data.type }),
          ...(data.status && { status: data.status }),
          ...(data.description && { description: data.description }),
          ...(data.customerId && { customerId: data.customerId }),
          ...(data.vehicleId !== undefined && { vehicleId: data.vehicleId || null }),
          totalValue,
          notes: data.notes || null,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
          // Se está sendo concluído agora, registra a data
          ...(isBeingCompleted && {
            completedDate: new Date(),
          }),
          items: {
            create: items.map((item) => ({
              type: item.type || 'PART',
              description: item.description,
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unitPrice) || 0,
              totalPrice: Number(item.quantity) * Number(item.unitPrice),
            })),
          },
          serviceMechanics: {
            create: mechanics.map((m) => ({
              mechanicId: m.mechanicId,
              hoursWorked: Number(m.hoursWorked) || 0,
              commission: Number(m.commission) || 0,
            })),
          },
          thirdPartyServices: {
            create: thirdPartyServices.map((tp) => ({
              providerId: tp.providerId,
              description: tp.description,
              cost: Number(tp.cost) || 0,
              chargedValue: Number(tp.chargedValue) || 0,
              status: (tp.status || 'PENDENTE') as ThirdPartyServiceStatus,
            })),
          },
        },
        include: {
          customer: true,
          vehicle: true,
          items: true,
          thirdPartyServices: { include: { provider: true } },
          serviceMechanics: { include: { mechanic: true } },
        },
      })

      // ─── Geração automática de receita ───────────────────────────
      // Se a OS foi concluída agora E tem valor, cria Transaction de receita
      if (isBeingCompleted && totalValue > 0) {
        // Evita duplicata: verifica se já existe transação para esta OS
        const existingTransaction = await tx.transaction.findFirst({
          where: { serviceId, tenantId, type: 'RECEITA' },
        })

        if (!existingTransaction) {
          await tx.transaction.create({
            data: {
              tenantId,
              userId: userId ?? null,
              type: 'RECEITA',
              category: 'SERVICO',
              description: `OS #${serviceId.slice(0, 8)} — ${service.customer.name}`,
              amount: totalValue,
              date: new Date(),
              isPaid: true,
              paidAt: new Date(),
              serviceId,
              reference: serviceId,
            },
          })
        }
      }

      return service
    })

    await logger.logActivity('SERVICE_UPDATED', 'Ordem de serviço atualizada', {
      tenantId,
      userId,
      metadata: {
        serviceId,
        status: updatedService.status,
        totalValue: updatedService.totalValue,
        transactionCreated: isBeingCompleted && totalValue > 0,
      },
    })

    await ActivityService.create({
      tenantId,
      userId: userId ?? null,
      action: isBeingCompleted ? 'SERVICE_COMPLETED' : 'SERVICE_UPDATED',
      description: isBeingCompleted
        ? `OS #${serviceId.slice(0, 8)} concluída — receita de ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} registrada`
        : `Ordem de serviço #${serviceId} atualizada`,
      metadata: {
        serviceId,
        status: updatedService.status,
        totalValue: updatedService.totalValue,
        transactionCreated: isBeingCompleted && totalValue > 0,
      },
    })

    return updatedService
  }

  // =============================
  // ATUALIZAR STATUS
  // =============================
  static async updateStatus(
    serviceId: string,
    status: ServiceStatus,
    tenantId: string,
    userId?: string | null
  ) {
    const existingService = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
      include: { customer: true },
    })

    if (!existingService) {
      throw new AppError({
        code: ERROR_CODES.SERVICE_NOT_FOUND,
        message: 'Servico nao encontrado',
        statusCode: 404,
        metadata: { serviceId },
      })
    }

    const isBeingCompleted = status === 'CONCLUIDO' && existingService.status !== 'CONCLUIDO'
    const isLeavingCompleted = status !== 'CONCLUIDO' && existingService.status === 'CONCLUIDO'

    const updatedService = await prisma.$transaction(async (tx) => {
      const service = await tx.service.update({
        where: { id: serviceId },
        data: {
          status,
          ...(isBeingCompleted && { completedDate: new Date() }),
          ...(isLeavingCompleted && { completedDate: null }),
        },
        include: serviceDetailInclude,
      })

      if (isBeingCompleted && service.totalValue > 0) {
        const existingTransaction = await tx.transaction.findFirst({
          where: { serviceId, tenantId, type: 'RECEITA' },
        })

        if (!existingTransaction) {
          await tx.transaction.create({
            data: {
              tenantId,
              userId: userId ?? null,
              type: 'RECEITA',
              category: 'SERVICO',
              description: `OS #${serviceId.slice(0, 8)} - ${existingService.customer.name}`,
              amount: service.totalValue,
              date: new Date(),
              isPaid: true,
              paidAt: new Date(),
              serviceId,
              reference: serviceId,
            },
          })
        }
      }

      return service
    })

    await ActivityService.create({
      tenantId,
      userId: userId ?? null,
      action: isBeingCompleted ? 'SERVICE_COMPLETED' : 'SERVICE_STATUS_UPDATED',
      description: isBeingCompleted
        ? `OS #${serviceId.slice(0, 8)} concluida`
        : `Status da OS #${serviceId.slice(0, 8)} alterado para ${status}`,
      metadata: {
        serviceId,
        previousStatus: existingService.status,
        status,
        transactionCreated: isBeingCompleted && existingService.totalValue > 0,
      },
    })

    return updatedService
  }

  // =============================
  // APROVAR ORCAMENTO
  // =============================
  static async approveBudget(
    serviceId: string,
    tenantId: string,
    userId?: string | null,
    approval?: ApprovalMetadata
  ) {
    const existingService = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
      include: { customer: true },
    })

    if (!existingService) {
      throw new AppError({
        code: ERROR_CODES.SERVICE_NOT_FOUND,
        message: 'ServiÃ§o nÃ£o encontrado',
        statusCode: 404,
        metadata: { serviceId },
      })
    }

    if (existingService.type !== 'ORCAMENTO') {
      throw new AppError({
        code: ERROR_CODES.SERVICE_INVALID_DATA,
        message: 'Apenas orÃ§amentos podem ser aprovados.',
        statusCode: 400,
        metadata: { serviceId },
      })
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        type: 'ORDEM_SERVICO',
        status: existingService.status === 'CANCELADO' ? 'PENDENTE' : 'EM_ANDAMENTO',
        approvedAt: new Date(),
        clientApprovalName: approval?.clientName || null,
        clientApprovalDocument: approval?.clientDocument || null,
        clientApprovalNotes: approval?.clientNotes || null,
        clientApprovalIp: approval?.ip || null,
        clientApprovalUserAgent: approval?.userAgent || null,
      },
      include: {
        customer: true,
        vehicle: true,
        items: true,
        attachments: true,
        thirdPartyServices: { include: { provider: true } },
        serviceMechanics: { include: { mechanic: true } },
      },
    })

    await ActivityService.create({
      tenantId,
      userId: userId ?? null,
      action: 'SERVICE_BUDGET_APPROVED',
      description: `OrÃ§amento #${serviceId.slice(0, 8)} aprovado e convertido em OS`,
      metadata: {
        serviceId,
        customerId: existingService.customerId,
        totalValue: existingService.totalValue,
        clientName: approval?.clientName,
        clientNotes: approval?.clientNotes,
      },
    })

    return updatedService
  }

  // =============================
  // EXCLUIR
  // =============================
  static async delete(serviceId: string, tenantId: string, userId?: string) {
    logger.info('Deleting service', {
      tenantId,
      userId,
      action: 'SERVICE_DELETE_INIT',
      metadata: { serviceId },
    })

    const existingService = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
    })

    if (!existingService) {
      throw new AppError({
        code: ERROR_CODES.SERVICE_NOT_FOUND,
        message: 'Serviço não encontrado',
        statusCode: 404,
        metadata: { serviceId },
      })
    }

    await prisma.service.delete({
      where: { id: serviceId, tenantId },
    })

    await logger.logActivity('SERVICE_DELETED', 'Ordem de serviço excluída', {
      tenantId,
      userId,
      metadata: {
        serviceId,
        customerId: existingService.customerId,
      },
    })

    await ActivityService.create({
      tenantId,
      userId: userId ?? null,
      action: 'SERVICE_DELETED',
      description: `Ordem de serviço #${serviceId} excluída`,
      metadata: {
        serviceId,
        customerId: existingService.customerId,
      },
    })

    return { success: true, serviceId }
  }
}
