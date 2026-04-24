// types/transaction.ts

export type TransactionType = 'RECEITA' | 'DESPESA'

export type PaymentMethod =
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'PIX'
  | 'BOLETO'
  | 'TRANSFERENCIA'
  | 'OUTRO'

export interface Transaction {
  id: string
  type: TransactionType
  category: string
  description: string
  amount: number
  date: string
  dueDate?: string | null
  isPaid: boolean
  paidAt?: string | null
  paymentMethod?: PaymentMethod | null
  serviceId?: string | null
  reference?: string | null
  notes?: string | null
  userId?: string | null
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface TransactionStats {
  totalReceitas: number
  totalDespesas: number
  saldo: number
  pendentes: number
  totalPendente: number
  count: number
}

export interface CreateTransactionDTO {
  type: TransactionType
  category: string
  description: string
  amount: number
  date: string
  dueDate?: string
  isPaid: boolean
  paymentMethod?: PaymentMethod
  notes?: string
  reference?: string
  serviceId?: string
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
  notes?: string | null
  reference?: string | null
  serviceId?: string | null
}

export interface ListTransactionsDTO {
  type?: TransactionType
  status?: 'PAID' | 'PENDING'
  category?: string
  period?: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'
  search?: string
  page?: number
  limit?: number
}
