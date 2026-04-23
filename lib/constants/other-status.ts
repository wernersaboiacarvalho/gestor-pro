// lib/constants/other-status.ts

/**
 * Status de Serviços Terceirizados
 */

export const THIRD_PARTY_SERVICE_STATUS = {
    PENDENTE: 'PENDENTE',
    ENVIADO: 'ENVIADO',
    EM_EXECUCAO: 'EM_EXECUCAO',
    CONCLUIDO: 'CONCLUIDO',
    RETORNADO: 'RETORNADO',
} as const;

export type ThirdPartyServiceStatus = typeof THIRD_PARTY_SERVICE_STATUS[keyof typeof THIRD_PARTY_SERVICE_STATUS];

export const THIRD_PARTY_SERVICE_STATUS_LABELS: Record<ThirdPartyServiceStatus, string> = {
    PENDENTE: 'Pendente',
    ENVIADO: 'Enviado',
    EM_EXECUCAO: 'Em Execução',
    CONCLUIDO: 'Concluído',
    RETORNADO: 'Retornado',
};

export const THIRD_PARTY_SERVICE_STATUS_COLORS: Record<ThirdPartyServiceStatus, string> = {
    PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ENVIADO: 'bg-blue-100 text-blue-800 border-blue-200',
    EM_EXECUCAO: 'bg-purple-100 text-purple-800 border-purple-200',
    CONCLUIDO: 'bg-green-100 text-green-800 border-green-200',
    RETORNADO: 'bg-teal-100 text-teal-800 border-teal-200',
};

// Tipos de Terceirizados
export const THIRD_PARTY_TYPES = [
    'Retífica',
    'Pintura',
    'Estofamento',
    'Funilaria',
    'Vidros',
    'Tapeçaria',
    'Som e Acessórios',
    'Reboque',
    'Guincho',
    'Despachante',
    'Vistoria',
    'Outros',
];

/**
 * Movimentações de Estoque
 */

export const STOCK_MOVEMENT_TYPE = {
    ENTRADA: 'ENTRADA',
    SAIDA: 'SAIDA',
    AJUSTE: 'AJUSTE',
    DEVOLUCAO: 'DEVOLUCAO',
} as const;

export type StockMovementType = typeof STOCK_MOVEMENT_TYPE[keyof typeof STOCK_MOVEMENT_TYPE];

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
    ENTRADA: 'Entrada',
    SAIDA: 'Saída',
    AJUSTE: 'Ajuste',
    DEVOLUCAO: 'Devolução',
};

export const STOCK_MOVEMENT_TYPE_COLORS: Record<StockMovementType, string> = {
    ENTRADA: 'bg-green-100 text-green-800 border-green-200',
    SAIDA: 'bg-red-100 text-red-800 border-red-200',
    AJUSTE: 'bg-blue-100 text-blue-800 border-blue-200',
    DEVOLUCAO: 'bg-purple-100 text-purple-800 border-purple-200',
};

export const STOCK_MOVEMENT_TYPE_OPTIONS = [
    { value: STOCK_MOVEMENT_TYPE.ENTRADA, label: STOCK_MOVEMENT_TYPE_LABELS.ENTRADA },
    { value: STOCK_MOVEMENT_TYPE.SAIDA, label: STOCK_MOVEMENT_TYPE_LABELS.SAIDA },
    { value: STOCK_MOVEMENT_TYPE.AJUSTE, label: STOCK_MOVEMENT_TYPE_LABELS.AJUSTE },
    { value: STOCK_MOVEMENT_TYPE.DEVOLUCAO, label: STOCK_MOVEMENT_TYPE_LABELS.DEVOLUCAO },
];