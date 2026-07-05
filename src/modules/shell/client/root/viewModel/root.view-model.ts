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
  // Plano Orçamentário → Planejamento — a page tem seu próprio PageHeader (padrão Colaboradores); isto
  // só alimenta o document.title (senão cairia no fallback "ERP Bem Comum").
  '/planejamento': 'Planejamento',
  // Plano Orçamentário → Consolidado ABC — mesma lógica (PageHeader próprio; alimenta o document.title).
  '/consolidado': 'Consolidado ABC',
  // Financeiro — o título é desenhado pelo PageHeader do shell (padrão Contratos, Nunito); sem isto
  // cairia no fallback "ERP Bem Comum".
  '/financeiro/contas-a-pagar': 'Contas a Pagar',
  '/financeiro/conciliacao': 'Contas Bancárias',
  '/login': 'Login',
}

// Legendas (subtítulo) das telas cujo TÍTULO é desenhado pelo shell (padrão Colaboradores: título + legenda).
// Só as telas com header do shell (showPageHeader) precisam — as demais têm legenda própria na page.
const PAGE_SUBTITLES: Readonly<Record<string, string>> = {
  // /contratos NÃO entra aqui: a lista de Contratos desenha o PRÓPRIO cabeçalho (título + legenda BEGE,
  // identidade institucional do grid) — o shell não renderiza header para /contratos (showPageHeader false).
  '/financeiro/contas-a-pagar': 'Gestão de documentos e pagamentos do programa',
  '/financeiro/conciliacao': 'Contas cedentes e conciliação bancária',
}

// match por SEGMENTO (igual, ou prefixo seguido de '/') — nunca substring solta.
const isPrefixPath = (path: string, route: string): boolean => path === route || path.startsWith(route + '/')

export const rootViewModel = {
  resolvePageTitle: (path: string): string => {
    // Conciliação: grid (entrada) = "Contas Bancárias"; workspace de uma conta = "Conciliação bancária".
    if (path.startsWith('/financeiro/conciliacao/')) return 'Conciliação bancária'
    for (const [route, title] of Object.entries(PAGE_TITLES)) {
      if (isPrefixPath(path, route)) return title
    }
    return 'ERP Bem Comum'
  },

  // Legenda do header do shell (undefined = sem legenda). Espelha o padrão do grid de Colaboradores.
  resolvePageSubtitle: (path: string): string | undefined => {
    for (const [route, subtitle] of Object.entries(PAGE_SUBTITLES)) {
      if (isPrefixPath(path, route)) return subtitle
    }
    return undefined
  },

  isItemActive: (activePath: string, to: string): boolean => isPrefixPath(activePath, to),

  sidebarWidth: (collapsed: boolean): number =>
    collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,

  // Não renderiza o h1 do shell em /parceiros/*, /usuarios/* etc. (cada tela tem seu próprio header) nem em
  // /contratos (a LISTA agora desenha o próprio cabeçalho com legenda BEGE — identidade do grid) nem nas
  // sub-rotas /contratos/* (criar/detalhe/editar/aditivo). Evita título duplicado.
  showPageHeader: (path: string): boolean =>
    !isPrefixPath(path, '/contratos') &&
    !isPrefixPath(path, '/parceiros') &&
    !isPrefixPath(path, '/usuarios') &&
    !isPrefixPath(path, '/minha-conta') &&
    !isPrefixPath(path, '/programas') &&
    // /planejamento tem PageHeader próprio (padrão Colaboradores) — evita título duplicado.
    !isPrefixPath(path, '/planejamento') &&
    // /consolidado (Consolidado ABC) tem PageHeader próprio — mesma lógica de /planejamento.
    !isPrefixPath(path, '/consolidado') &&
    // Dashboard (043): tela full-bleed com fundo de canvas próprio e sem título (pedido da P.O.) —
    // o h1 do shell criaria título + margem branca. O document.title continua vindo de PAGE_TITLES.
    !isPrefixPath(path, '/dashboard') &&
    // Workspace de conciliação (uma conta) já tem o hero da conta como header — sem h1 do shell.
    // O grid /financeiro/conciliacao (sem barra final) mantém o h1 "Contas Bancárias".
    !path.startsWith('/financeiro/conciliacao/') &&
    // Lançar Documento tem topbar própria (modal-like, ←/✕) — o grid mantém o h1 do shell.
    !isPrefixPath(path, '/financeiro/contas-a-pagar/lancar'),

  // Conteúdo "full-bleed" (sem o padding do shell): o workspace de conciliação espelha o mock — hero, abas,
  // corpo e footer encostam nas bordas da área de conteúdo (igual incluir contrato). O Dashboard (043)
  // também é full-bleed: o canvas bege preenche toda a área de conteúdo (sem a margem branca do shell).
  fullBleedContent: (path: string): boolean =>
    path.startsWith('/financeiro/conciliacao/') ||
    isPrefixPath(path, '/dashboard') ||
    // Parceiros com a identidade "brand" cobrindo TODA a subárvore — lista (grid) + criar + detalhe
    // (formulário "brand" full-bleed com página cinza + barra de ações fixa).
    isPrefixPath(path, '/parceiros/colaboradores') ||
    isPrefixPath(path, '/parceiros/fornecedores') ||
    isPrefixPath(path, '/parceiros/financiadores') ||
    isPrefixPath(path, '/parceiros/atos') ||
    // Estados e Municípios: cards "brand" sobre canvas azul-claro, ocupando toda a largura (mock).
    isPrefixPath(path, '/parceiros/territorios') ||
    // Programas e Usuários: identidade "brand" cobrindo TODA a subárvore (lista + criar + detalhe).
    isPrefixPath(path, '/programas') ||
    isPrefixPath(path, '/usuarios') ||
    // Planejamento: toda a subárvore "brand" full-bleed (lista + detalhe + orçamento).
    isPrefixPath(path, '/planejamento') ||
    // Consolidado ABC: tela "brand" full-bleed (canvas cinza ocupando a largura).
    isPrefixPath(path, '/consolidado') ||
    // Minha Conta: cartão de perfil no shell "brand" (página cinza + barra de ações fixa).
    isPrefixPath(path, '/minha-conta') ||
    // Grids de Contratos, Contas a Pagar e Contas Bancárias (LISTA): full-bleed no padrão da marca (recuo
    // de 28px, igual aos demais grids). Só a rota EXATA da lista — as sub-rotas (criar/detalhe/lançar e o
    // workspace de conciliação, já coberto acima) mantêm o próprio layout.
    path === '/contratos' ||
    path === '/financeiro/contas-a-pagar' ||
    path === '/financeiro/conciliacao',

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
