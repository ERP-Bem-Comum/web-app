import { createFileRoute } from '@tanstack/react-router'

import {
  Badge,
  Button,
  DataTable,
  PageHeader,
  vars,
  type Column,
  type DataTableState,
} from '#shared/ui/index.ts'

/**
 * Showcase de organismos (rota de QA/regressão visual do design system) — NÃO é tela de produto.
 * Renderiza `DataTable` (loading/error/empty/ready) e `PageHeader` (com/sem ações) com dados
 * ESTÁTICOS e determinísticos, para o baseline do Playwright (`e2e/visual/organisms.visual.e2e.ts`).
 * View burra (§XI). Pública e sempre montada (o teste visual roda contra o build de produção via
 * Caddy). Se produto exigir escondê-la em produção real, adicionar guard por env em `beforeLoad`
 * (ver specs/009-design-system-organisms/research.md R8).
 */

type DemoRow = Readonly<{ id: string; name: string; doc: string; active: boolean }>

const demoRows: readonly DemoRow[] = [
  { id: '1', name: 'Acme Suprimentos', doc: '12.345.678/0001-90', active: true },
  { id: '2', name: 'Globex Indústria', doc: '98.765.432/0001-10', active: true },
  { id: '3', name: 'Iniciativa Verde', doc: '55.444.333/0001-22', active: false },
]

const demoColumns: readonly Column<DemoRow>[] = [
  { key: 'name', header: 'Nome', cell: (r) => r.name },
  { key: 'doc', header: 'Documento', cell: (r) => r.doc, width: 'narrow' },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    cell: (r) => <Badge variant={r.active ? 'active' : 'outro'}>{r.active ? 'Ativo' : 'Inativo'}</Badge>,
  },
]

const ready: DataTableState<DemoRow> = { status: 'ready', rows: demoRows }
const empty: DataTableState<DemoRow> = { status: 'ready', rows: [] }
const loading: DataTableState<DemoRow> = { status: 'loading' }
const errored: DataTableState<DemoRow> = { status: 'error', message: 'Falha ao carregar os dados' }

export const Route = createFileRoute('/showcase/organisms')({
  component: OrganismsShowcase,
})

const page = {
  padding: vars.space.xl,
  background: vars.color.surface.app,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xl,
} as const

const section = {
  background: vars.color.surface.default,
  padding: vars.space.lg,
  borderRadius: vars.radius.lg,
} as const

function table(state: DataTableState<DemoRow>) {
  return (
    <DataTable<DemoRow>
      columns={demoColumns}
      state={state}
      rowKey={(r) => r.id}
      emptyLabel="Nenhum resultado encontrado"
      loadingLabel="Carregando…"
      caption="Parceiros"
    />
  )
}

function OrganismsShowcase() {
  return (
    <div style={page}>
      <section style={section} data-testid="ph-actions">
        <PageHeader
          title="Fornecedores"
          subtitle="Gestão de parceiros do programa"
          actions={<Button onClick={() => undefined}>Novo fornecedor</Button>}
        />
      </section>

      <section style={section} data-testid="ph-plain">
        <PageHeader title="Relatórios" />
      </section>

      <section style={section} data-testid="dt-ready">
        {table(ready)}
      </section>

      <section style={section} data-testid="dt-empty">
        {table(empty)}
      </section>

      <section style={section} data-testid="dt-loading">
        {table(loading)}
      </section>

      <section style={section} data-testid="dt-error">
        {table(errored)}
      </section>
    </div>
  )
}
