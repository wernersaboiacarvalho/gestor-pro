'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Plus, ReceiptText, WalletCards } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PERMISSIONS, usePermissions } from '@/hooks/use-permissions'
import { useToast } from '@/hooks/use-toast'
import { useCreateServicePayment } from '@/hooks/use-services-query'
import { formatCurrency } from '@/lib/formatters/currency'
import type { Service } from '@/types/service.types'
import type { PaymentMethod, Transaction } from '@/types/transaction'

interface ServicePaymentPanelProps {
  service: Service
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartao credito',
  CARTAO_DEBITO: 'Cartao debito',
  PIX: 'PIX',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferencia',
  OUTRO: 'Outro',
}

const paymentMethods = Object.entries(paymentMethodLabels) as Array<[PaymentMethod, string]>

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value?: string | null) {
  if (!value) return 'Sem data'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sem data'

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function getTransactionAmount(transaction: Transaction) {
  return Number(transaction.amount || 0)
}

export function ServicePaymentPanel({ service }: ServicePaymentPanelProps) {
  const payments = useMemo(
    () => (service.transactions || []).filter((transaction) => transaction.type === 'RECEITA'),
    [service.transactions]
  )
  const totalValue = Number(service.totalValue || 0)
  const received = payments
    .filter((transaction) => transaction.isPaid)
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0)
  const pending = payments
    .filter((transaction) => !transaction.isPaid)
    .reduce((sum, transaction) => sum + getTransactionAmount(transaction), 0)
  const remaining = Math.max(totalValue - received, 0)

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(() => String(remaining || totalValue || ''))
  const [date, setDate] = useState(todayInputValue())
  const [isPaid, setIsPaid] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'NONE'>('PIX')
  const [notes, setNotes] = useState('')
  const createPayment = useCreateServicePayment(service.id)
  const { success, error: showError } = useToast()
  const { hasPermission } = usePermissions()
  const canManagePayments = hasPermission(PERMISSIONS.FINANCEIRO)

  const resetForm = () => {
    setAmount(String(remaining || totalValue || ''))
    setDate(todayInputValue())
    setIsPaid(true)
    setPaymentMethod('PIX')
    setNotes('')
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) resetForm()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      showError('Valor invalido', 'Informe um valor maior que zero.')
      return
    }

    createPayment.mutate(
      {
        amount: numericAmount,
        date,
        isPaid,
        paymentMethod: paymentMethod === 'NONE' ? null : paymentMethod,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setOpen(false)
          success(isPaid ? 'Recebimento registrado!' : 'Cobranca pendente registrada!')
        },
        onError: (err) => showError('Erro ao registrar recebimento', err.message),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-lg">
          <span className="flex items-center gap-2">
            <WalletCards className="h-5 w-5 text-primary" />
            Recebimentos
          </span>
          <Badge variant={remaining > 0 ? 'outline' : 'default'}>
            {remaining > 0 ? 'Em aberto' : 'Quitado'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">Total</div>
            <div className="font-semibold">{formatCurrency(totalValue)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">Recebido</div>
            <div className="font-semibold text-emerald-700">{formatCurrency(received)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">Pendente</div>
            <div className="font-semibold text-amber-700">{formatCurrency(pending)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground">A receber</div>
            <div className="font-semibold">{formatCurrency(remaining)}</div>
          </div>
        </div>

        {canManagePayments ? (
          <Button className="w-full" onClick={() => handleOpenChange(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar recebimento
          </Button>
        ) : (
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Seu usuario pode consultar os recebimentos, mas precisa de acesso ao financeiro para
            registrar pagamentos.
          </div>
        )}

        {payments.length > 0 ? (
          <div className="space-y-2">
            {payments.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={payment.isPaid ? 'default' : 'outline'}>
                      {payment.isPaid ? 'Pago' : 'Pendente'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(payment.date)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {payment.paymentMethod
                      ? paymentMethodLabels[payment.paymentMethod]
                      : 'Sem forma'}
                  </div>
                </div>
                <div className="font-semibold">{formatCurrency(payment.amount)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Nenhum recebimento vinculado a esta OS ainda.
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar recebimento</DialogTitle>
            <DialogDescription>
              Lance um pagamento recebido ou uma cobranca pendente vinculada a esta OS.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="service-payment-amount">Valor</Label>
                <Input
                  id="service-payment-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-payment-date">Data</Label>
                <Input
                  id="service-payment-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod | 'NONE')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                  <SelectItem value="NONE">Nao informado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <Checkbox
                checked={isPaid}
                onCheckedChange={(checked) => setIsPaid(Boolean(checked))}
              />
              <span>
                <span className="block font-medium">Marcar como pago</span>
                <span className="text-muted-foreground">
                  Desmarque para registrar uma cobranca ainda pendente.
                </span>
              </span>
            </label>

            <div className="space-y-2">
              <Label htmlFor="service-payment-notes">Observacoes</Label>
              <Textarea
                id="service-payment-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ex.: entrada, parcelamento, comprovante enviado..."
                maxLength={500}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createPayment.isPending}>
                <ReceiptText className="mr-2 h-4 w-4" />
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
