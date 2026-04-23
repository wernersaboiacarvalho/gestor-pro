// lib/constants/service-status.ts

/**
 * Status de Serviços
 * Definições centralizadas para ordens de serviço e orçamentos
 */

export const SERVICE_STATUS = {
    PENDENTE: 'PENDENTE',
    EM_ANDAMENTO: 'EM_ANDAMENTO',
    CONCLUIDO: 'CONCLUIDO',
    CANCELADO: 'CANCELADO',
} as const;

export type ServiceStatus = typeof SERVICE_STATUS[keyof typeof SERVICE_STATUS];

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
    PENDENTE: 'Pendente',
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
};

export const SERVICE_STATUS_COLORS: Record<ServiceStatus, string> = {
    PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    EM_ANDAMENTO: 'bg-blue-100 text-blue-800 border-blue-200',
    CONCLUIDO: 'bg-green-100 text-green-800 border-green-200',
    CANCELADO: 'bg-red-100 text-red-800 border-red-200',
};

export const SERVICE_STATUS_OPTIONS = [
    { value: SERVICE_STATUS.PENDENTE, label: SERVICE_STATUS_LABELS.PENDENTE },
    { value: SERVICE_STATUS.EM_ANDAMENTO, label: SERVICE_STATUS_LABELS.EM_ANDAMENTO },
    { value: SERVICE_STATUS.CONCLUIDO, label: SERVICE_STATUS_LABELS.CONCLUIDO },
    { value: SERVICE_STATUS.CANCELADO, label: SERVICE_STATUS_LABELS.CANCELADO },
];

// Tipos de Serviço
export const SERVICE_TYPE = {
    ORCAMENTO: 'ORCAMENTO',
    ORDEM_SERVICO: 'ORDEM_SERVICO',
} as const;

export type ServiceType = typeof SERVICE_TYPE[keyof typeof SERVICE_TYPE];

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
    ORCAMENTO: 'Orçamento',
    ORDEM_SERVICO: 'Ordem de Serviço',
};

export const SERVICE_TYPE_COLORS: Record<ServiceType, string> = {
    ORCAMENTO: 'bg-purple-100 text-purple-800 border-purple-200',
    ORDEM_SERVICO: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export const SERVICE_TYPE_OPTIONS = [
    { value: SERVICE_TYPE.ORCAMENTO, label: SERVICE_TYPE_LABELS.ORCAMENTO },
    { value: SERVICE_TYPE.ORDEM_SERVICO, label: SERVICE_TYPE_LABELS.ORDEM_SERVICO },
];

// Tipos de Item de Serviço
export const SERVICE_ITEM_TYPE = {
    LABOR: 'LABOR',
    PART: 'PART',
} as const;

export type ServiceItemType = typeof SERVICE_ITEM_TYPE[keyof typeof SERVICE_ITEM_TYPE];

export const SERVICE_ITEM_TYPE_LABELS: Record<ServiceItemType, string> = {
    LABOR: 'Mão de Obra',
    PART: 'Peça',
};

export const SERVICE_ITEM_TYPE_OPTIONS = [
    { value: SERVICE_ITEM_TYPE.LABOR, label: SERVICE_ITEM_TYPE_LABELS.LABOR },
    { value: SERVICE_ITEM_TYPE.PART, label: SERVICE_ITEM_TYPE_LABELS.PART },
];