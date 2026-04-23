// lib/constants/tenant-types.ts

/**
 * Business Types e Tenant Status
 */

export const BUSINESS_TYPE = {
    OFICINA: 'OFICINA',
    RESTAURANTE: 'RESTAURANTE',
    ACADEMIA: 'ACADEMIA',
    GENERICO: 'GENERICO',
} as const;

export type BusinessType = typeof BUSINESS_TYPE[keyof typeof BUSINESS_TYPE];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
    OFICINA: 'Oficina Mecânica',
    RESTAURANTE: 'Restaurante',
    ACADEMIA: 'Academia',
    GENERICO: 'Genérico',
};

export const BUSINESS_TYPE_OPTIONS = [
    { value: BUSINESS_TYPE.OFICINA, label: BUSINESS_TYPE_LABELS.OFICINA },
    { value: BUSINESS_TYPE.RESTAURANTE, label: BUSINESS_TYPE_LABELS.RESTAURANTE },
    { value: BUSINESS_TYPE.ACADEMIA, label: BUSINESS_TYPE_LABELS.ACADEMIA },
    { value: BUSINESS_TYPE.GENERICO, label: BUSINESS_TYPE_LABELS.GENERICO },
];

// Tenant Status
export const TENANT_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    TRIAL: 'TRIAL',
} as const;

export type TenantStatus = typeof TENANT_STATUS[keyof typeof TENANT_STATUS];

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    SUSPENDED: 'Suspenso',
    TRIAL: 'Trial',
};

export const TENANT_STATUS_COLORS: Record<TenantStatus, string> = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
    SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
    TRIAL: 'bg-blue-100 text-blue-800 border-blue-200',
};

export const TENANT_STATUS_OPTIONS = [
    { value: TENANT_STATUS.ACTIVE, label: TENANT_STATUS_LABELS.ACTIVE },
    { value: TENANT_STATUS.INACTIVE, label: TENANT_STATUS_LABELS.INACTIVE },
    { value: TENANT_STATUS.SUSPENDED, label: TENANT_STATUS_LABELS.SUSPENDED },
    { value: TENANT_STATUS.TRIAL, label: TENANT_STATUS_LABELS.TRIAL },
];

/**
 * User Roles
 */

export const USER_ROLE = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    EMPLOYEE: 'EMPLOYEE',
    USER: 'USER',
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    OWNER: 'Proprietário',
    ADMIN: 'Administrador',
    EMPLOYEE: 'Funcionário',
    USER: 'Usuário',
};

export const USER_ROLE_OPTIONS = [
    { value: USER_ROLE.OWNER, label: USER_ROLE_LABELS.OWNER },
    { value: USER_ROLE.ADMIN, label: USER_ROLE_LABELS.ADMIN },
    { value: USER_ROLE.EMPLOYEE, label: USER_ROLE_LABELS.EMPLOYEE },
    { value: USER_ROLE.USER, label: USER_ROLE_LABELS.USER },
];

// Permissões por role (simplificado)
export const ROLE_PERMISSIONS = {
    SUPER_ADMIN: ['*'], // Acesso total
    OWNER: ['manage_users', 'manage_settings', 'view_reports', 'manage_data'],
    ADMIN: ['manage_settings', 'view_reports', 'manage_data'],
    EMPLOYEE: ['manage_data', 'view_reports'],
    USER: ['view_data'],
} as const;