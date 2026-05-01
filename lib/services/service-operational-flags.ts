import type { Service } from '@/types/service.types'

export type ServiceOperationalFlagKey = 'overdue' | 'third-party' | 'without-checklist' | 'stale'

export interface ServiceOperationalFlag {
  key: ServiceOperationalFlagKey
  label: string
  description: string
  className: string
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export function isOpenService(service: Service) {
  return service.status !== 'CONCLUIDO' && service.status !== 'CANCELADO'
}

export function daysSince(value?: string | null) {
  if (!value) return 0

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 0

  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export function isScheduledOverdue(service: Service) {
  if (!service.scheduledDate || !isOpenService(service)) return false

  const scheduledDate = new Date(service.scheduledDate)
  if (Number.isNaN(scheduledDate.getTime())) return false

  return scheduledDate < startOfToday()
}

export function getServiceOperationalFlags(service: Service): ServiceOperationalFlag[] {
  const flags: ServiceOperationalFlag[] = []

  if (isScheduledOverdue(service)) {
    flags.push({
      key: 'overdue',
      label: 'Vencido',
      description: 'Agendamento anterior a hoje',
      className: 'border-red-200 bg-red-50 text-red-700',
    })
  }

  if ((service.thirdPartyServices || []).some((item) => item.status !== 'RETORNADO')) {
    flags.push({
      key: 'third-party',
      label: 'Terceiro',
      description: 'Servico externo pendente',
      className: 'border-violet-200 bg-violet-50 text-violet-700',
    })
  }

  if (
    service.type === 'ORDEM_SERVICO' &&
    isOpenService(service) &&
    (service.checklistItems || []).length === 0
  ) {
    flags.push({
      key: 'without-checklist',
      label: 'Sem checklist',
      description: 'OS aberta sem tarefas',
      className: 'border-blue-200 bg-blue-50 text-blue-700',
    })
  }

  if (
    service.type === 'ORDEM_SERVICO' &&
    service.status === 'EM_ANDAMENTO' &&
    daysSince(service.updatedAt || service.createdAt) >= 3
  ) {
    flags.push({
      key: 'stale',
      label: 'Parado',
      description: 'Sem atualizacao ha 3 dias',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    })
  }

  return flags
}

export function matchesServiceAttentionFilter(service: Service, filter: string) {
  if (filter === 'all') return true

  return getServiceOperationalFlags(service).some((flag) => flag.key === filter)
}
