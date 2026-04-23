'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Truck, Plus, Search, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react'

interface ThirdPartyProvider {
    id: string
    name: string
    type: string
    contact?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    notes?: string | null
    createdAt: string
    _count?: {
        services: number
    }
}

export default function ThirdPartyProvidersPage() {
    const [providers, setProviders] = useState<ThirdPartyProvider[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingProvider, setEditingProvider] = useState<ThirdPartyProvider | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
    })

    useEffect(() => {
        fetchProviders()
    }, [])

    const fetchProviders = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/third-party-providers')
            const data = await response.json()

            if (data.success) {
                setProviders(data.data.providers)
            }
        } catch (error) {
            console.error('Failed to fetch providers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editingProvider
                ? `/api/third-party-providers/${editingProvider.id}`
                : '/api/third-party-providers'
            const method = editingProvider ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (data.success) {
                setIsDialogOpen(false)
                setEditingProvider(null)
                setFormData({
                    name: '',
                    type: '',
                    contact: '',
                    phone: '',
                    email: '',
                    address: '',
                    notes: '',
                })
                fetchProviders()
            }
        } catch (error) {
            console.error('Failed to save provider:', error)
        }
    }

    const handleEdit = (provider: ThirdPartyProvider) => {
        setEditingProvider(provider)
        setFormData({
            name: provider.name,
            type: provider.type,
            contact: provider.contact ?? '',
            phone: provider.phone ?? '',
            email: provider.email ?? '',
            address: provider.address ?? '',
            notes: provider.notes ?? '',
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este parceiro?')) return

        try {
            const response = await fetch(`/api/third-party-providers/${id}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (data.success) {
                fetchProviders()
            } else {
                alert(data.error?.message || 'Erro ao excluir')
            }
        } catch (error) {
            console.error('Failed to delete provider:', error)
        }
    }

    const filteredProviders = providers.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.type.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Terceirizados</h1>
                    <p className="text-muted-foreground">
                        Gerencie parceiros e serviços terceirizados
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingProvider(null)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Parceiro
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingProvider ? 'Editar Parceiro' : 'Novo Parceiro'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipo *</Label>
                                <Input
                                    id="type"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    placeholder="Ex: Retífica, Pintura, Estofamento..."
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contact">Contato</Label>
                                <Input
                                    id="contact"
                                    value={formData.contact}
                                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Endereço</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Observações</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    {editingProvider ? 'Salvar' : 'Criar'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Parceiros</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{providers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Com Serviços</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {providers.filter(p => (p._count?.services ?? 0) > 0).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tipos Diferentes</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Set(providers.map(p => p.type)).size}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Buscar</CardTitle>
                    <CardDescription>
                        Filtre parceiros por nome ou tipo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome ou tipo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Parceiros Cadastrados</CardTitle>
                    <CardDescription>
                        {filteredProviders.length} parceiros encontrados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <p className="text-muted-foreground">Carregando...</p>
                        </div>
                    ) : filteredProviders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Nenhum parceiro encontrado</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Contato</TableHead>
                                        <TableHead>Serviços</TableHead>
                                        <TableHead className="w-[100px]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProviders.map((provider) => (
                                        <TableRow key={provider.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{provider.name}</p>
                                                    {provider.address && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MapPin className="h-3 w-3" />
                                                            {provider.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{provider.type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {provider.phone && (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                            {provider.phone}
                                                        </div>
                                                    )}
                                                    {provider.email && (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                                            {provider.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={provider._count?.services ? 'default' : 'outline'}>
                                                    {provider._count?.services ?? 0} serviços
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(provider)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(provider.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}