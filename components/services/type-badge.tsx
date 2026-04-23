// components/services/type-badge.tsx

'use client'

import { Badge } from '@/components/ui/badge'

interface TypeBadgeProps {
    type: 'ORCAMENTO' | 'ORDEM_SERVICO'
}

const typeLabels = {
    ORCAMENTO: 'Orçamento',
    ORDEM_SERVICO: 'O.S.',
}

export function TypeBadge({ type }: TypeBadgeProps) {
    return (
        <Badge
            variant="outline"
            className={
                type === 'ORCAMENTO'
                    ? 'text-amber-600 border-amber-200'
                    : 'text-blue-600 border-blue-200'
            }
        >
            {typeLabels[type]}
        </Badge>
    )
}