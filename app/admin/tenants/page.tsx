// app/admin/tenants/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash, Eye, Users } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface Tenant {
    id: string
    name: string
    slug: string
    businessType: string
    status: string
    createdAt: string
    _count: {
        users: number
        customers: number
        services: number
    }
}

interface TenantFormData {
    name: string
    slug: string
    businessType: string
    status: string
}

const businessTypeLabels: Record<string, string> = {
    OFICINA: 'Oficina',
    RESTAURANTE: 'Restaurante',
    ACADEMIA: 'Academia',
    GENERICO: 'Genérico'
}

const statusLabels: Record<string, string> = {
    ACTIVE: 'Ativo',
    TRIAL: 'Trial',
    INACTIVE: 'Inativo',
    SUSPENDED: 'Suspenso'
}

const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    TRIAL: 'bg-yellow-100 text-yellow-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    SUSPENDED: 'bg-red-100 text-red-800'
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    const { register, handleSubmit, reset, control, setValue, watch } = useForm<TenantFormData>({
        defaultValues: {
            status: 'TRIAL',
            businessType: 'GENERICO'
        }
    })

    const watchName = watch('name')

    // Auto-gerar slug baseado no nome
    useEffect(() => {
        if (watchName) {
            const slug = watchName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            setValue('slug', slug)
        }
    }, [watchName, setValue])

    useEffect(() => {
        fetchTenants()
    }, [])

    const fetchTenants = async () => {
        try {
            const response = await fetch('/api/admin/tenants')
            if (response.ok) {
                const data = await response.json()
                setTenants(data)
            }
        } catch (error) {
            console.error('Error fetching tenants:', error)
        } finally {
            setLoading(false)
        }
    }

    const onSubmit = async (data: TenantFormData) => {
        try {
            const response = await fetch('/api/admin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (response.ok) {
                reset()
                setDialogOpen(false)
                fetchTenants()
            }
        } catch (error) {
            console.error('Error creating tenant:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este tenant? Esta ação não pode ser desfeita.')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/tenants/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchTenants()
            }
        } catch (error) {
            console.error('Error deleting tenant:', error)
        }
    }

    const filteredTenants = tenants.filter(tenant =>
        tenant.name.toLowerCase().includes(search.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-lg text-gray-500">Carregando tenants...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
                    <p className="text-muted-foreground">
                        Gerencie todos os tenants do sistema
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Tenant
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Tenant</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="name">Nome da Empresa *</Label>
                                    <Input
                                        id="name"
                                        {...register('name', { required: true })}
                                        placeholder="Ex: Oficina Silva"
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="slug">Slug (URL) *</Label>
                                    <Input
                                        id="slug"
                                        {...register('slug', { required: true })}
                                        placeholder="oficina-silva"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Será usado na URL: /dashboard (gerado automaticamente)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="businessType">Tipo de Negócio *</Label>
                                    <Controller
                                        name="businessType"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="OFICINA">Oficina</SelectItem>
                                                    <SelectItem value="RESTAURANTE">Restaurante</SelectItem>
                                                    <SelectItem value="ACADEMIA">Academia</SelectItem>
                                                    <SelectItem value="GENERICO">Genérico</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="TRIAL">Trial</SelectItem>
                                                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                                                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                                                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-2">📦 Módulos Incluídos</h4>
                                <p className="text-sm text-blue-700">
                                    Módulos serão configurados automaticamente baseado no tipo de negócio:
                                </p>
                                <ul className="text-sm text-blue-600 mt-2 space-y-1">
                                    <li>✓ Clientes</li>
                                    <li>✓ Serviços/Ordens</li>
                                    <li>✓ Produtos (se aplicável)</li>
                                    <li>✓ Agenda (se aplicável)</li>
                                </ul>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                                    Criar Tenant
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{tenants.length}</div>
                        <p className="text-xs text-muted-foreground">Total de Tenants</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">
                            {tenants.filter(t => t.status === 'ACTIVE').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Ativos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">
                            {tenants.filter(t => t.status === 'TRIAL').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Em Trial</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">
                            {tenants.reduce((acc, t) => acc + t._count.users, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Total de Usuários</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabela de Tenants */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar tenants..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tenant</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Usuários</TableHead>
                                <TableHead className="text-center">Clientes</TableHead>
                                <TableHead className="text-center">Serviços</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                                        Nenhum tenant encontrado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTenants.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{tenant.name}</div>
                                                <div className="text-xs text-gray-500">/{tenant.slug}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {businessTypeLabels[tenant.businessType]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[tenant.status]}>
                                                {statusLabels[tenant.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Users className="h-3 w-3 text-gray-400" />
                                                {tenant._count.users}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {tenant._count.customers}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {tenant._count.services}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-500">
                                            {format(new Date(tenant.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/admin/tenants/${tenant.id}`}>
                                                    <Button variant="ghost" size="icon" title="Ver detalhes">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(tenant.id)}
                                                    title="Excluir"
                                                >
                                                    <Trash className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}