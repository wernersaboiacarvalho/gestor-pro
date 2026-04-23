// types/user.ts

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'EMPLOYEE' | 'USER'

export interface User {
    id: string
    email: string
    name: string
    role: UserRole
    avatar?: string | null
    tenantId?: string | null
    lastLoginAt?: string | null
    createdAt: string
    updatedAt: string
}

export interface CreateUserDTO {
    email: string
    password: string
    name: string
    role: UserRole
    tenantId?: string | null
}

export interface UpdateUserDTO {
    name?: string
    role?: UserRole
    avatar?: string | null
}