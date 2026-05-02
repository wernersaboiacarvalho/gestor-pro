'use client'

import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Package, Plus, Search, Trash2, Wrench } from 'lucide-react'
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
  onAddItem: (item?: Partial<ServiceItem>) => void
  onUpdateItem: (index: number, field: keyof ServiceItem, value: string | number | null) => void
  onRemoveItem: (index: number) => void
}

const laborSuggestions: Array<
  Pick<ServiceItem, 'type' | 'description' | 'quantity' | 'unitPrice'>
> = [
  { type: 'LABOR', description: 'Diagnostico tecnico', quantity: 1, unitPrice: 120 },
  { type: 'LABOR', description: 'Troca de oleo e filtros', quantity: 1, unitPrice: 90 },
  { type: 'LABOR', description: 'Revisao de freios', quantity: 1, unitPrice: 160 },
  { type: 'LABOR', description: 'Alinhamento e balanceamento', quantity: 1, unitPrice: 140 },
]

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

  const rowTone =
    item.type === 'PART'
      ? item.productId
        ? 'border-emerald-100 bg-emerald-50/30'
        : 'border-blue-100 bg-blue-50/20'
      : 'border-slate-200 bg-slate-50/70'

  return (
    <div className={`rounded-md border p-3 shadow-sm ${rowTone}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{item.type === 'PART' ? 'Peca' : 'Mao de obra'}</Badge>
          {item.productId && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
              <BadgeCheck className="h-3.5 w-3.5" />
              Estoque vinculado
            </span>
          )}
        </div>
        <div className="text-sm font-semibold">{formatCurrency(item.totalPrice)}</div>
      </div>

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
  const partsTotal = items
    .filter((item) => item.type === 'PART')
    .reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)
  const laborTotal = items
    .filter((item) => item.type === 'LABOR')
    .reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)
  const linkedProductsCount = items.filter((item) => item.productId).length

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-bold">
            <Package className="h-4 w-4 text-primary" />
            Pecas e servicos
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Busque pecas do estoque ou adicione mao de obra manualmente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onAddItem()}>
            <Plus className="mr-1 h-3 w-3" />
            Peca
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddItem({ type: 'LABOR' })}
          >
            <Wrench className="mr-1 h-3 w-3" />
            Mao de obra
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-background p-3">
          <div className="text-xs text-muted-foreground">Pecas</div>
          <div className="font-semibold">{formatCurrency(partsTotal)}</div>
        </div>
        <div className="rounded-md border bg-background p-3">
          <div className="text-xs text-muted-foreground">Mao de obra</div>
          <div className="font-semibold">{formatCurrency(laborTotal)}</div>
        </div>
        <div className="rounded-md border bg-background p-3">
          <div className="text-xs text-muted-foreground">Estoque vinculado</div>
          <div className="font-semibold">{linkedProductsCount} item(ns)</div>
        </div>
      </div>

      <div className="space-y-2 rounded-md border bg-background p-3">
        <div className="text-xs font-medium text-muted-foreground">Atalhos de mao de obra</div>
        <div className="flex flex-wrap gap-2">
          {laborSuggestions.map((suggestion) => (
            <Button
              key={suggestion.description}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddItem(suggestion)}
            >
              <Plus className="mr-1 h-3 w-3" />
              {suggestion.description}
            </Button>
          ))}
        </div>
      </div>

      {items.length === 0 && (
        <div className="rounded-md border border-dashed bg-background p-6 text-center text-sm text-muted-foreground">
          Nenhum item adicionado ainda.
        </div>
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
