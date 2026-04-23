// lib/validators/phone.validator.ts

/**
 * Validador de Telefones Brasileiros
 * Suporta fixo e celular com/sem código de área
 */

/**
 * Valida telefone brasileiro
 * Aceita: (11) 98765-4321, 11987654321, 1234-5678, etc
 */
export function validatePhone(phone: string): boolean {
    if (!phone) return false;

    const cleaned = phone.replace(/[^\d]/g, '');

    // Telefone com DDD (11 dígitos para celular, 10 para fixo)
    if (cleaned.length === 11 || cleaned.length === 10) {
        return true;
    }

    // Telefone sem DDD (9 dígitos para celular, 8 para fixo)
    if (cleaned.length === 9 || cleaned.length === 8) {
        return true;
    }

    return false;
}

/**
 * Valida se é celular (tem 9 dígitos no número)
 */
export function isCellphone(phone: string): boolean {
    const cleaned = phone.replace(/[^\d]/g, '');

    // Com DDD: 11 dígitos
    if (cleaned.length === 11) {
        return cleaned.charAt(2) === '9';
    }

    // Sem DDD: 9 dígitos
    if (cleaned.length === 9) {
        return cleaned.charAt(0) === '9';
    }

    return false;
}

/**
 * Formata telefone para exibição
 * 11987654321 -> (11) 98765-4321
 * 1134567890 -> (11) 3456-7890
 * 987654321 -> 98765-4321
 */
export function formatPhone(phone: string): string {
    if (!phone) return '';

    const cleaned = phone.replace(/[^\d]/g, '');

    // Com DDD - Celular (11 dígitos)
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    // Com DDD - Fixo (10 dígitos)
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    // Sem DDD - Celular (9 dígitos)
    if (cleaned.length === 9) {
        return cleaned.replace(/(\d{5})(\d{4})/, '$1-$2');
    }

    // Sem DDD - Fixo (8 dígitos)
    if (cleaned.length === 8) {
        return cleaned.replace(/(\d{4})(\d{4})/, '$1-$2');
    }

    return phone;
}

/**
 * Remove formatação do telefone
 */
export function cleanPhone(phone: string): string {
    return phone.replace(/[^\d]/g, '');
}

/**
 * Adiciona DDD padrão se não tiver
 */
export function addDefaultDDD(phone: string, ddd: string = '85'): string {
    const cleaned = cleanPhone(phone);

    // Se já tem DDD (10 ou 11 dígitos), retorna
    if (cleaned.length >= 10) return cleaned;

    // Adiciona DDD
    return `${ddd}${cleaned}`;
}