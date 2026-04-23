// lib/errors/error-codes.ts

export const ERROR_CODES = {
    // ===============================
    // GENERIC
    // ===============================
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    INVALID_REQUEST: 'INVALID_REQUEST',
    VALIDATION_ERROR: 'VALIDATION_ERROR', // ⬅️ NOVO!
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // ===============================
    // CUSTOMER
    // ===============================
    CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
    CUSTOMER_DUPLICATE_CPF: 'CUSTOMER_DUPLICATE_CPF',
    CUSTOMER_HAS_DEPENDENCIES: 'CUSTOMER_HAS_DEPENDENCIES',

    // ===============================
    // VEHICLE
    // ===============================
    VEHICLE_NOT_FOUND: 'VEHICLE_NOT_FOUND',
    VEHICLE_DUPLICATE_PLATE: 'VEHICLE_DUPLICATE_PLATE',
    VEHICLE_HAS_DEPENDENCIES: 'VEHICLE_HAS_DEPENDENCIES',
    VEHICLE_CUSTOMER_MISMATCH: 'VEHICLE_CUSTOMER_MISMATCH',

    // ===============================
    // MECHANIC
    // ===============================
    MECHANIC_NOT_FOUND: 'MECHANIC_NOT_FOUND',
    MECHANIC_DUPLICATE_CPF: 'MECHANIC_DUPLICATE_CPF',
    MECHANIC_HAS_DEPENDENCIES: 'MECHANIC_HAS_DEPENDENCIES',

    // ===============================
    // SERVICE
    // ===============================
    SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
    SERVICE_INVALID_DATA: 'SERVICE_INVALID_DATA',

    // ===============================
    // PRODUCT
    // ===============================
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND', // ⬅️ NOVO!
    PRODUCT_DUPLICATE_SKU: 'PRODUCT_DUPLICATE_SKU', // ⬅️ NOVO!
    PRODUCT_INSUFFICIENT_STOCK: 'PRODUCT_INSUFFICIENT_STOCK', // ⬅️ NOVO!

    // ===============================
    // THIRD PARTY
    // ===============================
    THIRD_PARTY_NOT_FOUND: 'THIRD_PARTY_NOT_FOUND',
    THIRD_PARTY_DUPLICATE_CNPJ: 'THIRD_PARTY_DUPLICATE_CNPJ',
    THIRD_PARTY_HAS_DEPENDENCIES: 'THIRD_PARTY_HAS_DEPENDENCIES',

    // ===============================
    // ACTIVITY / LOGS
    // ===============================
    ACTIVITY_LOG_FAILED: 'ACTIVITY_LOG_FAILED',
    ACTIVITY_INVALID_DATA: 'ACTIVITY_INVALID_DATA',

} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]