import { BUSINESS_TYPE, type BusinessType } from '@/lib/constants/tenant-types'
import { createModuleMap, listEnabledModules, type TenantModulesMap } from './module-catalog'

interface BusinessTemplateDefinition {
  businessType: BusinessType
  label: string
  shortLabel: string
  description: string
  defaultModules: TenantModulesMap
  highlights: string[]
  defaultCategories: Array<{ name: string; description: string }>
}

export const BUSINESS_TEMPLATES: Record<BusinessType, BusinessTemplateDefinition> = {
  OFICINA: {
    businessType: BUSINESS_TYPE.OFICINA,
    label: 'Oficina Mecanica',
    shortLabel: 'Oficina',
    description: 'Fluxo operacional voltado para OS, veiculos, estoque tecnico e terceirizacao.',
    defaultModules: createModuleMap([
      'dashboard',
      'customers',
      'services',
      'products',
      'financeiro',
      'activities',
      'settings',
      'vehicles',
      'mechanics',
      'third_party',
    ]),
    highlights: ['Ordens de servico', 'Veiculos', 'Mecanicos', 'Terceirizados'],
    defaultCategories: [
      { name: 'Manutencao Preventiva', description: 'Revisoes e manutencoes programadas' },
      { name: 'Mecanica Geral', description: 'Reparos e consertos mecanicos' },
      { name: 'Eletrica', description: 'Sistemas eletricos e eletronicos' },
      { name: 'Funilaria e Pintura', description: 'Reparos de lataria e pintura' },
    ],
  },
  RESTAURANTE: {
    businessType: BUSINESS_TYPE.RESTAURANTE,
    label: 'Restaurante',
    shortLabel: 'Restaurante',
    description: 'Base orientada a atendimento, cardapio, operacao de mesas e delivery.',
    defaultModules: createModuleMap([
      'dashboard',
      'customers',
      'products',
      'financeiro',
      'activities',
      'settings',
      'orders',
      'menu',
      'tables',
      'delivery',
    ]),
    highlights: ['Pedidos', 'Cardapio', 'Mesas', 'Delivery'],
    defaultCategories: [
      { name: 'Entradas', description: 'Aperitivos e entradas' },
      { name: 'Pratos Principais', description: 'Pratos principais do cardapio' },
      { name: 'Sobremesas', description: 'Sobremesas e doces' },
      { name: 'Bebidas', description: 'Bebidas diversas' },
    ],
  },
  ACADEMIA: {
    businessType: BUSINESS_TYPE.ACADEMIA,
    label: 'Academia',
    shortLabel: 'Academia',
    description: 'Estrutura para alunos, planos, treinos e controle de frequencia.',
    defaultModules: createModuleMap([
      'dashboard',
      'customers',
      'financeiro',
      'activities',
      'settings',
      'students',
      'plans',
      'workouts',
      'attendance',
    ]),
    highlights: ['Alunos', 'Planos', 'Treinos', 'Frequencia'],
    defaultCategories: [
      { name: 'Musculacao', description: 'Treinos de musculacao' },
      { name: 'Aerobico', description: 'Treinos aerobicos e cardio' },
      { name: 'Funcional', description: 'Treinos funcionais' },
      { name: 'Lutas', description: 'Artes marciais e lutas' },
    ],
  },
  GENERICO: {
    businessType: BUSINESS_TYPE.GENERICO,
    label: 'Generico',
    shortLabel: 'Generico',
    description: 'Template enxuto para servicos, clientes, produtos e agenda.',
    defaultModules: createModuleMap([
      'dashboard',
      'customers',
      'services',
      'products',
      'activities',
      'settings',
      'agenda',
    ]),
    highlights: ['Clientes', 'Servicos', 'Produtos', 'Agenda'],
    defaultCategories: [{ name: 'Geral', description: 'Categoria geral' }],
  },
}

export function getBusinessTemplate(businessType: BusinessType) {
  return BUSINESS_TEMPLATES[businessType]
}

export function getBusinessTypeOptions() {
  return Object.values(BUSINESS_TEMPLATES).map((template) => ({
    value: template.businessType,
    label: template.label,
    description: template.description,
    highlights: template.highlights,
  }))
}

export function buildTenantModules(
  businessType: BusinessType,
  overrides?: Partial<TenantModulesMap>
) {
  const template = getBusinessTemplate(businessType)
  return {
    ...template.defaultModules,
    ...overrides,
  }
}

export function resolveTenantModules(
  businessType: BusinessType,
  tenantModules?: Partial<TenantModulesMap> | null,
  settingsModules?: Partial<TenantModulesMap> | null
) {
  return buildTenantModules(businessType, {
    ...(tenantModules ?? {}),
    ...(settingsModules ?? {}),
  })
}

export function describeEnabledModules(
  businessType: BusinessType,
  overrides?: Partial<TenantModulesMap>
) {
  const modules = buildTenantModules(businessType, overrides)
  return listEnabledModules(modules)
}

export type BusinessTemplate = BusinessTemplateDefinition
