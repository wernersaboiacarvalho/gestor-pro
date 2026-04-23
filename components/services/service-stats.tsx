// components/services/service-stats.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wrench, Plus, Package, DollarSign } from 'lucide-react'

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
                                 completed,
                                 totalRevenue,
                             }: ServiceStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase text-muted-foreground flex justify-between">
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
                    <CardTitle className="text-xs uppercase text-muted-foreground flex justify-between">
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
                    <CardTitle className="text-xs uppercase text-muted-foreground flex justify-between">
                        Concluídos
                        <Package className="h-4 w-4 text-green-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{completed}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase text-muted-foreground flex justify-between">
                        Faturamento
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                        R$ {totalRevenue.toFixed(2)}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}