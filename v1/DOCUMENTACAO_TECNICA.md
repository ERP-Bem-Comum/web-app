# Documentação Técnica — ERP Financeiro Frontend

> Destinado ao time técnico que assumirá a operação e evolução do sistema.

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Tecnologias e Dependências](#2-tecnologias-e-dependências)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Roteamento e Páginas](#5-roteamento-e-páginas)
6. [Gerenciamento de Estado](#6-gerenciamento-de-estado)
7. [Integração com a API](#7-integração-com-a-api)
8. [Autenticação](#8-autenticação)
9. [Sistema de Componentes e UI](#9-sistema-de-componentes-e-ui)
10. [Formulários e Validação](#10-formulários-e-validação)
11. [Tipos TypeScript](#11-tipos-typescript)
12. [Enums e Constantes](#12-enums-e-constantes)
13. [Utilitários](#13-utilitários)
14. [Estilização e Tema](#14-estilização-e-tema)
15. [Setup do Ambiente de Desenvolvimento](#15-setup-do-ambiente-de-desenvolvimento)
16. [Build e Deploy](#16-build-e-deploy)
17. [Variáveis de Ambiente](#17-variáveis-de-ambiente)
18. [Padrões e Convenções](#18-padrões-e-convenções)
19. [Fluxos de Tela Principais](#19-fluxos-de-tela-principais)

---

## 1. Visão Geral do Projeto

O **ERP Financeiro Frontend** é a interface web do sistema de gestão financeira. Desenvolvido em **Next.js 13** com App Router, oferece uma experiência completa de SPA (Single Page Application) com SSR opcional.

**Funcionalidades principais expostas na interface:**
- Dashboard financeiro com KPIs
- Gestão de contas a pagar e a receber
- Fluxo de aprovação de pagamentos
- Gestão de contratos e parcelas
- Planejamento orçamentário com compartilhamento externo
- Conciliação bancária
- Gestão de colaboradores, fornecedores e financiadores
- Relatórios financeiros (posição, fluxo de caixa, análise, realizado)
- Exportação CNAB para pagamentos em lote

**Informações básicas:**

| Item | Valor |
|------|-------|
| Framework | Next.js 13.4.7 |
| React | 18.2.0 |
| TypeScript | 5.7.2 |
| Porta padrão | 3000 |
| Backend | Comunicação via REST API |

---

## 2. Tecnologias e Dependências

### Core

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `next` | 13.4.7 | Framework React com SSR e App Router |
| `react` | 18.2.0 | Biblioteca UI principal |
| `react-dom` | 18.2.0 | Renderização no DOM |
| `typescript` | 5.7.2 | Tipagem estática |

### Autenticação e Sessão

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `next-auth` | 4.23.1 | Autenticação (JWT + Credentials) |
| `nookies` | 2.5.2 | Gerenciamento de cookies SSR-compatível |

### Estado e Dados

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `@tanstack/react-query` | 5.59.9 | Servidor state, cache e sincronização |
| `@tanstack/react-query-devtools` | 5.59.9 | DevTools do React Query |
| `axios` | 1.5.0 | Cliente HTTP para comunicação com a API |

### UI e Componentes

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `@mui/material` | 6.1.3 | Material UI — componentes base |
| `@mui/icons-material` | 6.1.3 | Ícones Material Design |
| `@mui/x-date-pickers` | 8.0.0 | Seletores de data/hora (MUI) |
| `@radix-ui/react-*` | variadas | Primitivos de UI acessíveis |
| `lucide-react` | 0.277.0 | Biblioteca de ícones SVG |
| `react-icons` | 4.11.0 | Coleção de ícones adicionais |

### Estilização

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `tailwindcss` | 3.3.3 | Utility-first CSS |
| `@emotion/react` + `@emotion/styled` | 11.13.x | CSS-in-JS (MUI) |
| `tailwind-merge` | 1.14.0 | Merge de classes Tailwind sem conflito |
| `tailwindcss-animate` | 1.0.7 | Animações via Tailwind |
| `class-variance-authority` | 0.7.0 | Variantes de componentes tipadas |
| `postcss` | 8.4.29 | Processador CSS |
| `autoprefixer` | 10.4.15 | Prefixos CSS automáticos |

### Formulários e Validação

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `react-hook-form` | 7.46.1 | Formulários performáticos |
| `@hookform/resolvers` | 3.3.1 | Integração RHF com schemas |
| `zod` | 3.22.2 | Validação de schemas TypeScript |

### Gráficos e Visualização

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `recharts` | 2.15.0 | Gráficos React SVG |
| `chart.js` | 4.4.7 | Gráficos canvas |
| `highcharts` | 11.2.0 | Gráficos avançados (premium) |
| `highcharts-react-official` | 3.2.1 | Wrapper React para Highcharts |

### Utilitários

| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `date-fns` | 3.0.0 | Manipulação de datas |
| `file-saver` | 2.0.5 | Download de arquivos no browser |
| `jspdf` | 2.5.2 | Geração de PDFs no cliente |
| `sharp` | 0.32.6 | Otimização de imagens |
| `react-loading` | 2.0.3 | Componente de loading |
| `firebase-admin` | 11.0.1 | SDK Firebase Admin (SSR) |
| `firebase-functions` | 3.23.0 | Firebase Cloud Functions |

---

## 3. Arquitetura do Sistema

### Posição no Sistema

```
┌─────────────────────────────────────────────────────────────┐
│               ERP FINANCEIRO FRONTEND                        │
│                  Next.js 13 App Router                       │
│                  http://localhost:3000                        │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Pages/     │  │  Components  │  │    Contexts +     │  │
│  │   App Router │  │  (UI Layer)  │  │    Hooks          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────┘  │
│         └─────────────────┼─────────────────┘               │
│                           │                                   │
│  ┌────────────────────────▼────────────────────────────┐    │
│  │              Service Layer (src/services/)            │    │
│  │         Axios + React Query + NextAuth                │    │
│  └────────────────────────┬────────────────────────────┘    │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTPS / REST
┌───────────────────────────▼─────────────────────────────────┐
│              BACKEND (NestJS — porta 3003)                   │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
Usuário interage com Componente
        │
        ▼
Hook customizado (useXxx)
        │
        ▼
React Query (cache + sincronização)
        │
        ▼
Service (axios call)
        │
        ▼
API Backend
        │
        ▼ (resposta)
React Query atualiza cache
        │
        ▼
Componente re-renderiza com novos dados
```

---

## 4. Estrutura de Diretórios

```
erp-financeiro-frontend/
├── src/
│   ├── app/                        # Next.js App Router (páginas)
│   │   ├── layout.tsx              # Layout raiz
│   │   ├── (auth)/                 # Rotas de autenticação
│   │   │   ├── login/
│   │   │   ├── recuperar-senha/
│   │   │   └── nova-senha/
│   │   ├── (main)/                 # Layout principal (autenticado)
│   │   │   ├── layout.tsx          # Layout com sidebar
│   │   │   ├── (financeiro)/       # Módulo financeiro
│   │   │   │   ├── contas-pagar/
│   │   │   │   ├── contas-receber/
│   │   │   │   ├── contas-bancarias/
│   │   │   │   └── cartao/
│   │   │   ├── (contracts)/        # Módulo de contratos
│   │   │   │   └── contratos/
│   │   │   ├── (gestao-parceiros)/ # Gestão de parceiros
│   │   │   │   ├── colaboradores/
│   │   │   │   ├── fornecedores/
│   │   │   │   ├── financiadores/
│   │   │   │   ├── estados/
│   │   │   │   └── municipios/
│   │   │   ├── (gestao-programa)/  # Gestão de programas
│   │   │   │   └── programas/
│   │   │   ├── (gestao-usuario)/   # Gestão de usuários
│   │   │   │   ├── usuarios/
│   │   │   │   └── minha-conta/
│   │   │   ├── (plano-orcamentario)/ # Orçamento
│   │   │   │   ├── planejamento/
│   │   │   │   └── consolidado/
│   │   │   └── (reports)/          # Relatórios
│   │   │       ├── geral/
│   │   │       ├── fluxocaixa/
│   │   │       ├── equipe/
│   │   │       ├── realizado/
│   │   │       ├── posicao/
│   │   │       │   ├── pagamentos/
│   │   │       │   └── recebiveis/
│   │   │       ├── analise/
│   │   │       │   ├── pagamentos/
│   │   │       │   └── recebimentos/
│   │   │       └── semcontratos/
│   │   ├── aprovar/                # Fluxo de aprovação (sem auth)
│   │   │   ├── acesso/[id]/
│   │   │   └── detalhes/
│   │   ├── colaboradores/          # Cadastro externo de colaboradores
│   │   │   ├── cadastro-completo/
│   │   │   └── finalizado/
│   │   ├── consolidado-compartilhado/ # View compartilhada
│   │   ├── plano-orcamentario-compartilhado/ # Orçamento compartilhado
│   │   └── api/
│   │       └── auth/[...nextauth]/ # Endpoint NextAuth
│   │
│   ├── components/                 # Componentes reutilizáveis
│   │   ├── ui/                     # Componentes base (shadcn/ui)
│   │   ├── layout/                 # Layout (sidebar, header, nav)
│   │   ├── auth/                   # Formulários de autenticação
│   │   ├── dashboard/              # Widgets do dashboard
│   │   ├── table/                  # Tabelas reutilizáveis
│   │   ├── modals/                 # Modais de confirmação e formulário
│   │   ├── payables/               # Componentes de contas a pagar
│   │   ├── receivables/            # Componentes de contas a receber
│   │   ├── contracts/              # Componentes de contratos
│   │   ├── bank-account/           # Contas bancárias
│   │   ├── creditCard/             # Cartão de crédito
│   │   ├── budgetPlan/             # Plano orçamentário
│   │   ├── costCenter/             # Centro de custo
│   │   ├── partners/               # Parceiros
│   │   ├── suppliers/              # Fornecedores
│   │   ├── collaborators/          # Colaboradores
│   │   ├── user/                   # Perfil de usuário
│   │   ├── programs/               # Programas
│   │   ├── reports/                # Relatórios
│   │   ├── consolidated/           # Visão consolidada
│   │   ├── files/                  # Upload/download de arquivos
│   │   ├── calculationMemory/      # Memória de cálculo orçamentário
│   │   ├── minha-conta/            # Configurações da conta
│   │   ├── Providers.tsx           # Composição de providers globais
│   │   ├── ErrorText/              # Exibição de erros
│   │   └── List/                   # Wrappers de lista/tabela
│   │
│   ├── contexts/                   # React Context API
│   │   ├── approvalsContext.tsx    # Estado do fluxo de aprovação
│   │   ├── payablesContext.tsx     # Estado de contas a pagar
│   │   ├── receivablesContext.tsx  # Estado de contas a receber
│   │   ├── contractsContext.tsx    # Estado de contratos
│   │   └── cnabContext.tsx         # Estado de exportação CNAB
│   │
│   ├── hooks/                      # Hooks customizados
│   │   ├── useApproval.tsx         # Contexto de aprovações
│   │   ├── usePayableContext.tsx   # Contexto de payables
│   │   ├── useReceivableContext.tsx
│   │   ├── useContractsContext.tsx
│   │   ├── useBankAccounts.tsx
│   │   ├── useCreditCard.tsx
│   │   ├── useOptions.tsx          # Carregamento de opções compartilhadas
│   │   ├── useReconciliation.tsx   # Lógica de conciliação
│   │   ├── useMassApprover.tsx     # Aprovação em massa
│   │   ├── useDisclosure.tsx       # Estado de modais (open/close)
│   │   ├── useLazyQuery.tsx        # Queries sob demanda
│   │   ├── useGetAppointments.tsx  # Agendamentos
│   │   └── useDebouncedSearch.tsx  # Busca com debounce
│   │
│   ├── services/                   # Comunicação com a API backend
│   │   ├── api.ts                  # Configuração do Axios (interceptors)
│   │   ├── login.ts
│   │   ├── payables.ts
│   │   ├── receivable.ts
│   │   ├── contracts.ts
│   │   ├── bankAccount.ts
│   │   ├── bankDetails.ts
│   │   ├── budgetPlan.ts
│   │   ├── budgetPlanShared.ts
│   │   ├── costCenter.ts
│   │   ├── creditCard.ts
│   │   ├── collaborator.ts
│   │   ├── supplier.ts
│   │   ├── programs.ts
│   │   ├── reports.ts
│   │   ├── statistics.ts
│   │   ├── reconciliation.ts
│   │   ├── files.ts
│   │   ├── CalculationMemory.ts
│   │   └── exportCNAB.ts
│   │
│   ├── types/                      # Definições TypeScript
│   │   ├── next.auth.d.ts          # Extensão de tipos NextAuth
│   │   ├── Payables.ts
│   │   ├── approvals.ts
│   │   ├── bankAccount.ts
│   │   ├── budgetPlan.ts
│   │   ├── contracts.ts
│   │   ├── costCenter.ts
│   │   ├── creditCard.ts
│   │   ├── installments.ts
│   │   ├── global.ts
│   │   ├── pagination.ts
│   │   ├── files.ts
│   │   ├── categorization.ts
│   │   ├── category.ts
│   │   └── reports/
│   │
│   ├── enums/                      # Enums de negócio
│   │   ├── payables.ts
│   │   ├── receivables.ts
│   │   ├── contracts.ts
│   │   ├── budgetPlan.ts
│   │   ├── creditCard.ts
│   │   ├── reconciliation.ts
│   │   ├── installments.ts
│   │   ├── reports.ts
│   │   ├── historys.ts
│   │   └── generalReport.ts
│   │
│   ├── utils/                      # Funções utilitárias
│   │   ├── dates.tsx
│   │   ├── masks.tsx               # Máscaras CPF, CNPJ, moeda
│   │   ├── enums.tsx
│   │   ├── menu.tsx                # Estrutura de menu/navegação
│   │   ├── formatCurrency.ts
│   │   ├── budgetCalculations.ts
│   │   ├── budgetTotalCalculation.ts
│   │   ├── validateCpf.tsx
│   │   ├── validateCnpj.tsx
│   │   ├── installments.ts
│   │   ├── errorHandling.ts
│   │   ├── export-pdf.ts
│   │   ├── use-debounce.tsx
│   │   ├── verifyPassword.tsx
│   │   ├── getFileName.tsx
│   │   ├── getLetters.tsx
│   │   └── UI/
│   │
│   ├── validators/                 # Schemas Zod para formulários
│   └── styles/
│       └── globals.css             # Estilos globais + Tailwind
│
├── public/                         # Assets estáticos
├── lib/                            # Configurações de bibliotecas
├── next.config.js                  # Configuração do Next.js
├── tailwind.config.ts              # Configuração do Tailwind CSS
├── tsconfig.json                   # Configuração TypeScript
├── components.json                 # Configuração shadcn/ui
├── postcss.config.js
├── firebase.json                   # Configuração Firebase
├── Dockerfile                      # Build Docker
└── package.json
```

---

## 5. Roteamento e Páginas

### Sistema de Roteamento

O projeto usa o **Next.js App Router** (disponível desde Next.js 13). O roteamento é baseado na estrutura de diretórios em `src/app/`.

**Convenções importantes:**
- `layout.tsx` — Define o layout compartilhado para as rotas filhas
- `page.tsx` — Componente da página (rota renderizável)
- `(grupo)` — Route Groups: organizam rotas sem afetar a URL
- `[id]` — Segmentos dinâmicos

### Mapa de Rotas

#### Autenticação (público)

| URL | Arquivo | Descrição |
|-----|---------|-----------|
| `/login` | `(auth)/login/page.tsx` | Tela de login |
| `/recuperar-senha` | `(auth)/recuperar-senha/page.tsx` | Solicitação de recuperação de senha |
| `/nova-senha` | `(auth)/nova-senha/page.tsx` | Redefinição de senha com token |

#### Principal (requer autenticação)

| URL | Descrição |
|-----|-----------|
| `/` | Dashboard com KPIs financeiros |
| `/contas-pagar` | Lista de contas a pagar |
| `/contas-receber` | Lista de contas a receber |
| `/contas-bancarias` | Contas bancárias |
| `/cartao` | Cartão de crédito corporativo |
| `/contratos` | Lista de contratos |
| `/contratos/adicionar` | Cadastro de contrato |
| `/contratos/editar/[id]` | Edição de contrato |
| `/contratos/aditivo/[id]` | Aditivo contratual |
| `/colaboradores` | Lista de colaboradores |
| `/fornecedores` | Lista de fornecedores |
| `/financiadores` | Lista de financiadores |
| `/estados` | Estados parceiros |
| `/municipios` | Municípios parceiros |
| `/programas` | Programas |
| `/usuarios` | Usuários do sistema |
| `/minha-conta` | Configurações da conta |
| `/planejamento` | Planejamento orçamentário |
| `/consolidado` | Visão consolidada do orçamento |

#### Relatórios

| URL | Descrição |
|-----|-----------|
| `/geral` | Relatório geral |
| `/fluxocaixa` | Fluxo de caixa |
| `/equipe` | Relatório por equipe |
| `/realizado` | Realizado vs planejado |
| `/posicao/pagamentos` | Posição de pagamentos |
| `/posicao/recebiveis` | Posição de recebíveis |
| `/analise/pagamentos` | Análise de pagamentos |
| `/analise/recebimentos` | Análise de recebimentos |
| `/semcontratos` | Itens sem contrato |

#### Rotas Públicas Especiais

| URL | Descrição |
|-----|-----------|
| `/aprovar/acesso/[id]` | Acesso ao fluxo de aprovação (sem login) |
| `/aprovar/detalhes` | Detalhes e confirmação da aprovação |
| `/colaboradores/cadastro-completo` | Cadastro externo de colaborador |
| `/colaboradores/finalizado` | Confirmação de cadastro |
| `/consolidado-compartilhado` | Consolidado orçamentário compartilhado |
| `/plano-orcamentario-compartilhado` | Plano orçamentário compartilhado |

---

## 6. Gerenciamento de Estado

### Estratégia de Estado

O projeto combina três abordagens complementares:

#### 1. React Query (TanStack Query) — Estado do Servidor

Usado para **todos os dados que vêm da API**. Fornece caching automático, revalidação, estados de loading/error, e sincronização.

```typescript
// Exemplo de uso em um componente
import { useQuery } from '@tanstack/react-query'
import { getPayables } from '@/services/payables'

function PayablesList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['payables'],
    queryFn: getPayables,
  })

  if (isLoading) return <Loading />
  if (error) return <ErrorText />
  return <Table data={data} />
}
```

**Configuração:** `lib/` com `QueryClient` e `staleTime` configurados.

#### 2. React Context API — Estado Compartilhado de Features

Para estado que precisa ser compartilhado entre vários componentes de uma mesma feature sem passar por props:

| Context | Arquivo | Propósito |
|---------|---------|-----------|
| `ApprovalsContext` | `contexts/approvalsContext.tsx` | Estado do fluxo de aprovação |
| `PayablesContext` | `contexts/payablesContext.tsx` | Filtros e seleções de payables |
| `ReceivablesContext` | `contexts/receivablesContext.tsx` | Filtros e seleções de receivables |
| `ContractsContext` | `contexts/contractsContext.tsx` | Estado de contratos |
| `CnabContext` | `contexts/cnabContext.tsx` | Seleção para exportação CNAB |

#### 3. NextAuth Session — Estado de Autenticação

O `session` do NextAuth é acessível via `useSession()` em qualquer componente dentro do `SessionProvider`.

### Providers Globais

Todos os providers são compostos em `src/components/Providers.tsx`:

```typescript
// Providers.tsx (simplificado)
export function Providers({ children }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ApprovalsProvider>
          {children}
          <ReactQueryDevtools />
        </ApprovalsProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

---

## 7. Integração com a API

### Configuração do Axios

**Arquivo:** `src/services/api.ts`

O cliente Axios é configurado com:
- `baseURL` proveniente de `NEXT_PUBLIC_API_URL`
- **Interceptor de request**: injeta o token JWT da sessão NextAuth em todos os requests
- **Interceptor de response**: captura erros 401 e faz logout automático

```typescript
// api.ts (simplificado)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use(async (config) => {
  const session = await getSession()
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await signOut({ redirect: true, callbackUrl: '/login' })
    }
    return Promise.reject(error)
  }
)
```

### Camada de Serviços

Cada domínio tem seu arquivo de serviço em `src/services/`. Padrão:

```typescript
// services/payables.ts (exemplo de padrão)
import { api } from './api'
import type { Payable, CreatePayableDto } from '@/types/Payables'

export const getPayables = async (params?: object) => {
  const { data } = await api.get<Payable[]>('/payables', { params })
  return data
}

export const createPayable = async (dto: CreatePayableDto) => {
  const { data } = await api.post<Payable>('/payables', dto)
  return data
}

export const updatePayable = async (id: number, dto: Partial<CreatePayableDto>) => {
  const { data } = await api.patch<Payable>(`/payables/${id}`, dto)
  return data
}
```

### URLs de Backend

| Ambiente | URL |
|----------|-----|
| Desenvolvimento | `http://localhost:3333` |
| Produção | URL do Cloud Run (GCP) |

---

## 8. Autenticação

### Biblioteca

**NextAuth** v4.23.1 com provider de **Credentials** (email + senha).

### Fluxo de Autenticação

```
1. Usuário preenche formulário em /login

2. NextAuth chama authorize() com credenciais

3. authorize() chama o backend:
   POST /auth/login
   { email, password }

4. Backend retorna { user, token }

5. NextAuth armazena em JWT de sessão:
   { id, name, email, cpf, telephone, image, token, canMassApproval }

6. SessionProvider disponibiliza session via useSession()

7. api.ts injeta token em todos os requests subsequentes
```

### Configuração

**Arquivo:** `src/app/api/auth/[...nextauth]/route.ts`

```
- Provider: Credentials (email/password)
- Estratégia de sessão: JWT
- Duração da sessão: 8 horas
- Redirecionamento em não-autenticado: /login
- Callback de redirect: /login (para rotas protegidas)
```

### Dados da Sessão

O tipo da sessão é estendido em `src/types/next.auth.d.ts`:

```typescript
interface Session {
  user: {
    id: number
    name: string
    email: string
    cpf: string
    telephone: string
    image: string
    token: string             // JWT para o backend
    canMassApproval: boolean  // Permissão de aprovação em massa
  }
}
```

### Rotas Protegidas vs Públicas

**Protegidas** (requerem autenticação):
- Todas as rotas dentro de `(main)/`

**Públicas** (sem autenticação):
- `/login`, `/recuperar-senha`, `/nova-senha`
- `/aprovar/acesso/[id]`, `/aprovar/detalhes`
- `/colaboradores/cadastro-completo`, `/colaboradores/finalizado`
- `/consolidado-compartilhado`, `/plano-orcamentario-compartilhado`

---

## 9. Sistema de Componentes e UI

### Stack de UI

O projeto usa três camadas de componentes:

#### 1. shadcn/ui (`src/components/ui/`)
Componentes base gerados com a CLI do shadcn/ui. São primitivos Radix UI com estilização Tailwind. Incluem: Button, Card, Input, Select, Dialog, Tabs, Alert, Avatar, etc.

**Configuração:** `components.json` na raiz do projeto.

#### 2. Material UI (MUI)
Usado para componentes mais complexos, especialmente `@mui/x-date-pickers` para seletores de data.

#### 3. Componentes de Domínio (`src/components/[feature]/`)
Componentes específicos de cada feature do sistema, compostos a partir dos componentes base.

### Padrão de Componentes

```typescript
// Padrão típico de componente de domínio
interface PayablesListProps {
  contractId?: number
}

export function PayablesList({ contractId }: PayablesListProps) {
  const { data: payables, isLoading } = useQuery({
    queryKey: ['payables', contractId],
    queryFn: () => getPayables({ contractId }),
  })

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? <LoadingSpinner /> : (
        payables?.map(payable => (
          <PayableCard key={payable.id} payable={payable} />
        ))
      )}
    </div>
  )
}
```

### Layout Principal

O layout autenticado (`(main)/layout.tsx`) inclui:
- **Sidebar** com navegação por módulos
- **Header** com informações do usuário
- **Área de conteúdo** com as páginas

### Estrutura do Menu

Definida em `src/utils/menu.tsx`. Cada item do menu mapeia para uma rota da aplicação e pode ter sub-itens.

---

## 10. Formulários e Validação

### React Hook Form + Zod

Todos os formulários usam **React Hook Form** com resolvers **Zod** para validação:

```typescript
// Exemplo de formulário com validação
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  valueInCents: z.number().positive('Valor deve ser positivo'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
})

type FormData = z.infer<typeof schema>

function CreatePayableForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await createPayable(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('description')} />
      {errors.description && <ErrorText>{errors.description.message}</ErrorText>}
      {/* ... */}
    </form>
  )
}
```

### Schemas de Validação

Localizados em `src/validators/`. Um arquivo por domínio/funcionalidade.

### Máscaras de Input

`src/utils/masks.tsx` — Máscaras para campos comuns:
- CPF: `000.000.000-00`
- CNPJ: `00.000.000/0000-00`
- Moeda: `R$ 0.000,00`
- Telefone: `(00) 00000-0000`

---

## 11. Tipos TypeScript

O TypeScript está configurado com **strict: false** e **noImplicitAny: false**, o que significa que o compilador não é tão rigoroso quanto o ideal. Ainda assim, os tipos principais estão definidos em `src/types/`:

### Path Aliases

Configurados em `tsconfig.json`:
- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@public/*` → `public/*`
- `@utils/*` → `src/utils/*`

### Tipos Principais por Domínio

| Arquivo | Tipos |
|---------|-------|
| `Payables.ts` | `Payable`, `CreatePayableDto`, `PayableStatus` |
| `approvals.ts` | `Approval`, `ApprovalStatus` |
| `bankAccount.ts` | `BankAccount`, `BankStatement` |
| `budgetPlan.ts` | `BudgetPlan`, `Budget`, `BudgetResult` |
| `contracts.ts` | `Contract`, `ContractPeriod`, `ContractStatus` |
| `costCenter.ts` | `CostCenter` |
| `creditCard.ts` | `CreditCard`, `CardMovimentation` |
| `installments.ts` | `Installment`, `InstallmentStatus` |
| `pagination.ts` | `PaginatedResponse<T>` |
| `global.ts` | Tipos compartilhados gerais |

---

## 12. Enums e Constantes

### Enums de Status

**Payables** (`src/enums/payables.ts`):
```
PENDING → APPROVING → APPROVED → PAID → CONCLUDED
                              ↘ REJECTED
                  (também: DUE)
```

**Receivables** (`src/enums/receivables.ts`):
```
PENDING → APPROVED → RECEIVED → CONCLUDED
(também: DUE)
```

**Contracts** (`src/enums/contracts.ts`):
```
PENDING → SIGNED → ONGOING → FINISHED
```

**Installments** (`src/enums/installments.ts`):
```
PENDING → PAID
(também: CANCELLED, OVERDUE)
```

**Reconciliation** (`src/enums/reconciliation.ts`):
Status da conciliação bancária.

---

## 13. Utilitários

### Formatação de Moeda

`src/utils/formatCurrency.ts` — Formata números em Real brasileiro:
```typescript
formatCurrency(123456) // → "R$ 1.234,56"
// Atenção: o backend envia valores em CENTAVOS
```

### Manipulação de Datas

`src/utils/dates.tsx` — Usa `date-fns` para formatação e cálculos de datas.

### Cálculos Orçamentários

`src/utils/budgetCalculations.ts` e `budgetTotalCalculation.ts` — Lógica de cálculo para o módulo de planejamento orçamentário.

### Validação de Documentos

- `validateCpf.tsx` — Validação de CPF brasileiro
- `validateCnpj.tsx` — Validação de CNPJ

### Exportação PDF

`src/utils/export-pdf.ts` — Utilitários para geração de PDF no cliente usando jsPDF.

### Hook de Debounce

`src/utils/use-debounce.tsx` — Para campos de busca com delay:
```typescript
const debouncedSearch = useDebounce(searchValue, 500)
```

---

## 14. Estilização e Tema

### Tailwind CSS

**Arquivo:** `tailwind.config.ts`

Paleta de cores customizada sob `erp.*`:

| Token | Cor | Uso |
|-------|-----|-----|
| `erp.primary` | `#32C6F4` (ciano) | Ações primárias, destaques |
| `erp.secondary` | `#FAA21A` (laranja) | Ações secundárias |
| `erp.success` | `#64BC47` (verde) | Sucesso, aprovado, pago |
| `erp.danger` | `#FF5353` (vermelho) | Erro, rejeitado, vencido |
| `erp.warning` | `#F5D35E` (amarelo) | Alertas, pendente |

**Classes customizadas:**
- `.reconciled-border` — Borda para itens conciliados
- `.future-border` — Borda para itens futuros

### Dark Mode

Configurado com `darkMode: 'class'` — ativado via classe CSS no elemento raiz.

### CSS-in-JS (Emotion)

Usado pelo MUI internamente. Em alguns componentes, `@emotion/styled` pode ser usado para estilos dinâmicos complexos.

### Globals

`src/styles/globals.css` — Importa o Tailwind e define variáveis CSS para cores semânticas:
- `--border`, `--input`, `--ring`
- `--background`, `--foreground`
- `--primary`, `--secondary`, `--muted`
- `--radius` para bordas arredondadas

---

## 15. Setup do Ambiente de Desenvolvimento

### Pré-requisitos

- **Node.js** 20.x (use `.nvmrc` para versão correta via `nvm use`)
- **Yarn** (gerenciador de pacotes)
- **Backend rodando** em `http://localhost:3003`

### Passo a Passo

#### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd erp-financeiro-frontend
```

#### 2. Use a versão correta do Node

```bash
nvm use  # Lê o .nvmrc e usa Node 20
```

#### 3. Instale as dependências

```bash
yarn install
```

#### 4. Configure as variáveis de ambiente

```bash
cp .env.example .env.development.local
# Edite com suas configurações locais
```

**Conteúdo mínimo do `.env.development.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3003
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=qualquer_string_secreta_para_dev
NODE_ENV=development
```

#### 5. Certifique-se que o backend está rodando

O frontend depende do backend para funcionar. Siga o setup do backend em `erp-financeiro-backend/DOCUMENTACAO_TECNICA.md`.

#### 6. Inicie o servidor de desenvolvimento

```bash
yarn dev
```

A aplicação estará disponível em: `http://localhost:3000`

### Scripts Disponíveis

```bash
yarn dev      # Servidor de desenvolvimento com hot-reload
yarn build    # Build de produção
yarn start    # Inicia o servidor de produção (após build)
yarn lint     # ESLint + verificação de tipos
```

### Configuração do Editor (VS Code)

Instale as extensões recomendadas:
- **ESLint** — Feedback em tempo real
- **Prettier** — Formatação automática
- **Tailwind CSS IntelliSense** — Autocomplete para classes Tailwind
- **TypeScript Vue Plugin** — Suporte adicional TypeScript

---

## 16. Build e Deploy

### Build de Produção (Docker)

**Arquivo:** `Dockerfile`

Build multi-estágio:

```
Stage 1 (builder):     node:20
  └── Copia package.json, yarn.lock
  └── Instala dependências
  └── Copia código fonte
  └── yarn build
  └── Gera .next/standalone

Stage 2 (runner):      node:20-alpine
  └── Copia .next/standalone/
  └── Copia .next/static/
  └── Copia public/
  └── EXPOSE 3000
  └── CMD: node server.js
```

**Build local:**
```bash
docker build \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_PUBLIC_API_URL=https://sua-api.com \
  --build-arg NEXTAUTH_SECRET=secret_seguro \
  --build-arg NEXTAUTH_URL=https://seu-frontend.com \
  -t erp-financeiro-frontend .

docker run -p 3000:3000 erp-financeiro-frontend
```

### Deploy Firebase

**Arquivo:** `firebase.json`

O frontend pode ser deployado como Firebase Cloud Function:

```json
{
  "functions": {
    "runtime": "nodejs20",
    "memory": "256MB",
    "minInstances": 0,
    "maxInstances": 10
  }
}
```

**Segredos necessários:** `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
**Região:** `us-central1`

### Output Mode Standalone

O `next.config.js` define `output: 'standalone'`, que gera um servidor Node.js self-contained em `.next/standalone/`. Ideal para deployment em containers.

### Variáveis de Build

As variáveis `NEXT_PUBLIC_*` são incorporadas no bundle em build time. Qualquer alteração nelas requer um novo build.

---

## 17. Variáveis de Ambiente

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `NEXT_PUBLIC_API_URL` | Pública (client) | URL base da API backend |
| `NEXTAUTH_URL` | Privada (server) | URL do frontend (para callbacks NextAuth) |
| `NEXTAUTH_SECRET` | Privada (server) | Segredo para assinar tokens de sessão |
| `NODE_ENV` | Privada | `development` ou `production` |

**Atenção:** Variáveis `NEXT_PUBLIC_*` são expostas no bundle do cliente (browser). **Nunca coloque segredos nelas.**

---

## 18. Padrões e Convenções

### Estrutura de Componentes

Cada componente vive em sua própria pasta com `index.tsx`:
```
components/
└── payables/
    └── PayableCard/
        └── index.tsx
```

### Nomenclatura

- **Componentes:** PascalCase (`PayableCard`)
- **Hooks:** camelCase com prefixo `use` (`usePayableContext`)
- **Serviços:** camelCase (`getPayables`, `createPayable`)
- **Arquivos:** kebab-case ou PascalCase (ambos usados)

### Código TypeScript

TypeScript com `strict: false`. O projeto não usa `any` explicitamente, mas o compilador não obriga tipagem rigorosa.

### Formatação

Prettier configurado em `.prettierrc`:
- Single quotes
- Sem ponto e vírgula
- 100 caracteres por linha
- Trailing commas

### ESLint

Configurado com o preset Rocketseat (`@rocketseat/eslint-config/next`).

### Valores Monetários

O backend envia valores em **centavos (inteiros)**. O frontend precisa dividir por 100 para exibição e multiplicar por 100 ao enviar:

```typescript
// Exibição
formatCurrency(payable.valueInCents) // 123456 → "R$ 1.234,56"

// Envio para a API
const valueInCents = Math.round(parseFloat(formValue.replace(',', '.')) * 100)
```

---

## 19. Fluxos de Tela Principais

### 19.1 Login

```
/login
  ├── Usuário preenche email e senha
  ├── NextAuth chama POST /auth/login no backend
  ├── Backend retorna { user, token }
  ├── NextAuth cria sessão JWT
  └── Redirect para /  (dashboard)
```

### 19.2 Criação de Conta a Pagar

```
/contas-pagar
  ├── Clica em "Nova Conta a Pagar"
  ├── Modal/formulário de criação abre
  │   ├── Preenche: descrição, valor, vencimento, fornecedor, etc.
  │   └── Validação com Zod
  ├── POST /payables
  ├── Backend cria payable com status PENDING ou APPROVING
  │   (se tiver aprovadores configurados → status APPROVING)
  │   (e-mails enviados aos aprovadores)
  └── Lista atualizada via React Query invalidate
```

### 19.3 Fluxo de Aprovação

```
Aprovador recebe e-mail com link especial

/aprovar/acesso/[payableId]
  ├── Aprovador insere código identificador do e-mail
  ├── Backend autentica o código
  └── Redirect para /aprovar/detalhes

/aprovar/detalhes
  ├── Exibe detalhes do payable
  ├── Aprovador clica "Aprovar" ou "Rejeitar"
  ├── PATCH /payables/approve ou /payables/reject
  └── Backend atualiza status
      ├── Todos aprovaram → status APPROVED
      └── Algum rejeitou → status REJECTED
```

### 19.4 Exportação CNAB

```
/contas-pagar
  ├── Usuário seleciona payables aprovados
  ├── Clica em "Exportar CNAB"
  ├── CnabContext armazena seleção
  ├── POST /payables/export-cnab com IDs selecionados
  ├── Backend gera arquivo CNAB 240
  ├── Backend envia via SFTP para o Bradesco
  └── Download do arquivo para o usuário
```

### 19.5 Conciliação Bancária

```
/contas-bancarias
  ├── Sistema busca transações via API Bradesco (automático a cada hora)
  ├── Usuário acessa conciliação
  ├── Lista de transações bancárias exibida
  ├── Usuário associa transação a payable/receivable existente
  ├── POST /bank-reconciliation
  ├── Backend emite evento CheckToFinishPayable/Receivable
  └── Status do payable/receivable → CONCLUDED
```

### 19.6 Planejamento Orçamentário

```
/planejamento
  ├── Planos Orçamentários listados
  ├── Usuário seleciona plano ou cria novo
  ├── Dentro do plano:
  │   ├── Centros de custo e categorias
  │   ├── Distribuição de valores por mês
  │   └── Totais calculados automaticamente
  ├── Compartilhamento: gera link público com Basic Auth
  └── /plano-orcamentario-compartilhado (acesso externo)
```

---

