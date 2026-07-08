/**
 * Estilos da page "Relatório Geral" — MOLDE dos demais relatórios (identidade "brand", full-bleed 28px, só-
 * tokens §X). A pele do cabeçalho e dos filtros recolhíveis é RE-EXPORTADA de `realizado-x-planejado.page.css.ts`
 * (padrão sibling: mesma identidade, zero duplicação, RxP intacto). A tabela tem o seu `*.css.ts` próprio
 * (`relatorio-geral-table.css.ts`). Nenhum hex/px cru aqui.
 */
import { style } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'
import { brand } from '#shared/ui/brand/grid-brand.values.ts'

export {
  head,
  backButton,
  headTitle,
  tools,
  filterToggle,
  filters,
  filtersInner,
  fld,
  fldLabel,
  fldCtrl,
  fldSelect,
  fldChev,
  applyButton,
} from './realizado-x-planejado.page.css.ts'
// Trigger do dropdown Exportar (kit brand compartilhado dos relatórios) — reusado no botão "Colunas".
export { exportTrigger } from '../components/report-filters.css.ts'

// ── Seletor de COLUNAS (botão "Colunas" → menu flutuante de checkboxes) ──

/** Wrapper posicional do botão Colunas (âncora do menu absoluto). */
export const columnsWrap = style({ position: 'relative', display: 'inline-flex' })

/** Backdrop invisível de tela cheia — fecha o menu ao clicar fora (§ acessível: é um <button>). */
export const columnsBackdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 40,
  border: 'none',
  background: 'transparent',
  cursor: 'default',
})

/** Painel flutuante do seletor, ancorado ao fim do botão; rola quando a lista de colunas é longa. */
export const columnsMenu = style({
  position: 'absolute',
  insetBlockStart: 'calc(100% + 0.25rem)',
  insetInlineEnd: 0,
  zIndex: 50,
  background: brand.color.surface,
  borderRadius: brand.radius.md,
  boxShadow: brand.shadow.cardDepth,
  border: `${vars.borderWidth.thin} solid ${brand.color.line}`,
  minInlineSize: '16rem',
  maxBlockSize: '22rem',
  overflowY: 'auto',
  paddingBlock: brand.space.sm,
  scrollbarWidth: 'thin',
  scrollbarColor: `${brand.color.scrollThumb} transparent`,
})

/** Linha de item = checkbox + rótulo da coluna (o <label> inteiro é clicável). */
export const columnsItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: brand.space.sm,
  inlineSize: '100%',
  paddingBlock: brand.space.sm,
  paddingInline: brand.space.md,
  color: brand.color.ink700,
  fontFamily: vars.font.family.heading,
  fontSize: brand.text.body,
  fontWeight: brand.weight.medium,
  cursor: 'pointer',
  userSelect: 'none',
  selectors: { '&:hover': { background: brand.color.surfaceAlt } },
})

/** Checkbox nativo com accent da marca (azul primary). */
export const columnsCheck = style({
  inlineSize: '1rem',
  blockSize: '1rem',
  accentColor: brand.color.primary,
  cursor: 'pointer',
})
