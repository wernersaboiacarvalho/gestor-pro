'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, Circle, ClipboardCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface OnboardingStep {
  id: string
  title: string
  description: string
  href: string
  cta: string
  completed: boolean
  optional?: boolean
}

interface OnboardingChecklistProps {
  onboarding: {
    title: string
    show: boolean
    completed: number
    total: number
    progress: number
    nextStep: Omit<OnboardingStep, 'completed' | 'optional'> | null
    quickActions: Array<{
      id: string
      label: string
      description: string
      endpoint: string
      method: 'POST'
    }>
    steps: OnboardingStep[]
  }
}

export function OnboardingChecklist({ onboarding }: OnboardingChecklistProps) {
  const queryClient = useQueryClient()
  const [runningActionId, setRunningActionId] = useState<string | null>(null)

  if (!onboarding.show) {
    return null
  }

  const runQuickAction = async (
    action: OnboardingChecklistProps['onboarding']['quickActions'][number]
  ) => {
    setRunningActionId(action.id)

    try {
      const response = await fetch(action.endpoint, { method: action.method })

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      }
    } finally {
      setRunningActionId(null)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50/40">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              {onboarding.title}
            </CardTitle>
            <CardDescription>
              {onboarding.completed} de {onboarding.total} etapas essenciais concluidas
            </CardDescription>
          </div>

          {onboarding.nextStep && (
            <Link href={onboarding.nextStep.href}>
              <Button>
                {onboarding.nextStep.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progresso de prontidao</span>
            <span className="text-muted-foreground">{onboarding.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{ width: `${onboarding.progress}%` }}
            />
          </div>
        </div>

        {onboarding.nextStep && (
          <div className="rounded-lg border border-blue-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-blue-100 p-2">
                <Sparkles className="h-4 w-4 text-blue-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Proxima melhor acao: {onboarding.nextStep.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {onboarding.nextStep.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {onboarding.quickActions.length > 0 && (
          <div className="grid gap-3 lg:grid-cols-2">
            {onboarding.quickActions.map((action) => (
              <div key={action.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{action.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={runningActionId === action.id}
                    onClick={() => runQuickAction(action)}
                  >
                    {runningActionId === action.id ? 'Instalando...' : 'Instalar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {onboarding.steps.map((step) => {
            const Icon = step.completed ? CheckCircle2 : Circle

            return (
              <Link
                key={step.id}
                href={step.href}
                className="group rounded-lg border bg-white p-4 transition-colors hover:border-blue-300"
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      step.completed ? 'text-emerald-600' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium leading-tight">{step.title}</p>
                      {step.optional && <Badge variant="outline">Opcional</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    <p className="text-sm font-medium text-blue-700 group-hover:underline">
                      {step.completed ? 'Revisar' : step.cta}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
