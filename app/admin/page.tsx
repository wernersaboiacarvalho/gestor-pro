// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, UserCheck, Activity as ActivityIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {Button} from "@/components/ui/button";

interface Stats {
    totalTenants: number
    activeTenants: number
    totalUsers: number
    totalCustomers: number
    tenantsByType: Array<{ businessType: string; _count: number }>
    tenantsByStatus: Array<{ status: string; _count: number }>
    recentActivities: Array<{
        id: string
        action: string
        description: string
        createdAt: string
        tenant?: { name: string }
        user?: { name: string }
    }>
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats')
            const data = await response.json()
            setStats(data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-lg text-gray-500">Carregando...</div>
            </div>
        )
    }

    if (!stats) return null

    const cards = [
        {
            title: 'Total de Tenants',
            value: stats.totalTenants,
            icon: Building2,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            title: 'Tenants Ativos',
            value: stats.activeTenants,
            icon: UserCheck,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            title: 'Total de Usuários',
            value: stats.totalUsers,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Total de Clientes',
            value: stats.totalCustomers,
            icon: ActivityIcon,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        }
    ]

    const businessTypeLabels: Record<string, string> = {
        OFICINA: 'Oficinas',
        RESTAURANTE: 'Restaurantes',
        ACADEMIA: 'Academias',
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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Visão geral de todos os tenants e atividades
                </p>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${card.bgColor}`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Tenants por Tipo */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Tenants por Tipo de Negócio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.tenantsByType.map((item) => (
                                <div key={item.businessType} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {businessTypeLabels[item.businessType]}
                  </span>
                                    <Badge variant="secondary">{item._count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Tenants por Status */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.tenantsByStatus.map((item) => (
                                <div key={item.status} className="flex items-center justify-between">
                                    <Badge className={statusColors[item.status]}>
                                        {statusLabels[item.status]}
                                    </Badge>
                                    <span className="text-sm font-bold">{item._count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Atividades Recentes */}
                <Card className="col-span-7 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Atividades Recentes</CardTitle>
                        <Link href="/admin/activities" className="text-sm text-purple-600 hover:underline">
                            Ver todas
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentActivities.slice(0, 5).map((activity) => (
                                <div key={activity.id} className="flex flex-col gap-1 border-b pb-3 last:border-0">
                                    <p className="text-sm font-medium">{activity.description}</p>
                                    {activity.tenant && (
                                        <p className="text-xs text-gray-500">{activity.tenant.name}</p>
                                    )}
                                    <p className="text-xs text-gray-400">
                                        {format(new Date(activity.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Botão para gerenciar tenants */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Gerenciar Tenants</h3>
                            <p className="text-sm text-gray-500">
                                Visualize, crie e edite todos os tenants do sistema
                            </p>
                        </div>
                        <Link href="/admin/tenants">
                            <Button className="bg-purple-600 hover:bg-purple-700">
                                Ver Tenants
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}