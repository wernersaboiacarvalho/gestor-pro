// app/admin/tenants/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Building2,
    Users,
    UserCheck,
    Package,
    Wrench,
    Calendar,
    Edit,
    Trash
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface TenantDetail {
    id: string
    name: string
    slug: string
    businessType: string
    status: string
    createdAt: string
    updatedAt: string
    modules: Record<string, boolean>
    users: Array<{
        id: string
        name: string
        email: string
        role: string
        createdAt: string
        lastLoginAt?: string
    }>
    _count: {
        customers: number
        services: number
        products: number
    }
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

const roleLabels: Record<string, string> = {
    OWNER: 'Proprietário',
    ADMIN: 'Administrador',
    EMPLOYEE: 'Funcionário',
    USER: 'Usuário'
}

export default function TenantDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [tenant, setTenant] = useState<TenantDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const response = await fetch(`/api/admin/tenants/${params.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setTenant(data)
                }
            } catch (error) {
                console.error('Error fetching tenant:', error)
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchTenant()
        }
    }, [params.id])

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este tenant? Esta ação não pode ser desfeita.')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/tenants/${params.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                router.push('/admin/tenants')
            }
        } catch (error) {
            console.error('Error deleting tenant:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-lg text-gray-500">Carregando...</div>
            </div>
        )
    }

    if (!tenant) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="text-lg text-gray-500">Tenant não encontrado</div>
                <Link href="/admin/tenants">
                    <Button variant="outline">Voltar para Tenants</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/tenants">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
                        <p className="text-muted-foreground">/{tenant.slug}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                    <Button variant="outline" onClick={handleDelete} className="text-red-600">
                        <Trash className="mr-2 h-4 w-4" />
                        Excluir
                    </Button>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tipo</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline">{businessTypeLabels[tenant.businessType]}</Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Badge className={statusColors[tenant.status]}>
                            {statusLabels[tenant.status]}
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Criado em</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            {format(new Date(tenant.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tenant.users.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Estatísticas */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tenant._count.customers}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Serviços</CardTitle>
                        <Wrench className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tenant._count.services}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                        <Package className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tenant._count.products}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Usuários */}
            <Card>
                <CardHeader>
                    <CardTitle>Usuários do Tenant</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Função</TableHead>
                                <TableHead>Cadastro</TableHead>
                                <TableHead>Último Login</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenant.users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        Nenhum usuário cadastrado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tenant.users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{roleLabels[user.role]}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                        </TableCell>
                                        <TableCell>
                                            {user.lastLoginAt
                                                ? format(new Date(user.lastLoginAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                                                : 'Nunca'
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Módulos Ativos */}
            <Card>
                <CardHeader>
                    <CardTitle>Módulos Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {tenant.modules && Object.entries(tenant.modules).map(([key, value]) => (
                            <div
                                key={key}
                                className={`p-4 rounded-lg border ${value ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {value ? (
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                    ) : (
                                        <div className="h-2 w-2 rounded-full bg-gray-300" />
                                    )}
                                    <span className="font-medium capitalize">{key}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}