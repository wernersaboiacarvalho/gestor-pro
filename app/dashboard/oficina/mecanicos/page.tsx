// app/dashboard/oficina/mecanicos/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Wrench, Users, TrendingUp, MoreVertical, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import MechanicForm from '@/components/oficina/mechanic-form'
import MechanicDetails from '@/components/oficina/mechanic-details'
import type { Mechanic } from '@/types/mechanic'
import type { PaginatedResponse } from '@/types/pagination'

interface MechanicStats {
    total: number
    active: number
    withServices: number
    topSpecialties: string[]
}

export default function MecanicosPage() {
    const [mechanics, setMechanics] = useState<Mechanic[]>([])
    const [stats, setStats] = useState<MechanicStats>({
        total: 0,
        active: 0,
        withServices: 0,
        topSpecialties: [],
    })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)

    /**
     * Calcula estatísticas dos mecânicos
     */
    const calculateStats = useCallback((data: Mechanic[]) => {
        const total = data.length
        const active = data.filter((m) => m.status === 'ACTIVE').length
        const withServices = data.filter((m) => m._count && m._count.serviceMechanics > 0).length

        // Top especialidades
        const specialties = data.filter((m) => m.specialty).map((m) => m.specialty!)
        const uniqueSpecialties = [...new Set(specialties)]

        setStats({
            total,
            active,
            withServices,
            topSpecialties: uniqueSpecialties.slice(0, 5),
        })
    }, [])

    /**
     * Carrega mecânicos da API
     */
    const loadMechanics = useCallback(async () => {
        try {
            setLoading(true)

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '50',
                ...(searchTerm && { search: searchTerm }),
                ...(statusFilter !== 'ALL' && { status: statusFilter }),
            })

            const response = await fetch(`/api/mechanics?${params}`)

            if (!response.ok) {
                throw new Error('Erro ao carregar mecânicos')
            }

            const result = await response.json()

            if (result.success) {
                const data = result.data as PaginatedResponse<Mechanic>
                setMechanics(data.items)
                setTotalPages(data.pagination.totalPages)
                calculateStats(data.items)
            }
        } catch (error) {
            console.error('Erro ao carregar mecânicos:', error)
        } finally {
            setLoading(false)
        }
    }, [currentPage, searchTerm, statusFilter, calculateStats])

    useEffect(() => {
        loadMechanics()
    }, [loadMechanics])

    /**
     * Handlers
     */
    const handleCreate = () => {
        setSelectedMechanic(null)
        setIsFormOpen(true)
    }

    const handleEdit = (mechanic: Mechanic) => {
        setSelectedMechanic(mechanic)
        setIsFormOpen(true)
    }

    const handleViewDetails = (mechanic: Mechanic) => {
        setSelectedMechanic(mechanic)
        setIsDetailsOpen(true)
    }

    const handleDelete = async (mechanic: Mechanic) => {
        if (mechanic._count && mechanic._count.serviceMechanics > 0) {
            alert('Não é possível excluir um mecânico com serviços vinculados!')
            return
        }

        if (!confirm(`Tem certeza que deseja excluir ${mechanic.name}?`)) {
            return
        }

        try {
            const response = await fetch(`/api/mechanics/${mechanic.id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                loadMechanics()
            } else {
                const error = await response.json()
                alert(error.error?.message || 'Erro ao excluir mecânico')
            }
        } catch (error) {
            console.error('Erro ao excluir mecânico:', error)
            alert('Erro ao excluir mecânico')
        }
    }

    const handleFormSuccess = () => {
        setIsFormOpen(false)
        setSelectedMechanic(null)
        loadMechanics()
    }

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1) // Reset para página 1
    }

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value)
        setCurrentPage(1) // Reset para página 1
    }

    /**
     * Renderiza badge de status
     */
    const getStatusBadge = (status: string) => {
        const variants: Record<
            string,
            { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
        > = {
            ACTIVE: { variant: 'default', label: 'Ativo' },
            INACTIVE: { variant: 'secondary', label: 'Inativo' },
            ON_LEAVE: { variant: 'outline', label: 'Afastado' },
        }
        const config = variants[status] || variants.ACTIVE
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    // ✅ CORREÇÃO: Usar 'text' em vez de 'message'
    if (loading && currentPage === 1) {
        return (
            <div className="flex items-center justify-center h-96">
                <LoadingSpinner size="lg" text="Carregando mecânicos..." />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mecânicos</h1>
                    <p className="text-gray-600 mt-1">Gerencie os mecânicos e técnicos da oficina</p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Mecânico
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Total de Mecânicos
                        </CardTitle>
                        <Users className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Ativos</CardTitle>
                        <Wrench className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Com Serviços
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.withServices}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Especialidades
                        </CardTitle>
                        <Wrench className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {stats.topSpecialties.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por nome, CPF, telefone, email ou especialidade..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={handleStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos os Status</SelectItem>
                                <SelectItem value="ACTIVE">Ativo</SelectItem>
                                <SelectItem value="INACTIVE">Inativo</SelectItem>
                                <SelectItem value="ON_LEAVE">Afastado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Especialidade</TableHead>
                                <TableHead>Contato</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Serviços</TableHead>
                                <TableHead className="text-right">Comissão</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && currentPage > 1 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <LoadingSpinner size="sm" />
                                    </TableCell>
                                </TableRow>
                            ) : mechanics.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <EmptyState
                                            icon={Wrench}
                                            title="Nenhum mecânico encontrado"
                                            description={
                                                searchTerm || statusFilter !== 'ALL'
                                                    ? 'Tente ajustar os filtros de busca'
                                                    : 'Comece cadastrando o primeiro mecânico'
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                mechanics.map((mechanic) => (
                                    <TableRow key={mechanic.id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                <div>{mechanic.name}</div>
                                                {mechanic.cpf && (
                                                    <div className="text-xs text-gray-500">CPF: {mechanic.cpf}</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {mechanic.specialty ? (
                                                <Badge variant="outline">{mechanic.specialty}</Badge>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {mechanic.phone && <div>{mechanic.phone}</div>}
                                                {mechanic.email && (
                                                    <div className="text-gray-500">{mechanic.email}</div>
                                                )}
                                                {!mechanic.phone && !mechanic.email && (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(mechanic.status)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">
                                                {mechanic._count?.serviceMechanics || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {mechanic.commissionRate && mechanic.commissionRate > 0 ? (
                                                <span className="text-green-600 font-medium">
                          {mechanic.commissionRate}%
                        </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleViewDetails(mechanic)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Ver Detalhes
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEdit(mechanic)}>
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(mechanic)}
                                                        className="text-red-600"
                                                        disabled={
                                                            mechanic._count ? mechanic._count.serviceMechanics > 0 : false
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-600">
                                Página {currentPage} de {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || loading}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || loading}
                                >
                                    Próxima
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <MechanicForm
                        mechanic={selectedMechanic}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedMechanic && (
                        <MechanicDetails
                            mechanicId={selectedMechanic.id}
                            onClose={() => setIsDetailsOpen(false)}
                            onEdit={() => {
                                setIsDetailsOpen(false)
                                handleEdit(selectedMechanic)
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}