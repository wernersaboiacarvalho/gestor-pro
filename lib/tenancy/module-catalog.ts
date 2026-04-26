export const MODULE_CATALOG = {
  dashboard: {
    label: 'Dashboard',
    description: 'Visao geral operacional e indicadores principais.',
    implemented: true,
  },
  customers: {
    label: 'Clientes',
    description: 'Cadastro e relacionamento com clientes.',
    implemented: true,
  },
  services: {
    label: 'Servicos',
    description: 'Gestao de servicos e ordens de trabalho.',
    implemented: true,
  },
  products: {
    label: 'Produtos',
    description: 'Catalogo, estoque e precificacao.',
    implemented: true,
  },
  financeiro: {
    label: 'Financeiro',
    description: 'Receitas, despesas e fluxo financeiro.',
    implemented: true,
  },
  activities: {
    label: 'Atividades',
    description: 'Auditoria e rastreamento de acoes.',
    implemented: true,
  },
  settings: {
    label: 'Configuracoes',
    description: 'Ajustes operacionais e preferencias do tenant.',
    implemented: true,
  },
  vehicles: {
    label: 'Veiculos',
    description: 'Veiculos dos clientes e historico de atendimento.',
    implemented: true,
  },
  mechanics: {
    label: 'Mecanicos',
    description: 'Equipe tecnica, especialidades e comissoes.',
    implemented: true,
  },
  third_party: {
    label: 'Terceirizados',
    description: 'Fornecedores e servicos terceirizados.',
    implemented: true,
  },
  orders: {
    label: 'Pedidos',
    description: 'Pedidos de restaurante e consumo no salao.',
    implemented: false,
  },
  menu: {
    label: 'Cardapio',
    description: 'Itens, categorias e disponibilidade.',
    implemented: false,
  },
  tables: {
    label: 'Mesas',
    description: 'Mapa de mesas e ocupacao.',
    implemented: false,
  },
  delivery: {
    label: 'Delivery',
    description: 'Entregas e integracoes externas.',
    implemented: false,
  },
  students: {
    label: 'Alunos',
    description: 'Cadastro e acompanhamento de alunos.',
    implemented: false,
  },
  plans: {
    label: 'Planos',
    description: 'Planos, mensalidades e recorrencia.',
    implemented: false,
  },
  workouts: {
    label: 'Treinos',
    description: 'Montagem e execucao de treinos.',
    implemented: false,
  },
  attendance: {
    label: 'Frequencia',
    description: 'Controle de presenca e acessos.',
    implemented: false,
  },
  agenda: {
    label: 'Agenda',
    description: 'Agendamentos e disponibilidade operacional.',
    implemented: false,
  },
} as const

export type TenantModuleKey = keyof typeof MODULE_CATALOG
export type TenantModulesMap = Record<TenantModuleKey, boolean>
export const CORE_TENANT_MODULES: TenantModuleKey[] = ['dashboard', 'settings']

const MODULE_ROUTE_PREFIXES: Array<{ prefix: string; module: TenantModuleKey }> = [
  { prefix: '/dashboard/oficina/veiculos', module: 'vehicles' },
  { prefix: '/dashboard/oficina/mecanicos', module: 'mechanics' },
  { prefix: '/dashboard/oficina/terceirizados', module: 'third_party' },
  { prefix: '/dashboard/customers', module: 'customers' },
  { prefix: '/dashboard/services', module: 'services' },
  { prefix: '/dashboard/products', module: 'products' },
  { prefix: '/dashboard/financeiro', module: 'financeiro' },
  { prefix: '/dashboard/activities', module: 'activities' },
  { prefix: '/dashboard/settings', module: 'settings' },
  { prefix: '/dashboard', module: 'dashboard' },
]

export function createModuleMap(enabledKeys: TenantModuleKey[]): TenantModulesMap {
  return Object.keys(MODULE_CATALOG).reduce((acc, key) => {
    acc[key as TenantModuleKey] = enabledKeys.includes(key as TenantModuleKey)
    return acc
  }, {} as TenantModulesMap)
}

export function listEnabledModules(modules: Partial<TenantModulesMap> | null | undefined) {
  return (Object.keys(MODULE_CATALOG) as TenantModuleKey[])
    .filter((key) => Boolean(modules?.[key]))
    .map((key) => ({
      key,
      ...MODULE_CATALOG[key],
    }))
}

export function resolveModuleForPath(pathname: string): TenantModuleKey | null {
  const match = MODULE_ROUTE_PREFIXES.find((entry) => pathname.startsWith(entry.prefix))
  return match?.module ?? null
}
