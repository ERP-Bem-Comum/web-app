/**
 * rootViewModel — unidades PURAS (node:test). A tela-raiz tem lógica testável sem React (ADR-0012):
 * título por rota, item ativo, largura, reducer de collapsed e o filtro de menu por permissão (RBAC).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  rootViewModel,
  rootUiReducer,
  rootInitialUiState,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
} from '#modules/shell/client/root/viewModel/root.view-model.ts'
import { MENU } from '#modules/shell/client/data/menu/shell-menu.config.ts'
import type { MenuSection } from '#modules/shell/client/data/menu/shell-menu.config.ts'

describe('rootViewModel.resolvePageTitle', () => {
  it('casa rota exata e prefixo de segmento', () => {
    assert.strictEqual(rootViewModel.resolvePageTitle('/dashboard'), 'Dashboard')
    assert.strictEqual(rootViewModel.resolvePageTitle('/contratos'), 'Contratos')
    assert.strictEqual(rootViewModel.resolvePageTitle('/contratos/criar'), 'Contratos')
    assert.strictEqual(rootViewModel.resolvePageTitle('/contratos/123/editar'), 'Contratos')
    // Submódulos de parceiros (alimentam o document.title)
    assert.strictEqual(rootViewModel.resolvePageTitle('/parceiros/colaboradores'), 'Colaboradores')
    assert.strictEqual(rootViewModel.resolvePageTitle('/parceiros/colaboradores/adicionar'), 'Colaboradores')
    assert.strictEqual(rootViewModel.resolvePageTitle('/parceiros/fornecedores'), 'Fornecedores')
    assert.strictEqual(rootViewModel.resolvePageTitle('/parceiros/territorios'), 'Estados e Municípios')
    // Gestão de Usuários (alimenta o document.title; sub-rotas casam pelo prefixo)
    assert.strictEqual(rootViewModel.resolvePageTitle('/usuarios'), 'Usuários')
    assert.strictEqual(rootViewModel.resolvePageTitle('/usuarios/criar'), 'Usuários')
    assert.strictEqual(rootViewModel.resolvePageTitle('/minha-conta'), 'Minha Conta')
    assert.strictEqual(rootViewModel.resolvePageTitle('/programas'), 'Programas')
    assert.strictEqual(rootViewModel.resolvePageTitle('/programas/criar'), 'Programas')
    assert.strictEqual(rootViewModel.resolvePageTitle('/financeiro/contas-a-pagar'), 'Contas a Pagar')
  })
  it('cai no fallback para rota desconhecida e não casa substring solta', () => {
    assert.strictEqual(rootViewModel.resolvePageTitle('/desconhecida'), 'ERP Bem Comum')
    assert.strictEqual(rootViewModel.resolvePageTitle('/contratosX'), 'ERP Bem Comum')
  })
})

describe('rootViewModel.isItemActive', () => {
  it('ativo no match exato e no prefixo de segmento; inativo caso contrário', () => {
    assert.strictEqual(rootViewModel.isItemActive('/contratos', '/contratos'), true)
    assert.strictEqual(rootViewModel.isItemActive('/contratos/criar', '/contratos'), true)
    assert.strictEqual(rootViewModel.isItemActive('/contratos', '/dashboard'), false)
    assert.strictEqual(rootViewModel.isItemActive('/contratosX', '/contratos'), false)
  })
})

describe('rootViewModel.sidebarWidth / showPageHeader', () => {
  it('largura por estado', () => {
    assert.strictEqual(rootViewModel.sidebarWidth(false), SIDEBAR_WIDTH_EXPANDED)
    assert.strictEqual(rootViewModel.sidebarWidth(true), SIDEBAR_WIDTH_COLLAPSED)
  })
  it('esconde o header do shell em /contratos/criar e em /parceiros/* (que têm header próprio)', () => {
    assert.strictEqual(rootViewModel.showPageHeader('/contratos/criar'), false)
    assert.strictEqual(rootViewModel.showPageHeader('/contratos'), true)
    assert.strictEqual(rootViewModel.showPageHeader('/parceiros/fornecedores'), false)
    assert.strictEqual(rootViewModel.showPageHeader('/parceiros/colaboradores'), false)
    // Usuários (lista + sub-rotas) têm PageHeader próprio → shell não renderiza h1 (igual a parceiros)
    assert.strictEqual(rootViewModel.showPageHeader('/usuarios'), false)
    assert.strictEqual(rootViewModel.showPageHeader('/usuarios/criar'), false)
    assert.strictEqual(rootViewModel.showPageHeader('/minha-conta'), false)
    assert.strictEqual(rootViewModel.showPageHeader('/programas'), false)
    assert.strictEqual(rootViewModel.showPageHeader('/programas/criar'), false)
    // Dashboard (043): full-bleed com canvas próprio e SEM título (pedido da P.O.) → shell não renderiza h1.
    assert.strictEqual(rootViewModel.showPageHeader('/dashboard'), false)
    // Financeiro: o grid mantém o h1 do shell; o Lançar Documento tem topbar própria.
    assert.strictEqual(rootViewModel.showPageHeader('/financeiro/contas-a-pagar'), true)
    assert.strictEqual(rootViewModel.showPageHeader('/financeiro/contas-a-pagar/lancar'), false)
    // Conciliação: o grid (Contas Bancárias) mantém o h1; o workspace de uma conta usa o hero próprio.
    assert.strictEqual(rootViewModel.showPageHeader('/financeiro/conciliacao'), true)
    assert.strictEqual(rootViewModel.showPageHeader('/financeiro/conciliacao/acc-123'), false)
  })

  it('fullBleedContent: workspace de conciliação e Dashboard são full-bleed (o grid de conciliação mantém o padding)', () => {
    assert.strictEqual(rootViewModel.fullBleedContent('/financeiro/conciliacao/acc-123'), true)
    assert.strictEqual(rootViewModel.fullBleedContent('/financeiro/conciliacao'), false)
    // Dashboard (043): canvas bege preenche toda a área de conteúdo (sem a margem branca do shell).
    assert.strictEqual(rootViewModel.fullBleedContent('/dashboard'), true)
  })
})

describe('rootUiReducer (collapsed)', () => {
  it('toggle alterna; collapse/navigated forçam true (idempotente)', () => {
    assert.strictEqual(rootInitialUiState.collapsed, false)
    const t1 = rootUiReducer(rootInitialUiState, { type: 'toggleSidebar' })
    assert.strictEqual(t1.collapsed, true)
    assert.strictEqual(rootUiReducer(t1, { type: 'toggleSidebar' }).collapsed, false)
    assert.strictEqual(rootUiReducer(rootInitialUiState, { type: 'collapseSidebar' }).collapsed, true)
    assert.strictEqual(rootUiReducer(rootInitialUiState, { type: 'navigated' }).collapsed, true)
  })
  it('não muta o estado recebido', () => {
    const before = { ...rootInitialUiState }
    rootUiReducer(rootInitialUiState, { type: 'toggleSidebar' })
    assert.deepStrictEqual(rootInitialUiState, before)
  })
})

describe('rootViewModel.visibleMenu (RBAC)', () => {
  const menu: readonly MenuSection[] = [
    { label: 'Dashboard', iconId: 'home', to: '/dashboard' }, // público (sem requiredPermission)
    { label: 'Usuários', iconId: 'users', to: '/usuarios', requiredPermission: 'user:read' },
    {
      label: 'Contratos',
      iconId: 'calendar-check',
      subItems: [
        { label: 'Lista', to: '/contratos' }, // público
        { label: 'Auditoria', to: '/contratos/audit', requiredPermission: 'contract:audit' },
      ],
    },
    {
      label: 'Só-Admin',
      iconId: 'wallet',
      subItems: [{ label: 'X', to: '/x', requiredPermission: 'admin:x' }],
    },
  ]

  it('mantém itens públicos mesmo com permissions vazias', () => {
    const v = rootViewModel.visibleMenu(menu, [])
    assert.ok(v.some((s) => s.label === 'Dashboard'))
  })
  it('esconde seção sem a permissão exigida', () => {
    const v = rootViewModel.visibleMenu(menu, [])
    assert.ok(!v.some((s) => s.label === 'Usuários'))
    assert.ok(rootViewModel.visibleMenu(menu, ['user:read']).some((s) => s.label === 'Usuários'))
  })
  it('filtra subitens por permissão', () => {
    const contratos = rootViewModel.visibleMenu(menu, []).find((s) => s.label === 'Contratos')
    assert.deepStrictEqual(
      contratos?.subItems?.map((s) => s.label),
      ['Lista'],
    )
  })
  it('seção de accordion que fica sem subitens some', () => {
    assert.ok(!rootViewModel.visibleMenu(menu, []).some((s) => s.label === 'Só-Admin'))
    assert.ok(rootViewModel.visibleMenu(menu, ['admin:x']).some((s) => s.label === 'Só-Admin'))
  })
  it('não muta o menu de entrada', () => {
    const len = menu.length
    rootViewModel.visibleMenu(menu, [])
    assert.strictEqual(menu.length, len)
    assert.strictEqual(menu[2]?.subItems?.length, 2)
  })
})

// Regressão de CONFIGURAÇÃO sobre o MENU real (não o sintético acima): trava que o subitem
// "Fornecedores" exige `supplier:read`. Se alguém remover o `requiredPermission` da config no
// futuro, estes testes falham. (feature 011 — RBAC do menu de fornecedores)
describe('rootViewModel.visibleMenu (MENU real — fornecedores)', () => {
  const findParceiros = (menu: readonly MenuSection[]): MenuSection | undefined =>
    menu.find((s) => s.label === 'Gestão de Parceiros')
  const hasFornecedores = (menu: readonly MenuSection[]): boolean =>
    findParceiros(menu)?.subItems?.some((s) => s.label === 'Fornecedores') ?? false

  it('sem supplier:read (permissions vazias): esconde o subitem e a seção "Gestão de Parceiros"', () => {
    const v = rootViewModel.visibleMenu(MENU, [])
    assert.strictEqual(findParceiros(v), undefined, 'a seção accordion deve sumir por ficar vazia')
    assert.strictEqual(hasFornecedores(v), false)
  })

  it('com outras permissões mas sem supplier:read: continua escondendo', () => {
    const v = rootViewModel.visibleMenu(MENU, ['user:read', 'contract:audit'])
    assert.strictEqual(findParceiros(v), undefined)
    assert.strictEqual(hasFornecedores(v), false)
  })

  it('com supplier:read: mostra a seção e o subitem "Fornecedores" → /parceiros/fornecedores', () => {
    const v = rootViewModel.visibleMenu(MENU, ['supplier:read'])
    const parceiros = findParceiros(v)
    assert.ok(parceiros, 'a seção "Gestão de Parceiros" deve aparecer')
    const fornecedores = parceiros?.subItems?.find((s) => s.label === 'Fornecedores')
    assert.ok(fornecedores, 'o subitem "Fornecedores" deve aparecer')
    assert.strictEqual(fornecedores?.to, '/parceiros/fornecedores')
  })
})

// Regressão de CONFIGURAÇÃO do subitem "Financiadores" (feature 012). Coordena com a 011: agora a
// seção "Gestão de Parceiros" tem 2 subitens, logo sobrevive com `supplier:read` OU `financier:read`.
describe('rootViewModel.visibleMenu (MENU real — financiadores)', () => {
  const findParceiros = (menu: readonly MenuSection[]): MenuSection | undefined =>
    menu.find((s) => s.label === 'Gestão de Parceiros')
  const hasFinanciadores = (menu: readonly MenuSection[]): boolean =>
    findParceiros(menu)?.subItems?.some((s) => s.label === 'Financiadores') ?? false

  it('sem financier:read: esconde o subitem "Financiadores"', () => {
    assert.strictEqual(hasFinanciadores(rootViewModel.visibleMenu(MENU, [])), false)
    assert.strictEqual(hasFinanciadores(rootViewModel.visibleMenu(MENU, ['supplier:read'])), false)
  })

  it('com financier:read: mostra o subitem "Financiadores" → /parceiros/financiadores', () => {
    const v = rootViewModel.visibleMenu(MENU, ['financier:read'])
    const parceiros = findParceiros(v)
    assert.ok(parceiros, 'a seção "Gestão de Parceiros" deve aparecer (só com Financiadores)')
    const financiadores = parceiros?.subItems?.find((s) => s.label === 'Financiadores')
    assert.ok(financiadores, 'o subitem "Financiadores" deve aparecer')
    assert.strictEqual(financiadores?.to, '/parceiros/financiadores')
    // a seção sobrevive mesmo sem supplier:read — Fornecedores foi filtrado, mas Financiadores ficou.
    assert.strictEqual(
      parceiros?.subItems?.some((s) => s.label === 'Fornecedores'),
      false,
    )
  })

  it('com ambos os reads: a seção mostra os 2 subitens', () => {
    const v = rootViewModel.visibleMenu(MENU, ['supplier:read', 'financier:read'])
    const labels = findParceiros(v)?.subItems?.map((s) => s.label)
    assert.deepStrictEqual(labels, ['Fornecedores', 'Financiadores'])
  })
})

// Regressão de CONFIGURAÇÃO do subitem "ACTs" (feature 013). ACT é governado por `collaborator:read`
// (espelha o Colaborador no RBAC). A seção "Gestão de Parceiros" agora tem 3 subitens.
describe('rootViewModel.visibleMenu (MENU real — ACTs)', () => {
  const findParceiros = (menu: readonly MenuSection[]): MenuSection | undefined =>
    menu.find((s) => s.label === 'Gestão de Parceiros')
  const hasActs = (menu: readonly MenuSection[]): boolean =>
    findParceiros(menu)?.subItems?.some((s) => s.label === 'ACTs') ?? false

  it('sem collaborator:read: esconde o subitem "ACTs"', () => {
    assert.strictEqual(hasActs(rootViewModel.visibleMenu(MENU, [])), false)
    assert.strictEqual(hasActs(rootViewModel.visibleMenu(MENU, ['supplier:read', 'financier:read'])), false)
  })

  it('com collaborator:read: mostra o subitem "ACTs" → /parceiros/atos', () => {
    const v = rootViewModel.visibleMenu(MENU, ['collaborator:read'])
    const parceiros = findParceiros(v)
    assert.ok(parceiros, 'a seção deve aparecer (só com ACTs)')
    const acts = parceiros?.subItems?.find((s) => s.label === 'ACTs')
    assert.strictEqual(acts?.to, '/parceiros/atos')
  })

  it('com supplier+financier+collaborator reads: mostra Colaboradores, Fornecedores, Financiadores, ACTs na ordem', () => {
    const v = rootViewModel.visibleMenu(MENU, ['supplier:read', 'financier:read', 'collaborator:read'])
    const labels = findParceiros(v)?.subItems?.map((s) => s.label)
    assert.deepStrictEqual(labels, ['Colaboradores', 'Fornecedores', 'Financiadores', 'ACTs'])
  })
})

// Regressão de CONFIGURAÇÃO do subitem "Geografia" (feature 014). Governado por `geography:read`.
// A seção "Gestão de Parceiros" agora tem 4 subitens.
describe('rootViewModel.visibleMenu (MENU real — geografia)', () => {
  const findParceiros = (menu: readonly MenuSection[]): MenuSection | undefined =>
    menu.find((s) => s.label === 'Gestão de Parceiros')
  const hasGeografia = (menu: readonly MenuSection[]): boolean =>
    findParceiros(menu)?.subItems?.some((s) => s.label === 'Estados e Municípios') ?? false

  it('sem geography:read: esconde o subitem "Estados e Municípios"', () => {
    assert.strictEqual(hasGeografia(rootViewModel.visibleMenu(MENU, [])), false)
    assert.strictEqual(hasGeografia(rootViewModel.visibleMenu(MENU, ['supplier:read'])), false)
  })

  it('com geography:read: mostra o subitem "Estados e Municípios" → /parceiros/territorios', () => {
    const v = rootViewModel.visibleMenu(MENU, ['geography:read'])
    const geo = findParceiros(v)?.subItems?.find((s) => s.label === 'Estados e Municípios')
    assert.strictEqual(geo?.to, '/parceiros/territorios')
  })

  it('com os 4 reads: a seção mostra os 5 subitens na ordem', () => {
    const v = rootViewModel.visibleMenu(MENU, [
      'supplier:read',
      'financier:read',
      'collaborator:read',
      'geography:read',
    ])
    const labels = findParceiros(v)?.subItems?.map((s) => s.label)
    assert.deepStrictEqual(labels, [
      'Colaboradores',
      'Fornecedores',
      'Financiadores',
      'ACTs',
      'Estados e Municípios',
    ])
  })
})
