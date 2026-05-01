// components/services/service-table.tsx

'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Car, CheckCircle2, Edit, FileText, Share2 } from 'lucide-react'
import type { Service } from '@/types/service.types'
import { formatCurrency } from '@/lib/formatters/currency'

interface ServiceTableProps {
  services: Service[]
  searchTerm: string
  onEdit: (service: Service) => void
  onApprove: (service: Service) => void
  onShare: (service: Service) => void
  approvingId?: string | null
  sharingId?: string | null
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

const typeLabels = {
  ORCAMENTO: 'Orçamento',
  ORDEM_SERVICO: 'O.S.',
}

export function ServiceTable({
  services,
  searchTerm,
  onEdit,
  onApprove,
  onShare,
  approvingId,
  sharingId,
}: ServiceTableProps) {
  const filteredServices = services.filter(
    (s) =>
      s.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.vehicle?.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Cliente / Veículo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredServices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Nenhum serviço encontrado
              </TableCell>
            </TableRow>
          ) : (
            filteredServices.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      s.type === 'ORCAMENTO'
                        ? 'text-amber-600 border-amber-200'
                        : 'text-blue-600 border-blue-200'
                    }
                  >
                    {typeLabels[s.type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-semibold">{s.customer.name}</div>
                  {s.vehicle && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {s.vehicle.plate} - {s.vehicle.brand} {s.vehicle.model}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[s.status as keyof typeof statusColors]}>
                    {statusLabels[s.status as keyof typeof statusLabels]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(s.totalValue)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Button variant="ghost" size="icon" title="Editar" onClick={() => onEdit(s)}>
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    {s.type === 'ORCAMENTO' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Aprovar e virar OS"
                        disabled={approvingId === s.id}
                        onClick={() => onApprove(s)}
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Copiar link para cliente"
                      disabled={sharingId === s.id}
                      onClick={() => onShare(s)}
                    >
                      <Share2 className="h-4 w-4 text-emerald-600" />
                    </Button>
                    <Button asChild variant="ghost" size="icon" title="Imprimir/PDF">
                      <Link href={`/dashboard/services/${s.id}/print`} target="_blank">
                        <FileText className="h-4 w-4 text-slate-600" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
