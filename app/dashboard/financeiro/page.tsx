// app/dashboard/financeiro/page.tsx

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  CreditCard,
  ArrowUpDown,
  Download,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/common/page-header'
import { StatsCard } from '@/components/ui/stats-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import {
  useTransactions,
  useTransactionsSummary,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useToggleTransactionPaid,
} from '@/hooks/use-transactions-query'
import type { Transaction, PaymentMethod } from '@/types/transaction'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'OUTRO', label: 'Outro' },
]

const CATEGORIES = [
  'Serviços',
  'Peças',
  'Mão de Obra',
  'Terceirizados',
  'Aluguel',
  'Utilidades',
  'Salários',
  'Impostos',
  'Marketing',
  'Manutenção',
  'Outros',
]

interface TransactionFormData {
  type: 'RECEITA' | 'DESPESA'
  category: string
  description: string
  amount: string
  date: string
  dueDate: string
  isPaid: boolean
  paymentMethod: PaymentMethod | ''
  notes: string
  reference: string
}

export default function FinanceiroPage() {
  const { success, error: showError, apiError: showApiError } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [periodFilter, setPeriodFilter] = useState<string>('ALL')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction
    direction: 'asc' | 'desc'
  }>({ key: 'date', direction: 'desc' })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)

  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'RECEITA',
    category: '',
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: '',
    isPaid: true,
    paymentMethod: '',
    notes: '',
    reference: '',
  })

  // React Query hooks
  const { data: txData, isLoading: txLoading } = useTransactions({
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    isPaid: statusFilter === 'PAID' ? true : statusFilter === 'PENDING' ? false : undefined,
    category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
  })
  const { data: summaryData } = useTransactionsSummary()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const togglePaid = useToggleTransactionPaid()

  const transactions = txData?.items || []
  const stats = summaryData || null
  const loading = txLoading

  // Handlers
  const handleSort = (key: keyof Transaction) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]
    if (aValue == null) return 1
    if (bValue == null) return -1
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const resetForm = () => {
    setFormData({
      type: 'RECEITA',
      category: '',
      description: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: '',
      isPaid: true,
      paymentMethod: '',
      notes: '',
      reference: '',
    })
    setEditingTransaction(null)
  }

  const openModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction)
      setFormData({
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        amount: transaction.amount.toString(),
        date: format(new Date(transaction.date), 'yyyy-MM-dd'),
        dueDate: transaction.dueDate ? format(new Date(transaction.dueDate), 'yyyy-MM-dd') : '',
        isPaid: transaction.isPaid,
        paymentMethod: (transaction.paymentMethod as PaymentMethod) || '',
        notes: transaction.notes || '',
        reference: transaction.reference || '',
      })
    } else {
      resetForm()
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description || !formData.amount || !formData.category) {
      showError('Campos obrigatórios', 'Preencha todos os campos obrigatórios.')
      return
    }

    const amount = parseFloat(formData.amount.replace(/\./g, '').replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      showError('Valor inválido', 'O valor deve ser maior que zero.')
      return
    }

    const payload = {
      ...formData,
      amount,
      paymentMethod: formData.paymentMethod || undefined,
    }

    setIsSubmitting(true)

    if (editingTransaction) {
      updateTransaction.mutate(
        { id: editingTransaction.id, data: payload },
        {
          onSuccess: () => {
            success('Transação atualizada', 'A transação foi atualizada com sucesso.')
            closeModal()
          },
          onError: (err) => {
            showApiError(err)
          },
          onSettled: () => {
            setIsSubmitting(false)
          },
        }
      )
    } else {
      createTransaction.mutate(payload, {
        onSuccess: () => {
          success('Transação criada', 'A transação foi criada com sucesso.')
          closeModal()
        },
        onError: (err) => {
          showApiError(err)
        },
        onSettled: () => {
          setIsSubmitting(false)
        },
      })
    }
  }

  const confirmDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (!transactionToDelete) return

    deleteTransaction.mutate(transactionToDelete.id, {
      onSuccess: () => {
        success('Transação excluída', 'A transação foi excluída com sucesso.')
        setIsDeleteDialogOpen(false)
        setTransactionToDelete(null)
      },
      onError: (err) => showApiError(err),
    })
  }

  const handleTogglePaid = (transaction: Transaction) => {
    togglePaid.mutate(
      { id: transaction.id, isPaid: transaction.isPaid },
      {
        onSuccess: () =>
          success(
            transaction.isPaid ? 'Marcado como pendente' : 'Marcado como pago',
            `A transação foi marcada como ${transaction.isPaid ? 'pendente' : 'pago'}.`
          ),
        onError: (err) => showApiError(err),
      }
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR })
  }

  const getPaymentMethodLabel = (method?: string | null) => {
    return PAYMENT_METHODS.find((m) => m.value === method)?.label || method || '—'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Gestão de receitas e despesas do seu negócio"
        actions={
          <Button onClick={() => openModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
        }
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Receitas"
            value={formatCurrency(stats.totalReceitas ?? 0)}
            icon={TrendingUp}
            description="Total no período"
            className="border-l-4 border-l-emerald-500"
          />
          <StatsCard
            title="Despesas"
            value={formatCurrency(stats.totalDespesas ?? 0)}
            icon={TrendingDown}
            description="Total no período"
            className="border-l-4 border-l-red-500"
          />
          <StatsCard
            title="Saldo"
            value={formatCurrency(stats.saldo ?? 0)}
            icon={Wallet}
            description="Receitas - Despesas"
            className={`border-l-4 ${(stats.saldo ?? 0) >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}
          />
          <StatsCard
            title="Pendentes"
            value={(stats.pendentes ?? 0).toString()}
            icon={AlertCircle}
            description={formatCurrency(stats.totalPendente ?? 0)}
            className="border-l-4 border-l-amber-500"
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por descrição, categoria ou referência..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full md:w-40 space-y-2">
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="RECEITA">Receitas</SelectItem>
                  <SelectItem value="DESPESA">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-40 space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PAID">Pagos</SelectItem>
                  <SelectItem value="PENDING">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-48 space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-40 space-y-2">
              <Label>Período</Label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todo período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todo período</SelectItem>
                  <SelectItem value="TODAY">Hoje</SelectItem>
                  <SelectItem value="WEEK">Esta semana</SelectItem>
                  <SelectItem value="MONTH">Este mês</SelectItem>
                  <SelectItem value="YEAR">Este ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">
              Transações ({transactions.length})
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="Nenhuma transação encontrada"
              description="Cadastre sua primeira transação clicando no botão acima."
              action={{
                label: 'Nova Transação',
                onClick: () => openModal(),
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('date')}
                        className="-ml-3 h-8"
                      >
                        Data
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="h-10 px-4 text-left font-medium">Descrição</th>
                    <th className="h-10 px-4 text-left font-medium">Categoria</th>
                    <th className="h-10 px-4 text-left font-medium">Tipo</th>
                    <th className="h-10 px-4 text-right font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('amount')}
                        className="-ml-3 h-8"
                      >
                        Valor
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="h-10 px-4 text-center font-medium">Status</th>
                    <th className="h-10 px-4 text-left font-medium">Pagamento</th>
                    <th className="h-10 px-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle">
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDate(transaction.date)}</span>
                          {transaction.dueDate && !transaction.isPaid && (
                            <span className="text-xs text-amber-600">
                              Venc: {formatDate(transaction.dueDate)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col">
                          <span className="font-medium">{transaction.description}</span>
                          {transaction.reference && (
                            <span className="text-xs text-muted-foreground">
                              Ref: {transaction.reference}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline">{transaction.category}</Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge
                          variant={transaction.type === 'RECEITA' ? 'default' : 'secondary'}
                          className={
                            transaction.type === 'RECEITA'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-red-100 text-red-800 hover:bg-red-100'
                          }
                        >
                          {transaction.type === 'RECEITA' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <span
                          className={`font-semibold ${
                            transaction.type === 'RECEITA' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'RECEITA' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-center">
                        <button
                          onClick={() => handleTogglePaid(transaction)}
                          className="inline-flex items-center justify-center transition-colors hover:opacity-80"
                          title={transaction.isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                        >
                          {transaction.isPaid ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-amber-500" />
                          )}
                        </button>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">
                            {getPaymentMethodLabel(transaction.paymentMethod)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openModal(transaction)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePaid(transaction)}>
                              {transaction.isPaid ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Marcar como pendente
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Marcar como pago
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => confirmDelete(transaction)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
            <DialogDescription>
              {editingTransaction
                ? 'Edite os dados da transação abaixo.'
                : 'Preencha os dados para cadastrar uma nova transação.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'RECEITA' | 'DESPESA') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEITA">Receita</SelectItem>
                    <SelectItem value="DESPESA">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                placeholder="Ex: Serviço de troca de óleo"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="text"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.,]/g, '')
                    setFormData({ ...formData, amount: value })
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: PaymentMethod) =>
                    setFormData({ ...formData, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPaid"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isPaid" className="text-sm font-normal">
                Transação já está paga/recebida
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Referência</Label>
              <Input
                id="reference"
                placeholder="Ex: NF-e 1234, OS #567"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Observações adicionais..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Salvando...
                  </>
                ) : editingTransaction ? (
                  'Salvar Alterações'
                ) : (
                  'Criar Transação'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir Transação"
        description={`Tem certeza que deseja excluir a transação "${transactionToDelete?.description}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </div>
  )
}
