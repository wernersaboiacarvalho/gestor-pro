// lib/constants/mechanic-status.ts

/**
 * Status de Mecânicos
 */

export const MECHANIC_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    ON_LEAVE: 'ON_LEAVE',
} as const;

export type MechanicStatus = typeof MECHANIC_STATUS[keyof typeof MECHANIC_STATUS];

export const MECHANIC_STATUS_LABELS: Record<MechanicStatus, string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    ON_LEAVE: 'Afastado',
};

export const MECHANIC_STATUS_COLORS: Record<MechanicStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
    ON_LEAVE: 'bg-orange-100 text-orange-800 border-orange-200',
};

export const MECHANIC_STATUS_OPTIONS = [
    { value: MECHANIC_STATUS.ACTIVE, label: MECHANIC_STATUS_LABELS.ACTIVE },
    { value: MECHANIC_STATUS.INACTIVE, label: MECHANIC_STATUS_LABELS.INACTIVE },
    { value: MECHANIC_STATUS.ON_LEAVE, label: MECHANIC_STATUS_LABELS.ON_LEAVE },
];

// Especialidades comuns
export const MECHANIC_SPECIALTIES = [
    'Mecânica Geral',
    'Motor',
    'Suspensão',
    'Freios',
    'Elétrica',
    'Injeção Eletrônica',
    'Ar Condicionado',
    'Cambio',
    'Alinhamento e Balanceamento',
    'Funilaria',
    'Pintura',
    'Estofamento',
    'Vidros',
    'Som e Acessórios',
    'Diagnóstico',
];