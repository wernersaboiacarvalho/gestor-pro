'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters/currency'
import { Clock3, DollarSign, Package, Plus, Wrench } from 'lucide-react'

interface ServiceStatsProps {
  total: number
  pending: number
  inProgress: number
  completed: number
  totalRevenue: number
}

export function ServiceStats({
  total,
  pending,
  inProgress,
  completed,
  totalRevenue,
}: ServiceStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between text-xs uppercase text-muted-foreground">
            Total
            <Wrench className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between text-xs uppercase text-muted-foreground">
            Pendentes
            <Plus className="h-4 w-4 text-amber-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{pending}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between text-xs uppercase text-muted-foreground">
            Em andamento
            <Clock3 className="h-4 w-4 text-blue-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{inProgress}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between text-xs uppercase text-muted-foreground">
            Concluidos
            <Package className="h-4 w-4 text-green-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{completed}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between text-xs uppercase text-muted-foreground">
            Faturamento
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</div>
        </CardContent>
      </Card>
    </div>
  )
}
