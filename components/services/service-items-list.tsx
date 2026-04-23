// components/services/service-items-list.tsx

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, Plus, Trash2 } from 'lucide-react'

interface ServiceItem {
    type: 'PART' | 'LABOR'
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
}

interface ServiceItemsListProps {
    items: ServiceItem[]
    onAddItem: () => void
    onUpdateItem: (index: number, field: keyof ServiceItem, value: string | number) => void
    onRemoveItem: (index: number) => void
}

export function ServiceItemsList({
                                     items,
                                     onAddItem,
                                     onUpdateItem,
                                     onRemoveItem,
                                 }: ServiceItemsListProps) {
    return (
        <div className="space-y-4 border rounded-lg p-4 bg-gray-50/30">
            <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    Peças & Serviços
                </h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAddItem}
                >
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar Item
                </Button>
            </div>

            {items.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                    Nenhum item adicionado ainda.
                </p>
            )}

            {items.map((item, idx) => (
                <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-end bg-white p-2 rounded shadow-sm"
                >
                    <div className="col-span-2">
                        <Select
                            value={item.type}
                            onValueChange={(v: 'PART' | 'LABOR') =>
                                onUpdateItem(idx, 'type', v)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PART">Peça</SelectItem>
                                <SelectItem value="LABOR">Serviço</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="col-span-4">
                        <Input
                            value={item.description}
                            onChange={(e) =>
                                onUpdateItem(idx, 'description', e.target.value)
                            }
                            placeholder="Descrição do item..."
                        />
                    </div>

                    <div className="col-span-1">
                        <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                                onUpdateItem(idx, 'quantity', e.target.value)
                            }
                        />
                    </div>

                    <div className="col-span-2">
                        <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                                onUpdateItem(idx, 'unitPrice', e.target.value)
                            }
                        />
                    </div>

                    <div className="col-span-2 flex items-center justify-end font-bold text-blue-600">
                        R$ {item.totalPrice.toFixed(2)}
                    </div>

                    <div className="col-span-1 flex justify-end">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => onRemoveItem(idx)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    )
}