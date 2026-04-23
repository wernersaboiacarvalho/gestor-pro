// app/dashboard/services/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus } from 'lucide-react'
import { ServiceStats } from '@/components/services/service-stats'
import { ServiceForm } from '@/components/services/service-form'
import { ServiceTable } from '@/components/services/service-table'
import type {
    Service,
    Customer,
    Vehicle,
    Mechanic,
    ThirdPartyProvider,
    ServiceStats as ServiceStatsType,
    ServiceFormSubmitData,
} from '@/types/service.types'

// ✅ Tipo genérico para resposta padronizada da API
interface ApiListResponse<T> {
    success: boolean
    data: T[]
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [mechanics, setMechanics] = useState<Mechanic[]>([])
    const [thirdPartyProviders, setThirdPartyProviders] = useState<ThirdPartyProvider[]>([])
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [stats, setStats] = useState<ServiceStatsType>({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        totalRevenue: 0,
    })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)

    const calculateStats = useCallback((data: Service[]) => {
        const total = data.length
        const pending = data.filter((s) => s.status === 'PENDENTE').length
        const inProgress = data.filter((s) => s.status === 'EM_ANDAMENTO').length
        const completed = data.filter((s) => s.status === 'CONCLUIDO').length
        const totalRevenue = data
            .filter((s) => s.status === 'CONCLUIDO')
            .reduce((sum, s) => sum + s.totalValue, 0)
        setStats({ total, pending, inProgress, completed, totalRevenue })
    }, [])

    const fetchServices = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/services')
            if (response.ok) {
                const result = await response.json()
                if (result.success) {
                    setServices(result.data)
                    calculateStats(result.data)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }, [calculateStats])

    // ✅ Helper para extrair dados de resposta padronizada
    const extractListData = <T,>(response: Response): Promise<T[]> => {
        if (!response.ok) return Promise.resolve([])
        return response.json().then((result: ApiListResponse<T> | T[]) => {
            if ('success' in result && result.success) {
                return Array.isArray(result.data) ? result.data : []
            }
            return Array.isArray(result) ? result : []
        }).catch(() => [])
    }

    useEffect(() => {
        fetchServices()
        const fetchData = async () => {
            const [c, v, m, tp] = await Promise.all([
                fetch('/api/customers'),
                fetch('/api/vehicles'),
                fetch('/api/mechanics'),
                fetch('/api/third-party-providers'),
            ])

            // ✅ Extrair dados com tratamento do formato padronizado
            if (c.ok) setCustomers(await extractListData<Customer>(c))
            if (v.ok) setVehicles(await extractListData<Vehicle>(v))
            if (m.ok) {
                const mechanicsList = await extractListData<Mechanic>(m)
                setMechanics(mechanicsList.filter((i: Mechanic) => i.status === 'ACTIVE'))
            }
            if (tp.ok) setThirdPartyProviders(await extractListData<ThirdPartyProvider>(tp))
        }
        fetchData()
    }, [fetchServices])

    const handleEdit = (service: Service) => {
        setEditingService(service)
        setDialogOpen(true)
    }

    const handleNewService = () => {
        setEditingService(null)
        setDialogOpen(true)
    }

    const handleSubmit = async (data: ServiceFormSubmitData) => {
        const isEdit = !!editingService
        const response = await fetch(
            isEdit ? `/api/services/${editingService.id}` : '/api/services',
            {
                method: isEdit ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            }
        )
        const result = await response.json()

        if (result.success) {
            setDialogOpen(false)
            fetchServices()
        }
    }

    if (loading) {
        return <div className="p-8">Carregando serviços...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Ordens & Orçamentos</h1>
                <Button onClick={handleNewService}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Serviço
                </Button>
            </div>

            {/* Estatísticas */}
            <ServiceStats {...stats} />

            {/* Busca */}
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por cliente, placa ou descrição..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tabela */}
            <ServiceTable
                services={services}
                searchTerm={searchTerm}
                onEdit={handleEdit}
            />

            {/* Formulário */}
            <ServiceForm
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                editingService={editingService}
                customers={customers}
                vehicles={vehicles}
                mechanics={mechanics}
                thirdPartyProviders={thirdPartyProviders}
            />
        </div>
    )
}