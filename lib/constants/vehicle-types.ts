// lib/constants/vehicle-types.ts

/**
 * Tipos e Categorias de Veículos
 */

export const VEHICLE_CATEGORY = {
    CARRO: 'CARRO',
    MOTO: 'MOTO',
    CAMINHAO: 'CAMINHAO',
    OUTRO: 'OUTRO',
} as const;

export type VehicleCategory = typeof VEHICLE_CATEGORY[keyof typeof VEHICLE_CATEGORY];

export const VEHICLE_CATEGORY_LABELS: Record<VehicleCategory, string> = {
    CARRO: 'Carro',
    MOTO: 'Moto',
    CAMINHAO: 'Caminhão',
    OUTRO: 'Outro',
};

export const VEHICLE_CATEGORY_OPTIONS = [
    { value: VEHICLE_CATEGORY.CARRO, label: VEHICLE_CATEGORY_LABELS.CARRO },
    { value: VEHICLE_CATEGORY.MOTO, label: VEHICLE_CATEGORY_LABELS.MOTO },
    { value: VEHICLE_CATEGORY.CAMINHAO, label: VEHICLE_CATEGORY_LABELS.CAMINHAO },
    { value: VEHICLE_CATEGORY.OUTRO, label: VEHICLE_CATEGORY_LABELS.OUTRO },
];

// Marcas populares (pode ser expandido)
export const POPULAR_BRANDS = [
    'Chevrolet',
    'Fiat',
    'Ford',
    'Honda',
    'Hyundai',
    'Jeep',
    'Nissan',
    'Renault',
    'Toyota',
    'Volkswagen',
    'Yamaha',
    'Suzuki',
    'Kawasaki',
    'Ducati',
    'BMW',
    'Mercedes-Benz',
    'Audi',
    'Volvo',
    'Scania',
    'Iveco',
];

// Cores comuns
export const VEHICLE_COLORS = [
    'Branco',
    'Preto',
    'Prata',
    'Cinza',
    'Vermelho',
    'Azul',
    'Verde',
    'Amarelo',
    'Marrom',
    'Bege',
    'Laranja',
    'Rosa',
    'Roxo',
    'Dourado',
];

// Tipos de combustível
export const FUEL_TYPES = [
    'Gasolina',
    'Álcool',
    'Flex',
    'Diesel',
    'GNV',
    'Elétrico',
    'Híbrido',
];

// Transmissão
export const TRANSMISSION_TYPES = [
    'Manual',
    'Automática',
    'Automatizada',
    'CVT',
];