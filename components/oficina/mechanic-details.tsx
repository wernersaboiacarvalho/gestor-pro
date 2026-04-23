// components/oficina/mechanic-details.tsx
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Wrench, Phone, Mail, BadgeCheck, Clock, CheckCircle2, XCircle, Edit, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface Service {
    id: string;
    description: string;
    status: string;
    totalValue: number;
    createdAt: string;
    vehicle?: { plate: string; brand: string; model: string };
}

interface MechanicDetail {
    id: string;
    name: string;
    cpf: string | null;
    phone: string | null;
    email: string | null;
    specialty: string | null;
    commissionRate: number | null;
    status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
    notes: string | null;
    createdAt: string;
    services?: Service[];
}

// ✅ Interface corrigida: propriedade 'data' declarada corretamente
interface ApiResponse<T> {
    success: boolean
    data: T | null
}

interface MechanicDetailsProps {
    mechanicId: string
    onClose: () => void
    onEdit: () => void
}

const statusConfig = {
    ACTIVE: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
    INACTIVE: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
    ON_LEAVE: { label: 'Afastado', color: 'bg-yellow-100 text-yellow-800' },
}

const serviceStatusConfig = {
    PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800', icon: Clock },
    CONCLUIDO: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export default function MechanicDetails({ mechanicId, onClose, onEdit }: MechanicDetailsProps) {
    const [mechanic, setMechanic] = useState<MechanicDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        const fetchMechanic = async () => {
            try {
                setLoading(true)
                setError(null)

                const res = await fetch(`/api/mechanics/${mechanicId}`)
                if (!res.ok) throw new Error('Falha ao carregar mecânico')

                const result = await res.json()

                // ✅ Parse seguro: extrai 'data' do formato padronizado
                let mechanicData: MechanicDetail | null = null
                if (result && typeof result === 'object' && 'success' in result) {
                    const apiResult = result as ApiResponse<MechanicDetail>
                    mechanicData = apiResult.success ? apiResult.data : null
                } else if (result && 'id' in result) {
                    // Fallback para resposta direta (compatibilidade)
                    mechanicData = result as MechanicDetail
                }

                if (isMounted) {
                    setMechanic(mechanicData)
                    setLoading(false)
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Erro desconhecido')
                    setLoading(false)
                }
            }
        }

        fetchMechanic()

        return () => { isMounted = false }
    }, [mechanicId])

    // ✅ Cálculo defensivo: services pode ser undefined
    const calculateTotalEarnings = () => {
        if (!mechanic || !mechanic.services) return 0
        return mechanic.services
            .filter(s => s.status === 'CONCLUIDO')
            .reduce((total, service) => {
                const commission = (service.totalValue * (mechanic.commissionRate || 0)) / 100
                return total + commission
            }, 0)
    }

    if (loading) {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="animate-pulse text-muted-foreground">Carregando dados do mecânico...</div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4 mr-2" /> Fechar
                </Button>
            </div>
        )
    }

    if (error || !mechanic) {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="text-red-500 font-medium">{error || 'Mecânico não encontrado'}</div>
                <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
                    <Button size="sm" onClick={() => window.location.reload()}>Tentar novamente</Button>
                </div>
            </div>
        )
    }

    const totalEarned = calculateTotalEarnings()
    const completedServices = mechanic.services?.filter(s => s.status === 'CONCLUIDO').length || 0

    return (
        <div className="space-y-6">
            {/* Header com ações */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-500 p-3 text-white">
                        <Wrench className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{mechanic.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className={statusConfig[mechanic.status]?.color}>
                                {statusConfig[mechanic.status]?.label}
                            </Badge>
                            {mechanic.specialty && (
                                <span className="text-sm text-muted-foreground">• {mechanic.specialty}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Informações de Contato */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="border p-4 rounded-lg flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground uppercase">Telefone</p>
                        <p className="font-bold">{mechanic.phone || 'Não informado'}</p>
                    </div>
                </div>
                <div className="border p-4 rounded-lg flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground uppercase">Email</p>
                        <p className="font-bold">{mechanic.email || 'Não informado'}</p>
                    </div>
                </div>
                <div className="border p-4 rounded-lg flex items-center gap-3">
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground uppercase">CPF</p>
                        <p className="font-bold font-mono">{mechanic.cpf || 'Não informado'}</p>
                    </div>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-xs text-green-700 uppercase font-bold">Serviços Concluídos</p>
                    <p className="text-2xl font-bold text-green-900">{completedServices}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-700 uppercase font-bold">Total Ganho</p>
                    <p className="text-2xl font-bold text-blue-900">R$ {totalEarned.toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <p className="text-xs text-purple-700 uppercase font-bold">Total de Serviços</p>
                    <p className="text-2xl font-bold text-purple-900">{mechanic.services?.length || 0}</p>
                </div>
            </div>

            <Separator />

            {/* Histórico de Serviços - ✅ Safe access */}
            <div className="space-y-3">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4" /> Histórico de Serviços
                </h3>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs">Data</TableHead>
                                <TableHead className="text-xs">Veículo</TableHead>
                                <TableHead className="text-xs">Descrição</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                                <TableHead className="text-right text-xs">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mechanic.services?.length ? (
                                mechanic.services.map((s) => {
                                    const cfg = serviceStatusConfig[s.status as keyof typeof serviceStatusConfig] || serviceStatusConfig.PENDENTE
                                    return (
                                        <TableRow key={s.id}>
                                            <TableCell className="text-xs">{format(new Date(s.createdAt), 'dd/MM/yy')}</TableCell>
                                            <TableCell className="text-xs">
                                                {s.vehicle ? `${s.vehicle.plate} - ${s.vehicle.brand} ${s.vehicle.model}` : '-'}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-sm">{s.description}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${cfg.color} text-[10px]`}>
                                                    {cfg.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm">
                                                R$ {(s.totalValue || 0).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">
                                        Nenhum serviço registrado para este mecânico.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Observações */}
            {mechanic.notes && (
                <>
                    <Separator />
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase mb-1">
                            <Wrench className="h-4 w-4" /> Observações
                        </div>
                        <p className="text-sm text-amber-900 whitespace-pre-wrap">{mechanic.notes}</p>
                    </div>
                </>
            )}
        </div>
    )
}