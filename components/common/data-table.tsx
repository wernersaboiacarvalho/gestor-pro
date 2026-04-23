// components/common/data-table.tsx

'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { LucideIcon } from 'lucide-react'

// EXPORTAR O TIPO COLUMN
export interface Column<T> {
    key: keyof T | string
    header: string
    render?: (item: T) => React.ReactNode
    className?: string
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    emptyIcon?: LucideIcon
    emptyTitle?: string
    emptyDescription?: string
    className?: string
}

export function DataTable<T extends { id: string }>({
                                                        data,
                                                        columns,
                                                        emptyIcon,
                                                        emptyTitle = 'Nenhum dado encontrado',
                                                        emptyDescription,
                                                        className,
                                                    }: DataTableProps<T>) {
    if (data.length === 0) {
        return (
            <EmptyState
                icon={emptyIcon}
                title={emptyTitle}
                description={emptyDescription}
            />
        )
    }

    return (
        <div className={`rounded-md border ${className}`}>
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead
                                key={String(column.key)}
                                className={column.className}
                            >
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.id}>
                            {columns.map((column) => (
                                <TableCell
                                    key={String(column.key)}
                                    className={column.className}
                                >
                                    {column.render
                                        ? column.render(item)
                                        : String(
                                            item[column.key as keyof T] ?? ''
                                        )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}