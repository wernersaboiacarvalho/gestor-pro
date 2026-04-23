// components/ui/stats-card.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
    title: string
    value: string | number
    icon?: LucideIcon
    description?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    className?: string
    variant?: 'default' | 'destructive'
}

export function StatsCard({
                              title,
                              value,
                              icon: Icon,
                              description,
                              trend,
                              trendValue,
                              className,
                              variant = 'default',
                          }: StatsCardProps) {
    const isDestructive = variant === 'destructive'

    return (
        <Card className={cn(
            isDestructive && 'border-destructive/50 bg-destructive/5',
            className
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn(
                    'text-sm font-medium',
                    isDestructive && 'text-destructive'
                )}>
                    {title}
                </CardTitle>
                {Icon && (
                    <Icon className={cn(
                        'h-4 w-4',
                        isDestructive ? 'text-destructive' : 'text-muted-foreground'
                    )} />
                )}
            </CardHeader>
            <CardContent>
                <div className={cn(
                    'text-2xl font-bold',
                    isDestructive && 'text-destructive'
                )}>
                    {value}
                </div>
                {(description || trend) && (
                    <div className="flex items-center gap-2 mt-1">
                        {trend && trendValue && (
                            <span className={cn(
                                'text-xs',
                                trend === 'up' && 'text-green-600',
                                trend === 'down' && 'text-red-600',
                                trend === 'neutral' && 'text-muted-foreground'
                            )}>
                                {trend === 'up' && '↑'}
                                {trend === 'down' && '↓'}
                                {trendValue}
                            </span>
                        )}
                        {description && (
                            <p className="text-xs text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}