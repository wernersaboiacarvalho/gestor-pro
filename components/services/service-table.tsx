'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/formatters/currency'
import { getServiceOperationalFlags } from '@/lib/services/service-operational-flags'
import type { Service } from '@/types/service.types'
import { Car, CheckCircle2, Edit, Eye, FileText, Share2 } from 'lucide-react'

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
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluido',
  CANCELADO: 'Cancelado',
} as const

const typeLabels = {
  ORCAMENTO: 'Orcamento',
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
  const normalizedSearch = searchTerm.toLowerCase()
  const filteredServices = services.filter(
    (service) =>
      service.customer.name.toLowerCase().includes(normalizedSearch) ||
      service.vehicle?.plate.toLowerCase().includes(normalizedSearch) ||
      service.description.toLowerCase().includes(normalizedSearch)
  )

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Cliente / Veiculo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Atencao</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredServices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Nenhum servico encontrado
              </TableCell>
            </TableRow>
          ) : (
            filteredServices.map((service) => {
              const flags = getServiceOperationalFlags(service)

              return (
                <TableRow key={service.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        service.type === 'ORCAMENTO'
                          ? 'border-amber-200 text-amber-600'
                          : 'border-blue-200 text-blue-600'
                      }
                    >
                      {typeLabels[service.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{service.customer.name}</div>
                    {service.vehicle && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Car className="h-3 w-3" />
                        {service.vehicle.plate} - {service.vehicle.brand} {service.vehicle.model}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[service.status as keyof typeof statusColors]}>
                      {statusLabels[service.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {flags.length === 0 ? (
                      <span className="text-xs text-muted-foreground">-</span>
                    ) : (
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {flags.slice(0, 3).map((flag) => (
                          <Badge
                            key={flag.key}
                            variant="outline"
                            className={flag.className}
                            title={flag.description}
                          >
                            {flag.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(service.totalValue)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button asChild variant="ghost" size="icon" title="Ver detalhes">
                        <Link href={`/dashboard/services/${service.id}`}>
                          <Eye className="h-4 w-4 text-slate-700" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar"
                        onClick={() => onEdit(service)}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      {service.type === 'ORCAMENTO' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Aprovar e virar OS"
                          disabled={approvingId === service.id}
                          onClick={() => onApprove(service)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Copiar link para cliente"
                        disabled={sharingId === service.id}
                        onClick={() => onShare(service)}
                      >
                        <Share2 className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button asChild variant="ghost" size="icon" title="Imprimir/PDF">
                        <Link href={`/dashboard/services/${service.id}/print`} target="_blank">
                          <FileText className="h-4 w-4 text-slate-600" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
