/**
 * Menu de navegação do shell — DADO PURO (sem JSX/React), para a ViewModel (agnóstica) poder importá-lo
 * e filtrá-lo por permissão. O ícone é um `iconId` (string); a SideBar mapeia id → SVG. `requiredPermission`
 * é opcional: itens sem ele são sempre visíveis. (ADR-0012)
 */

export type MenuIconId =
  | 'home'
  | 'heart-handshake'
  | 'users'
  | 'target'
  | 'calendar-check'
  | 'calendar-days'
  | 'trending-up'
  | 'wallet'

export interface MenuSubItem {
  readonly label: string
  readonly to: string
  /** Permissão RBAC exigida (slug do core-api). Ausente = sempre visível. TODO(produto): mapear. */
  readonly requiredPermission?: string
}

export interface MenuSection {
  readonly label: string
  readonly iconId: MenuIconId
  readonly to?: string
  readonly requiredPermission?: string
  readonly subItems?: readonly MenuSubItem[]
}

export const MENU: readonly MenuSection[] = [
  { label: 'Dashboard', iconId: 'home', to: '/dashboard' },
  {
    label: 'Gestão de Parceiros',
    iconId: 'heart-handshake',
    // Slugs do catálogo PARTNER_PERMISSIONS (módulo partners). Mantidos como literais — `shell` não
    // importa `partners` (boundaries). RBAC do menu por subitem (features 011/012).
    subItems: [
      { label: 'Colaboradores', to: '/parceiros/colaboradores', requiredPermission: 'collaborator:read' },
      { label: 'Fornecedores', to: '/parceiros/fornecedores', requiredPermission: 'supplier:read' },
      { label: 'Financiadores', to: '/parceiros/financiadores', requiredPermission: 'financier:read' },
      // ACT espelha o Colaborador no RBAC do core-api → governado por `collaborator:read` (013).
      { label: 'ACTs', to: '/parceiros/atos', requiredPermission: 'collaborator:read' },
      { label: 'Estados e Municípios', to: '/parceiros/territorios', requiredPermission: 'geography:read' },
    ],
  },
  {
    label: 'Gestão de Programas',
    iconId: 'target',
    // Subitem sem `requiredPermission` (mesmo critério de Contratos/Usuários): o acesso é cobrado pelo
    // backend (program:read → 403 → tag de erro). TODO(backend): gatear por `program:read` quando o seed
    // conceder a permissão ao admin.
    subItems: [{ label: 'Programas', to: '/programas' }],
  },
  {
    label: 'Gestão de Contratos',
    iconId: 'calendar-check',
    subItems: [{ label: 'Contratos', to: '/contratos' }],
  },
  {
    label: 'Plano Orçamentário',
    iconId: 'calendar-days',
    // LINK DIRETO por ora (1 clique abre a lista de Planejamento). O módulo `budget-plans` ainda não
    // existe no core-api (#113); o acesso será cobrado pelo backend quando o endpoint nascer. Quando o
    // Consolidado ABC (/consolidado) entrar (fatia futura), isto vira accordion com 2 subitens.
    // `shell` não importa `budget-plans` (boundaries) — o `to` é literal.
    to: '/planejamento',
  },
  { label: 'Relatórios', iconId: 'trending-up' },
  {
    label: 'Financeiro',
    iconId: 'wallet',
    // Contas a Pagar (slug do catálogo do core-api `fiscal-document:read`). Mesmo padrão de Parceiros:
    // subitem gated por permissão (a seção some se ficar sem subitens visíveis). Contas a Receber e
    // Conciliação entram quando os submódulos existirem.
    subItems: [
      {
        label: 'Contas a Pagar',
        to: '/financeiro/contas-a-pagar',
        requiredPermission: 'fiscal-document:read',
      },
      {
        label: 'Conciliação',
        to: '/financeiro/conciliacao',
        requiredPermission: 'reconciliation:read',
      },
    ],
  },
  {
    label: 'Gestão de Usuários',
    iconId: 'users',
    // Subitem SEM `requiredPermission` (espelha "Gestão de Contratos → Contratos"): a visibilidade do
    // menu não é gated por RBAC aqui — quem controla acesso é o backend (403 → tag de erro no grid) e a
    // rota protegida. Gating de menu por `user:list` foi removido porque o seed do admin ainda não
    // concede `user:*` (gap de backend), o que escondia a seção inteira (accordion sem subitem some).
    // TODO(backend): ao conceder `user:list` no seed, podemos reintroduzir o gate se quisermos.
    subItems: [
      { label: 'Usuários', to: '/usuarios' },
      // Minha Conta = autosserviço (/api/v1/me): qualquer usuário autenticado acessa → sem RBAC.
      { label: 'Minha Conta', to: '/minha-conta' },
    ],
  },
] as const
