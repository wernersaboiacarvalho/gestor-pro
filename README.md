# Gestor Pro

Plataforma SaaS multi-tenant para operacao de pequenos negocios. O foco atual do produto esta em oficinas mecanicas, mas a base do projeto agora considera a evolucao para templates de negocio como academias, restaurantes e operacoes genericas.

## Estado atual

- Stack principal: `Next.js App Router`, `TypeScript`, `NextAuth`, `Prisma`, `PostgreSQL`, `React Query`, `Tailwind`, `Radix UI`.
- Dominio mais maduro hoje: `OFICINA`.
- Multi-tenant atual: isolamento por `tenantId`, autenticacao com tenant no token e templates de negocio com modulos padrao.
- Testes existentes: `Vitest` para validadores e alguns services.

## Objetivo arquitetural

O projeto deve crescer como uma plataforma com tres camadas claras:

1. `Core platform`
   Autenticacao, autorizacao, tenancy, billing, auditoria, configuracoes, usuarios, limites de plano, observabilidade.

2. `Business templates`
   Conjunto de templates que definem modulos padrao, categorias iniciais, navegacao esperada e capacidades por segmento.

3. `Business modules`
   Recursos independentes como `customers`, `services`, `products`, `vehicles`, `mechanics`, `orders`, `plans`, `attendance`.

Hoje a base ja possui os primeiros passos da camada 2 em `lib/tenancy/`.

## Estrutura importante

```text
app/
  api/                      Rotas HTTP do App Router
  admin/                    Area de super admin
  dashboard/                Area autenticada do tenant
components/                 Componentes compartilhados
hooks/                      Hooks de UI e dados
lib/
  auth.ts                   Configuracao do NextAuth
  http/                     Helpers de resposta, validacao e tratamento de erro
  services/                 Regras de negocio por agregado
  tenancy/                  Catalogo de modulos e templates de negocio
prisma/
  schema.prisma             Modelo de dados
schemas/                    Schemas Zod para requests
tests/                      Testes unitarios
types/                      Tipos compartilhados
```

## Multi-tenancy de verdade

Para o projeto ficar realmente multi-tenant, estas regras precisam ser inegociaveis:

- Todo dado de dominio deve pertencer explicitamente a um `tenantId`, exceto entidades globais de plataforma.
- Toda leitura e escrita autenticada deve passar por contexto de tenant e validar ownership.
- Toda feature visivel no frontend deve nascer de `capabilities` do tenant, nao de condicionais espalhadas.
- Todo tenant deve ser criado a partir de um `business template`, nunca de payload solto com JSON arbitrario.
- Toda permissao deve combinar `role`, `module enablement` e, no futuro, `plan limits`.
- Todo comportamento cross-tenant deve existir apenas em area `SUPER_ADMIN` ou em servicos de plataforma muito bem delimitados.

## Templates de negocio

Os templates de negocio ficam centralizados em:

- [lib/tenancy/business-templates.ts](/C:/Users/werne/WebstormProjects/gestor-pro/lib/tenancy/business-templates.ts:1)
- [lib/tenancy/module-catalog.ts](/C:/Users/werne/WebstormProjects/gestor-pro/lib/tenancy/module-catalog.ts:1)

Cada template define:

- `label` e `description`
- `defaultModules`
- `highlights`
- `defaultCategories`

Templates existentes:

- `OFICINA`
- `RESTAURANTE`
- `ACADEMIA`
- `GENERICO`

## Modulos

O catalogo de modulos separa o que ja existe do que ainda e planejado.

Modulos implementados hoje:

- `dashboard`
- `customers`
- `services`
- `products`
- `financeiro`
- `activities`
- `settings`
- `vehicles`
- `mechanics`
- `third_party`

Modulos previstos para evolucao:

- `orders`
- `menu`
- `tables`
- `delivery`
- `students`
- `plans`
- `workouts`
- `attendance`
- `agenda`

## Fluxo recomendado para criar um novo segmento

1. Adicionar o novo template em `lib/tenancy/business-templates.ts`.
2. Declarar os modulos necessarios em `lib/tenancy/module-catalog.ts`.
3. Criar as entidades Prisma apenas se o novo segmento realmente exigir persistencia nova.
4. Criar services e schemas do modulo.
5. Expor rotas em `app/api/...` com guardas de tenant.
6. Conectar o dashboard e settings ao conjunto de modulos habilitados.
7. Cobrir o comportamento com testes de service e autorizacao.

## Regras de qualidade para continuar crescendo

- Nao criar regra de negocio diretamente em componente React.
- Nao duplicar listas de `businessType` ou modulos em telas e rotas.
- Nao acessar Prisma direto em componente; concentrar em route handlers e services.
- Nao adicionar modulo novo sem decidir se ele e `core`, `template-specific` ou `future`.
- Nao confiar apenas em esconder menu; a API tambem precisa validar tenant e permissao.
- Nao usar `tenant.modules` como JSON arbitrario sem contrato. O contrato deve nascer do catalogo de modulos.

## Performance em desenvolvimento

O projeto ainda sente peso em desenvolvimento. Os pontos mais provaveis hoje sao:

- excesso de componentes client-side em paginas grandes
- dashboards com fetch frequente e muitas dependencias de grafico
- `ReactQueryDevtools` sempre montado no provider
- navegacao e telas admin ainda muito orientadas a `fetch` manual
- acoplamento grande entre pagina, estado local e renderizacao

Direcao recomendada para a proxima rodada:

1. reduzir superficie `use client` para o minimo necessario
2. mover leitura inicial de telas pesadas para server components quando fizer sentido
3. revisar `React Query` para evitar `refetch` agressivo em dev
4. quebrar telas grandes em blocos menores com ownership claro
5. medir paginas mais lentas com `next build --profile` e React Profiler

## Ambiente local

### Requisitos

- `Node.js 20+`
- `PostgreSQL`
- variaveis em `.env`

### Scripts

```bash
npm run dev
npm run build
npm test -- --run
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Prioridades tecnicas recomendadas

Curto prazo:

- consolidar validacao e criacao de tenant em um fluxo unico
- padronizar respostas das rotas admin
- adicionar testes para auth, tenant creation e settings
- mover leitura de modules/template para um hook unico no dashboard

Medio prazo:

- capability matrix por modulo e role
- limites por plano
- navegacao dinamica por modulos habilitados
- subdominio por tenant
- jobs assicronos para auditoria, notificacoes e billing

Longo prazo:

- separar `platform` de `business modules`
- telemetria por tenant
- marketplace interno de modulos/templates

## Observacao importante

O projeto ainda nao esta pronto para dizer que suporta varios segmentos com a mesma maturidade da oficina. O que esta sendo construido agora e a fundacao correta para isso: fonte unica de templates, catalogo de modulos e contratos mais claros entre tenant, settings e UI.
