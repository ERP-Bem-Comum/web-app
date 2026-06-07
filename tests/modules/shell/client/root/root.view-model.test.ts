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
import type { MenuSection } from '#modules/shell/client/data/menu/shell-menu.config.ts'

describe('rootViewModel.resolvePageTitle', () => {
  it('casa rota exata e prefixo de segmento', () => {
    assert.strictEqual(rootViewModel.resolvePageTitle('/dashboard'), 'Dashboard')
    assert.strictEqual(rootViewModel.resolvePageTitle('/contratos'), 'Contratos')
    assert.strictEqual(rootViewModel.resolvePageTitle('/contratos/criar'), 'Contratos')
    assert.strictEqual(rootViewModel.resolvePageTitle('/contratos/123/editar'), 'Contratos')
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
  it('esconde o header só em /contratos/criar', () => {
    assert.strictEqual(rootViewModel.showPageHeader('/contratos/criar'), false)
    assert.strictEqual(rootViewModel.showPageHeader('/contratos'), true)
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
    assert.deepStrictEqual(contratos?.subItems?.map((s) => s.label), ['Lista'])
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
