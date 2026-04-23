// app/dashboard/products/page.tsx

'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchInput } from '@/components/ui/search-input'
import { StatsCard } from '@/components/ui/stats-card'
import { DataTable } from '@/components/common/data-table'
import { PageHeader } from '@/components/common/page-header'
import { Package, Plus, Edit, Trash2, AlertTriangle, DollarSign, ClipboardList, TrendingUp, TrendingDown } from 'lucide-react'
import type { Product, PaginatedProductsResponse } from '@/types'
import type { Column } from '@/components/common/data-table'

interface AdjustStockData {
    quantity: string
    type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'DEVOLUCAO'
    reason: string
    reference: string
}

interface ProductFormData {
    name: string
    description: string
    sku: string
    barcode: string
    costPrice: string
    price: string
    stock: string
    minStock: string
    maxStock: string
    location: string
    supplier: string
    categoryId: string
}

// ─── Conteúdo real da página (usa useSearchParams) ───────────────────────────
function ProductsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
    const [showLowStock, setShowLowStock] = useState(false)

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
    })

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        sku: '',
        barcode: '',
        costPrice: '',
        price: '',
        stock: '',
        minStock: '',
        maxStock: '',
        location: '',
        supplier: '',
        categoryId: '',
    })

    const [adjustData, setAdjustData] = useState<AdjustStockData>({
        quantity: '',
        type: 'ENTRADA',
        reason: '',
        reference: '',
    })

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true)

            const params = new URLSearchParams()
            if (searchTerm) params.set('search', searchTerm)
            if (showLowStock) params.set('lowStock', 'true')
            params.set('page', pagination.page.toString())
            params.set('limit', pagination.limit.toString())

            const response = await fetch(`/api/products?${params.toString()}`)
            const data = await response.json()

            if (data.success) {
                const result = data.data as PaginatedProductsResponse
                setProducts(result.items)
                setPagination(result.pagination)
            }
        } catch (error) {
            console.error('Failed to fetch products:', error)
        } finally {
            setLoading(false)
        }
    }, [searchTerm, showLowStock, pagination.page, pagination.limit])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setPagination(prev => ({ ...prev, page: 1 }))

        const params = new URLSearchParams()
        if (value) params.set('search', value)
        router.push(`/dashboard/products?${params.toString()}`)
    }

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const url = editingProduct
                ? `/api/products/${editingProduct.id}`
                : '/api/products'
            const method = editingProduct ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description || null,
                    sku: formData.sku || null,
                    barcode: formData.barcode || null,
                    costPrice: formData.costPrice ? Number(formData.costPrice) : null,
                    price: Number(formData.price),
                    stock: formData.stock ? Number(formData.stock) : 0,
                    minStock: formData.minStock ? Number(formData.minStock) : null,
                    maxStock: formData.maxStock ? Number(formData.maxStock) : null,
                    location: formData.location || null,
                    supplier: formData.supplier || null,
                    categoryId: formData.categoryId || null,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setIsDialogOpen(false)
                setEditingProduct(null)
                resetForm()
                fetchProducts()
            } else {
                alert(data.error?.message || 'Erro ao salvar produto')
            }
        } catch (error) {
            console.error('Failed to save product:', error)
            alert('Erro ao salvar produto')
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            sku: '',
            barcode: '',
            costPrice: '',
            price: '',
            stock: '',
            minStock: '',
            maxStock: '',
            location: '',
            supplier: '',
            categoryId: '',
        })
    }

    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setFormData({
            name: product.name,
            description: product.description ?? '',
            sku: product.sku ?? '',
            barcode: product.barcode ?? '',
            costPrice: product.costPrice?.toString() ?? '',
            price: product.price.toString(),
            stock: product.stock.toString(),
            minStock: product.minStock?.toString() ?? '',
            maxStock: product.maxStock?.toString() ?? '',
            location: product.location ?? '',
            supplier: product.supplier ?? '',
            categoryId: product.categoryId ?? '',
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) return

        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (data.success) {
                fetchProducts()
            } else {
                alert(data.error?.message || 'Erro ao excluir produto')
            }
        } catch (error) {
            console.error('Failed to delete product:', error)
            alert('Erro ao excluir produto')
        }
    }

    const handleOpenAdjustDialog = (product: Product) => {
        setAdjustingProduct(product)
        setAdjustData({
            quantity: '',
            type: 'ENTRADA',
            reason: '',
            reference: '',
        })
        setIsAdjustDialogOpen(true)
    }

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!adjustingProduct) return

        try {
            const response = await fetch(`/api/products/${adjustingProduct.id}/adjust-stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quantity: Number(adjustData.quantity),
                    type: adjustData.type,
                    reason: adjustData.reason,
                    reference: adjustData.reference || null,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setIsAdjustDialogOpen(false)
                setAdjustingProduct(null)
                setAdjustData({
                    quantity: '',
                    type: 'ENTRADA',
                    reason: '',
                    reference: '',
                })
                fetchProducts()
            } else {
                alert(data.error?.message || 'Erro ao ajustar estoque')
            }
        } catch (error) {
            console.error('Failed to adjust stock:', error)
            alert('Erro ao ajustar estoque')
        }
    }

    const getStockStatus = (product: Product) => {
        if (product.minStock && product.stock <= product.minStock) {
            return { label: 'Baixo', variant: 'destructive' as const, icon: AlertTriangle }
        }
        if (product.maxStock && product.stock >= product.maxStock) {
            return { label: 'Máximo', variant: 'secondary' as const, icon: TrendingUp }
        }
        if (product.stock === 0) {
            return { label: 'Esgotado', variant: 'destructive' as const, icon: TrendingDown }
        }
        return { label: 'Normal', variant: 'default' as const, icon: Package }
    }

    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
    const lowStockCount = products.filter(p => p.minStock && p.stock <= p.minStock).length
    const outOfStockCount = products.filter(p => p.stock === 0).length

    const columns: Column<Product>[] = [
        {
            key: 'name',
            header: 'Produto',
            render: (product) => (
                <div>
                    <p className="font-medium">{product.name}</p>
                    {product.supplier && (
                        <p className="text-xs text-muted-foreground">{product.supplier}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'sku',
            header: 'SKU',
            render: (product) => (
                product.sku ? (
                    <Badge variant="outline">{product.sku}</Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'price',
            header: 'Preço',
            render: (product) => (
                <div>
                    <p className="font-medium">
                        {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    {product.costPrice && (
                        <p className="text-xs text-muted-foreground">
                            Custo: {product.costPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'stock',
            header: 'Estoque',
            render: (product) => (
                <div className="flex items-center gap-2">
                    <span className={`font-medium ${product.stock === 0 ? 'text-destructive' : ''}`}>
                        {product.stock}
                    </span>
                    {product.minStock && (
                        <span className="text-xs text-muted-foreground">
                            (mín: {product.minStock})
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (product) => {
                const status = getStockStatus(product)
                const Icon = status.icon
                return (
                    <Badge variant={status.variant} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {status.label}
                    </Badge>
                )
            },
        },
        {
            key: 'location',
            header: 'Local',
            render: (product) => (
                product.location ? (
                    <span className="text-sm">{product.location}</span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'actions',
            header: 'Ações',
            className: 'w-[150px]',
            render: (product) => (
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAdjustDialog(product)}
                        title="Ajustar Estoque"
                    >
                        <ClipboardList className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        title="Editar"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        title="Excluir"
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            <PageHeader
                title="Estoque"
                description="Gerencie produtos, peças e controle de estoque"
                actions={
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingProduct(null)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Produto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label htmlFor="name">Nome *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor="description">Descrição</Label>
                                        <Input
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="sku">SKU</Label>
                                        <Input
                                            id="sku"
                                            value={formData.sku}
                                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="barcode">Código de Barras</Label>
                                        <Input
                                            id="barcode"
                                            value={formData.barcode}
                                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="price">Preço de Venda *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="costPrice">Preço de Custo</Label>
                                        <Input
                                            id="costPrice"
                                            type="number"
                                            step="0.01"
                                            value={formData.costPrice}
                                            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="stock">Estoque Atual</Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="minStock">Estoque Mínimo</Label>
                                        <Input
                                            id="minStock"
                                            type="number"
                                            value={formData.minStock}
                                            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="maxStock">Estoque Máximo</Label>
                                        <Input
                                            id="maxStock"
                                            type="number"
                                            value={formData.maxStock}
                                            onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="location">Localização</Label>
                                        <Input
                                            id="location"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor="supplier">Fornecedor</Label>
                                        <Input
                                            id="supplier"
                                            value={formData.supplier}
                                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit">
                                        {editingProduct ? 'Salvar' : 'Criar'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                    title="Total de Produtos"
                    value={pagination.total}
                    icon={Package}
                />
                <StatsCard
                    title="Valor em Estoque"
                    value={totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    icon={DollarSign}
                />
                <StatsCard
                    title="Estoque Baixo"
                    value={lowStockCount}
                    icon={AlertTriangle}
                    variant={lowStockCount > 0 ? 'destructive' : 'default'}
                />
                <StatsCard
                    title="Sem Estoque"
                    value={outOfStockCount}
                    icon={TrendingDown}
                    variant={outOfStockCount > 0 ? 'destructive' : 'default'}
                />
            </div>

            {/* Filtros e Busca */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                    <CardDescription>
                        Busque produtos por nome, SKU, código de barras ou fornecedor
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex gap-2">
                            <Button
                                variant={showLowStock ? 'default' : 'outline'}
                                onClick={() => {
                                    setShowLowStock(!showLowStock)
                                    setPagination(prev => ({ ...prev, page: 1 }))
                                }}
                            >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Estoque Baixo
                            </Button>
                        </div>
                        <SearchInput
                            placeholder="Buscar produtos..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full md:w-80"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Tabela de Produtos */}
            <Card>
                <CardHeader>
                    <CardTitle>Produtos Cadastrados</CardTitle>
                    <CardDescription>
                        {pagination.total} produtos encontrados
                        {showLowStock && ' (filtro de estoque baixo ativo)'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <p className="text-muted-foreground">Carregando...</p>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                data={products}
                                columns={columns}
                                emptyIcon={Package}
                                emptyTitle="Nenhum produto encontrado"
                                emptyDescription={
                                    searchTerm
                                        ? `Nenhum produto corresponde à busca "${searchTerm}"`
                                        : showLowStock
                                            ? "Nenhum produto com estoque baixo"
                                            : "Cadastre seu primeiro produto"
                                }
                            />

                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Página {pagination.page} de {pagination.totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={!pagination.hasPrev}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={!pagination.hasNext}
                                        >
                                            Próxima
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Dialog de Ajuste de Estoque */}
            <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Ajustar Estoque</DialogTitle>
                    </DialogHeader>
                    {adjustingProduct && (
                        <form onSubmit={handleAdjustStock} className="space-y-4">
                            <div className="p-4 bg-muted rounded-md">
                                <p className="font-medium">{adjustingProduct.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Estoque atual: {adjustingProduct.stock}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="adjust-type">Tipo de Movimentação</Label>
                                <Select
                                    value={adjustData.type}
                                    onValueChange={(v) => setAdjustData({ ...adjustData, type: v as AdjustStockData['type'] })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ENTRADA">Entrada</SelectItem>
                                        <SelectItem value="SAIDA">Saída</SelectItem>
                                        <SelectItem value="AJUSTE">Ajuste</SelectItem>
                                        <SelectItem value="DEVOLUCAO">Devolução</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="adjust-quantity">Quantidade</Label>
                                <Input
                                    id="adjust-quantity"
                                    type="number"
                                    min="1"
                                    value={adjustData.quantity}
                                    onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="adjust-reason">Motivo</Label>
                                <Input
                                    id="adjust-reason"
                                    value={adjustData.reason}
                                    onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                                    placeholder="Ex: Inventário, perda, compra..."
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="adjust-reference">Referência (opcional)</Label>
                                <Input
                                    id="adjust-reference"
                                    value={adjustData.reference}
                                    onChange={(e) => setAdjustData({ ...adjustData, reference: e.target.value })}
                                    placeholder="Ex: NF 123, OS 456..."
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    Confirmar Ajuste
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ─── Export padrão: wrapper com Suspense ─────────────────────────────────────
export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        }>
            <ProductsContent />
        </Suspense>
    )
}