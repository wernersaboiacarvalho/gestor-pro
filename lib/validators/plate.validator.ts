// lib/validators/plate.validator.ts

/**
 * Validador de Placas de Veículos
 * Suporta formato antigo (AAA-9999) e Mercosul (AAA9A99)
 */

/**
 * Valida placa no formato antigo (AAA-9999)
 */
export function validateOldPlate(plate: string): boolean {
    if (!plate) return false;

    const cleaned = plate.replace(/[^\w]/g, '').toUpperCase();

    // Formato: 3 letras + 4 números
    const oldPattern = /^[A-Z]{3}\d{4}$/;

    return oldPattern.test(cleaned);
}

/**
 * Valida placa no formato Mercosul (AAA9A99)
 */
export function validateMercosulPlate(plate: string): boolean {
    if (!plate) return false;

    const cleaned = plate.replace(/[^\w]/g, '').toUpperCase();

    // Formato: 3 letras + 1 número + 1 letra + 2 números
    const mercosulPattern = /^[A-Z]{3}\d[A-Z]\d{2}$/;

    return mercosulPattern.test(cleaned);
}

/**
 * Valida qualquer formato de placa (antigo ou Mercosul)
 */
export function validatePlate(plate: string): boolean {
    return validateOldPlate(plate) || validateMercosulPlate(plate);
}

/**
 * Formata placa para exibição (adiciona hífen)
 * ABC1234 -> ABC-1234
 * ABC1D23 -> ABC-1D23
 */
export function formatPlate(plate: string): string {
    if (!plate) return '';

    const cleaned = plate.replace(/[^\w]/g, '').toUpperCase();

    if (cleaned.length !== 7) return plate;

    // Adiciona hífen após o terceiro caractere
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
}

/**
 * Remove formatação da placa
 * ABC-1234 -> ABC1234
 */
export function cleanPlate(plate: string): string {
    return plate.replace(/[^\w]/g, '').toUpperCase();
}

/**
 * Detecta o tipo de placa
 */
export function getPlateType(plate: string): 'antiga' | 'mercosul' | 'invalida' {
    const cleaned = cleanPlate(plate);

    if (validateOldPlate(cleaned)) return 'antiga';
    if (validateMercosulPlate(cleaned)) return 'mercosul';

    return 'invalida';
}