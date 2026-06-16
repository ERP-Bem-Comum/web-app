/**
 * rootViewModel — núcleo PURO/agnóstico da TELA-raiz (ADR-0009/0012). ZERO React (o lint barra
 * `react`/`@tanstack/react-*` em `*.view-model.ts`). Reducer de UI-state (collapsed) da PAGE inteira +
 * derivações puras (título por rota, item ativo, largura, menu filtrado por permissão). Testável em node:test.
 */
import type { MenuSection } from '#modules/shell/client/data/menu/shell-menu.config.ts'

// Reexporta os tipos do menu pela camada que a UI consome (a view não importa `data/` direto — §XI MVVM).
export type {
  MenuSection,
  MenuSubItem,
  MenuIconId,
} from '#modules/shell/client/data/menu/shell-menu.config.ts'

// ── UI-state (page-wide) + reducer puro (o binding aplica via useReducer) ──
export type RootUiState = Readonly<{ collapsed: boolean }>

export type RootUiAction =
  | { readonly type: 'toggleSidebar' }
  | { readonly type: 'collapseSidebar' }
  | { readonly type: 'navigated' } // recolhe ao trocar de rota

export const rootInitialUiState: RootUiState = { collapsed: false }

export const rootUiReducer = (state: RootUiState, action: RootUiAction): RootUiState => {
  switch (action.type) {
    case 'toggleSidebar':
      return { collapsed: !state.collapsed }
    case 'collapseSidebar':
    case 'navigated':
      return state.collapsed ? state : { collapsed: true }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

export const SIDEBAR_WIDTH_EXPANDED = 224
export const SIDEBAR_WIDTH_COLLAPSED = 64

const PAGE_TITLES: Readonly<Record<string, string>> = {
  '/dashboard': 'Dashboard',
  '/contratos': 'Contratos',
  // Submódulos de Gestão de Parceiros — alimentam o document.title (a tela já mostra o título via PageHeader).
  '/parceiros/colaboradores': 'Colaboradores',
  '/parceiros/fornecedores': 'Fornecedores',
  '/parceiros/financiadores': 'Financiadores',
  '/parceiros/atos': 'ACTs',
  '/parceiros/territorios': 'Estados e Municípios',
  // Gestão de Usuários — alimenta o document.title (a tela já mostra o título via PageHeader).
  '/usuarios': 'Usuários',
  '/minha-conta': 'Minha Conta',
  '/programas': 'Programas',
  // Financeiro — o título é desenhado pelo PageHeader do shell (padrão Contratos, Nunito); sem isto
  // cairia no fallback "ERP Bem Comum".
  '/financeiro/contas-a-pagar': 'Contas a Pagar',
  '/login': 'Login',
}

// match por SEGMENTO (igual, ou prefixo seguido de '/') — nunca substring solta.
const isPrefixPath = (path: string, route: string): boolean => path === route || path.startsWith(route + '/')

export const rootViewModel = {
  resolvePageTitle: (path: string): string => {
    for (const [route, title] of Object.entries(PAGE_TITLES)) {
      if (isPrefixPath(path, route)) return title
    }
    return 'ERP Bem Comum'
  },

  isItemActive: (activePath: string, to: string): boolean => isPrefixPath(activePath, to),

  sidebarWidth: (collapsed: boolean): number =>
    collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,

  // Não renderiza o h1 do shell em /parceiros/* e /usuarios/* (cada tela já tem seu PageHeader) nem em
  // qualquer sub-rota de /contratos/ (criar, detalhe, editar, aditivo — cada tela tem seu próprio header).
  // A lista /contratos mantém o h1. Evita o título duplicado e libera o espaço vertical da tela.
  showPageHeader: (path: string): boolean =>
    !path.startsWith('/contratos/') &&
    !isPrefixPath(path, '/parceiros') &&
    !isPrefixPath(path, '/usuarios') &&
    !isPrefixPath(path, '/minha-conta') &&
    !isPrefixPath(path, '/programas'),

  /**
   * RBAC: remove seções/subitens cujo `requiredPermission` não está em `permissions`. Uma seção de
   * accordion que fica SEM subitens após o filtro também some (não há o que abrir). `menu` não é mutado.
   */
  visibleMenu: (menu: readonly MenuSection[], permissions: readonly string[]): readonly MenuSection[] => {
    const allowed = (required: string | undefined): boolean =>
      required === undefined || permissions.includes(required)
    return menu
      .filter((section) => allowed(section.requiredPermission))
      .map((section) =>
        section.subItems === undefined
          ? section
          : { ...section, subItems: section.subItems.filter((sub) => allowed(sub.requiredPermission)) },
      )
      .filter((section) => {
        if (section.to !== undefined) return true // link direto sempre fica
        if (section.subItems === undefined) return true // item simples (sem accordion) fica
        return section.subItems.length > 0 // accordion só fica se sobrou subitem
      })
  },
} as const
