// lib/services/transaction.service.ts

import { prisma } from '@/lib/prisma'
import { TransactionType, PaymentMethod } from '@prisma/client'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { logger } from '@/lib/logger/logger'
import { ActivityService } from '@/lib/services/activity.service'

export interface CreateTransactionDTO {
  type: TransactionType
  category: string
  description: string
  amount: number
  date?: string
  dueDate?: string | null
  isPaid?: boolean
  paymentMethod?: PaymentMethod | null
  serviceId?: string | null
  reference?: string | null
  notes?: string | null
}

export interface UpdateTransactionDTO {
  type?: TransactionType
  category?: string
  description?: string
  amount?: number
  date?: string
  dueDate?: string | null
  isPaid?: boolean
  paidAt?: string | null
  paymentMethod?: PaymentMethod | null
  reference?: string | null
  notes?: string | null
}

export interface ListTransactionsOptions {
  type?: TransactionType
  isPaid?: boolean
  startDate?: string
  endDate?: string
  category?: string
  page?: number
  limit?: number
}

export class TransactionService {
  // =============================
  // LISTAR
  // =============================
  static async listByTenant(
    tenantId: string,
    options: ListTransactionsOptions = {},
    userId?: string
  ) {
    const { type, isPaid, startDate, endDate, category, page = 1, limit = 50 } = options

    logger.info('Listing transactions by tenant', {
      tenantId,
      userId,
      action: 'TRANSACTION_LIST',
      metadata: { ...options },
    })

    const where = {
      tenantId,
      ...(type && { type }),
      ...(isPaid !== undefined && { isPaid }),
      ...(category && { category }),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    return {
      items: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }
  }

  // =============================
  // RESUMO FINANCEIRO (fluxo de caixa)
  // =============================
  static async getSummary(tenantId: string, startDate?: string, endDate?: string) {
    const where = {
      tenantId,
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    }

    const [receitas, despesas, pendentes] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'RECEITA', isPaid: true },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'DESPESA', isPaid: true },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...where, isPaid: false },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    const totalReceitas = receitas._sum.amount ?? 0
    const totalDespesas = despesas._sum.amount ?? 0

    return {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      totalPendente: pendentes._sum.amount ?? 0,
      countReceitas: receitas._count,
      countDespesas: despesas._count,
      countPendentes: pendentes._count,
    }
  }

  // =============================
  // BUSCAR POR ID
  // =============================
  static async findById(id: string, tenantId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    if (!transaction) {
      throw new AppError({
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Transação não encontrada',
        statusCode: 404,
        metadata: { id },
      })
    }

    return transaction
  }

  // =============================
  // CRIAR
  // =============================
  static async create(data: CreateTransactionDTO, tenantId: string, userId: string) {
    const isPaid = data.isPaid ?? true

    const transaction = await prisma.transaction.create({
      data: {
        tenantId,
        userId,
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        isPaid,
        paidAt: isPaid ? new Date() : null,
        paymentMethod: data.paymentMethod ?? null,
        serviceId: data.serviceId ?? null,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
      },
    })

    await ActivityService.create({
      tenantId,
      userId,
      action: 'TRANSACTION_CREATED',
      description: `${data.type === 'RECEITA' ? 'Receita' : 'Despesa'} registrada: ${data.description}`,
      metadata: {
        transactionId: transaction.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        serviceId: data.serviceId,
      },
    })

    return transaction
  }

  // =============================
  // ATUALIZAR
  // =============================
  static async update(id: string, data: UpdateTransactionDTO, tenantId: string, userId?: string) {
    const existing = await prisma.transaction.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      throw new AppError({
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Transação não encontrada',
        statusCode: 404,
        metadata: { id },
      })
    }

    // Se está marcando como pago agora, registra paidAt
    const isBeingPaid = data.isPaid === true && !existing.isPaid

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        ...(isBeingPaid && { paidAt: new Date() }),
      },
    })

    await ActivityService.create({
      tenantId,
      userId: userId ?? null,
      action: 'TRANSACTION_UPDATED',
      description: `Transação atualizada: ${transaction.description}`,
      metadata: {
        transactionId: id,
        isPaid: transaction.isPaid,
      },
    })

    return transaction
  }

  // =============================
  // EXCLUIR
  // =============================
  static async delete(id: string, tenantId: string, userId?: string) {
    const existing = await prisma.transaction.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      throw new AppError({
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Transação não encontrada',
        statusCode: 404,
        metadata: { id },
      })
    }

    // Não permite excluir transações geradas automaticamente por OS
    if (existing.serviceId) {
      throw new AppError({
        code: ERROR_CODES.FORBIDDEN,
        message: 'Transações geradas por OS não podem ser excluídas manualmente. Cancele a OS.',
        statusCode: 403,
        metadata: { id, serviceId: existing.serviceId },
      })
    }

    await prisma.transaction.delete({ where: { id } })

    await ActivityService.create({
      tenantId,
      userId: userId ?? null,
      action: 'TRANSACTION_DELETED',
      description: `Transação excluída: ${existing.description}`,
      metadata: { transactionId: id, amount: existing.amount, type: existing.type },
    })

    return { success: true, id }
  }
}
