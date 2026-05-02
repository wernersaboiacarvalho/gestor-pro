'use client'

import { useEffect, useMemo, useState } from 'react'
import { Package, Plus, Search, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProducts } from '@/hooks/use-products-query'
import { formatCurrency } from '@/lib/formatters/currency'
import type { Product } from '@/types/product'

interface ServiceItem {
  productId?: string | null
  type: 'PART' | 'LABOR'
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface ServiceItemsListProps {
  items: ServiceItem[]
  onAddItem: () => void
  onUpdateItem: (index: number, field: keyof ServiceItem, value: string | number | null) => void
  onRemoveItem: (index: number) => void
}

function productSubtitle(product: Product) {
  const details = [
    product.sku ? `SKU ${product.sku}` : null,
    product.supplier || null,
    `Estoque ${product.stock}`,
  ].filter(Boolean)

  return details.join(' - ')
}

interface ServiceItemRowProps {
  item: ServiceItem
  index: number
  onUpdateItem: ServiceItemsListProps['onUpdateItem']
  onRemoveItem: ServiceItemsListProps['onRemoveItem']
}

function ServiceItemRow({ item, index, onUpdateItem, onRemoveItem }: ServiceItemRowProps) {
  const [search, setSearch] = useState(item.description)
  const query = search.trim()
  const canSearchProducts = item.type === 'PART' && query.length >= 2
  const productsQuery = useProducts({ search: query, limit: 6 }, { enabled: canSearchProducts })

  const products = useMemo(
    () => (Array.isArray(productsQuery.data?.items) ? productsQuery.data.items : []),
    [productsQuery.data?.items]
  )

  useEffect(() => {
    setSearch(item.description)
  }, [item.description])

  const handleTypeChange = (value: 'PART' | 'LABOR') => {
    onUpdateItem(index, 'type', value)
    if (value === 'LABOR') {
      onUpdateItem(index, 'productId', null)
    }
  }

  const handleDescriptionChange = (value: string) => {
    setSearch(value)
    onUpdateItem(index, 'description', value)
    if (item.productId) {
      onUpdateItem(index, 'productId', null)
    }
  }

  const handleSelectProduct = (product: Product) => {
    setSearch(product.name)
    onUpdateItem(index, 'type', 'PART')
    onUpdateItem(index, 'productId', product.id)
    onUpdateItem(index, 'description', product.name)
    onUpdateItem(index, 'unitPrice', product.price)
  }

  return (
    <div className="rounded-md border bg-white p-3 shadow-sm">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 sm:col-span-2">
          <Select value={item.type} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PART">Peca</SelectItem>
              <SelectItem value="LABOR">Servico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-12 sm:col-span-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => handleDescriptionChange(event.target.value)}
              placeholder={
                item.type === 'PART'
                  ? 'Buscar peca por nome, SKU ou fornecedor...'
                  : 'Descricao do servico...'
              }
            />
          </div>
          {item.productId && (
            <div className="mt-1 text-xs text-emerald-700">Produto do estoque vinculado.</div>
          )}
        </div>

        <div className="col-span-4 sm:col-span-1">
          <Input
            aria-label="Quantidade"
            type="number"
            min="0"
            value={item.quantity}
            onChange={(event) => onUpdateItem(index, 'quantity', event.target.value)}
          />
        </div>

        <div className="col-span-4 sm:col-span-2">
          <Input
            aria-label="Valor unitario"
            type="number"
            step="0.01"
            min="0"
            value={item.unitPrice}
            onChange={(event) => onUpdateItem(index, 'unitPrice', event.target.value)}
          />
        </div>

        <div className="col-span-3 flex items-center justify-end font-bold text-blue-700 sm:col-span-1">
          {formatCurrency(item.totalPrice)}
        </div>

        <div className="col-span-1 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-red-500"
            onClick={() => onRemoveItem(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {canSearchProducts && (
        <div className="mt-3 rounded-md border bg-muted/30">
          {productsQuery.isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Buscando pecas...</div>
          )}

          {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Nenhuma peca encontrada no estoque.
            </div>
          )}

          {productsQuery.isError && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Nao foi possivel consultar o estoque agora.
            </div>
          )}

          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-background"
              onClick={() => handleSelectProduct(product)}
            >
              <span className="min-w-0">
                <span className="block font-medium">{product.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {productSubtitle(product)}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {product.stock <= 0 && <Badge variant="outline">Sem estoque</Badge>}
                <span className="font-semibold">{formatCurrency(product.price)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ServiceItemsList({
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: ServiceItemsListProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-gray-50/30 p-4">
      <div className="flex items-center justify-between gap-3 border-b pb-2">
        <h3 className="flex items-center gap-2 font-bold">
          <Package className="h-4 w-4 text-blue-600" />
          Pecas & Servicos
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
          <Plus className="mr-1 h-3 w-3" />
          Adicionar item
        </Button>
      </div>

      {items.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nenhum item adicionado ainda.
        </p>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
          <ServiceItemRow
            key={`${index}-${item.productId || 'manual'}`}
            item={item}
            index={index}
            onUpdateItem={onUpdateItem}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>
    </div>
  )
}
