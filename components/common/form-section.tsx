// components/common/form-section.tsx

'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FormSectionProps {
    title: string
    description?: string
    children: ReactNode
    className?: string
}

export function FormSection({
                                title,
                                description,
                                children,
                                className,
                            }: FormSectionProps) {
    return (
        <div className={cn('space-y-4', className)}>
            <div>
                <h3 className="text-lg font-medium">{title}</h3>
                {description && (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            <Card>
                <CardContent className="pt-6">{children}</CardContent>
            </Card>
        </div>
    )
}