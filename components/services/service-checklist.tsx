'use client'

import { FormEvent, useMemo, useState } from 'react'
import { CheckSquare2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  useCreateServiceChecklistItem,
  useDeleteServiceChecklistItem,
  useUpdateServiceChecklistItem,
} from '@/hooks/use-services-query'
import { cn } from '@/lib/utils'
import type { ServiceChecklistItem } from '@/types/service.types'

interface ServiceChecklistProps {
  serviceId: string
  items: ServiceChecklistItem[]
}

const suggestedTasks = [
  'Confirmar autorizacao do cliente',
  'Separar pecas e insumos',
  'Executar servico principal',
  'Realizar teste final',
  'Registrar fotos de entrega',
]

export function ServiceChecklist({ serviceId, items }: ServiceChecklistProps) {
  const [title, setTitle] = useState('')
  const { success, error: showError } = useToast()
  const createItem = useCreateServiceChecklistItem(serviceId)
  const updateItem = useUpdateServiceChecklistItem(serviceId)
  const deleteItem = useDeleteServiceChecklistItem(serviceId)

  const completedCount = items.filter((item) => item.completed).length
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  const visibleSuggestions = useMemo(() => {
    const existingTitles = new Set(items.map((item) => item.title.toLowerCase()))

    return suggestedTasks.filter((task) => !existingTitles.has(task.toLowerCase())).slice(0, 3)
  }, [items])

  const handleCreate = (event?: FormEvent<HTMLFormElement>, customTitle?: string) => {
    event?.preventDefault()

    const taskTitle = (customTitle || title).trim()
    if (taskTitle.length < 2) return

    createItem.mutate(
      { title: taskTitle },
      {
        onSuccess: () => {
          setTitle('')
          success('Tarefa adicionada!')
        },
        onError: (err) => showError('Erro ao adicionar tarefa', err.message),
      }
    )
  }

  const handleToggle = (item: ServiceChecklistItem, completed: boolean) => {
    updateItem.mutate(
      { itemId: item.id, completed },
      {
        onError: (err) => showError('Erro ao atualizar tarefa', err.message),
      }
    )
  }

  const handleDelete = (item: ServiceChecklistItem) => {
    if (!confirm(`Remover a tarefa "${item.title}"?`)) return

    deleteItem.mutate(item.id, {
      onSuccess: () => success('Tarefa removida!'),
      onError: (err) => showError('Erro ao remover tarefa', err.message),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-lg">
          <span className="flex items-center gap-2">
            <CheckSquare2 className="h-5 w-5 text-primary" />
            Checklist da OS
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {completedCount}/{items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {items.length === 0
              ? 'Crie tarefas para acompanhar a execucao.'
              : `${progress}% da execucao conferida.`}
          </div>
        </div>

        <form className="flex gap-2" onSubmit={(event) => handleCreate(event)}>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nova tarefa da OS"
            maxLength={120}
          />
          <Button
            type="submit"
            size="icon"
            disabled={createItem.isPending || title.trim().length < 2}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {items.length === 0 && visibleSuggestions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Sugestoes rapidas</div>
            <div className="flex flex-wrap gap-2">
              {visibleSuggestions.map((task) => (
                <Button
                  key={task}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreate(undefined, task)}
                  disabled={createItem.isPending}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {task}
                </Button>
              ))}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  className="mt-0.5"
                  checked={item.completed}
                  disabled={updateItem.isPending}
                  onCheckedChange={(checked) => handleToggle(item, checked === true)}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      'text-sm font-medium leading-5',
                      item.completed && 'text-muted-foreground line-through'
                    )}
                  >
                    {item.title}
                  </div>
                  {item.completedAt && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Concluida em{' '}
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(item.completedAt))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={deleteItem.isPending}
                  onClick={() => handleDelete(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
