// components/ui/search-input.tsx

'use client'

import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    onClear?: () => void
    placeholder?: string
    className?: string
}

export function SearchInput({
                                value,
                                onChange,
                                onClear,
                                placeholder = 'Buscar...',
                                className,
                            }: SearchInputProps) {
    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-10 pr-10"
            />
            {value && onClear && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={onClear}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}