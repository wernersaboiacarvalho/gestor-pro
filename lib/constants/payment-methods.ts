// lib/constants/payment-methods.ts

/**
 * Métodos de Pagamento e Transações
 */

export const PAYMENT_METHOD = {
    DINHEIRO: 'DINHEIRO',
    CARTAO_CREDITO: 'CARTAO_CREDITO',
    CARTAO_DEBITO: 'CARTAO_DEBITO',
    PIX: 'PIX',
    BOLETO: 'BOLETO',
    TRANSFERENCIA: 'TRANSFERENCIA',
    OUTRO: 'OUTRO',
} as const;

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO: 'Cartão de Crédito',
    CARTAO_DEBITO: 'Cartão de Débito',
    PIX: 'PIX',
    BOLETO: 'Boleto',
    TRANSFERENCIA: 'Transferência',
    OUTRO: 'Outro',
};

export const PAYMENT_METHOD_OPTIONS = [
    { value: PAYMENT_METHOD.DINHEIRO, label: PAYMENT_METHOD_LABELS.DINHEIRO },
    { value: PAYMENT_METHOD.PIX, label: PAYMENT_METHOD_LABELS.PIX },
    { value: PAYMENT_METHOD.CARTAO_DEBITO, label: PAYMENT_METHOD_LABELS.CARTAO_DEBITO },
    { value: PAYMENT_METHOD.CARTAO_CREDITO, label: PAYMENT_METHOD_LABELS.CARTAO_CREDITO },
    { value: PAYMENT_METHOD.TRANSFERENCIA, label: PAYMENT_METHOD_LABELS.TRANSFERENCIA },
    { value: PAYMENT_METHOD.BOLETO, label: PAYMENT_METHOD_LABELS.BOLETO },
    { value: PAYMENT_METHOD.OUTRO, label: PAYMENT_METHOD_LABELS.OUTRO },
];

// Tipos de Transação
export const TRANSACTION_TYPE = {
    RECEITA: 'RECEITA',
    DESPESA: 'DESPESA',
} as const;

export type TransactionType = typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
    RECEITA: 'Receita',
    DESPESA: 'Despesa',
};

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
    RECEITA: 'bg-green-100 text-green-800 border-green-200',
    DESPESA: 'bg-red-100 text-red-800 border-red-200',
};

export const TRANSACTION_TYPE_OPTIONS = [
    { value: TRANSACTION_TYPE.RECEITA, label: TRANSACTION_TYPE_LABELS.RECEITA },
    { value: TRANSACTION_TYPE.DESPESA, label: TRANSACTION_TYPE_LABELS.DESPESA },
];

// Categorias de Receita
export const REVENUE_CATEGORIES = [
    'Serviços',
    'Venda de Peças',
    'Mão de Obra',
    'Mensalidade',
    'Aluguel',
    'Outros',
];

// Categorias de Despesa
export const EXPENSE_CATEGORIES = [
    'Compra de Peças',
    'Salários',
    'Aluguel',
    'Energia',
    'Água',
    'Internet',
    'Telefone',
    'Manutenção',
    'Impostos',
    'Marketing',
    'Serviços Terceirizados',
    'Outros',
];