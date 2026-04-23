// components/services/status-badge.tsx

'use client'

import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
    status: string
}

const statusColors = {
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    EM_ANDAMENTO: 'bg-blue-100 text-blue-800',
    CONCLUIDO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-red-100 text-red-800',
} as const

const statusLabels = {
    PENDENTE: 'Pendente',
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
} as const

export function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <Badge className={statusColors[status as keyof typeof statusColors]}>
            {statusLabels[status as keyof typeof statusLabels]}
        </Badge>
    )
}