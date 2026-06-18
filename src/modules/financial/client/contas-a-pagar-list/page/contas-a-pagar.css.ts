/**
 * Contas a Pagar (grid) — estilos (vanilla-extract, só-tokens §X). Fiel ao Figma 205-638 / mock: filter-bar
 * (busca + status-chips segmented-control), grid de 6 colunas (DTO fino) com tipografia densa Inter +
 * valores mono, e bottombar (footer no padrão Contratos: paginação + Novo Documento). Marca azul do DS.
 */
import { style, styleVariants, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  minBlockSize: '100%',
  paddingBlockEnd: '5rem', // espaço p/ o bottombar fixo
})

// ── Filter-bar (Figma): busca + status-chips ──────────────────────────────────
export const filterBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.875rem', // Figma: 14px
  paddingInline: vars.space.lg, // 24px
  paddingBlock: vars.space.sm,
  background: vars.color.surface.default,
  // Sem régua entre a busca e a tabela (pedido P.O.) — a separação fica no header sticky do grid.
})

export const searchWrap = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  paddingBlock: '0.5rem', // 8px — campo um pouco mais alto/confortável
  paddingInlineStart: '2.25rem', // 36px (espaço do ícone)
  paddingInlineEnd: '0.875rem', // 14px (sem atalho ⌘K dentro do campo)
  inlineSize: '24rem', // largura fixa, mais larga (sem o chip de atalho)
  maxInlineSize: '100%',
})
export const searchIcon = style({
  position: 'absolute',
  insetInlineStart: '0.625rem', // 10px
  insetBlockStart: '50%',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  color: vars.color.institutional.ink5,
  pointerEvents: 'none',
})
export const searchInput = style({
  flex: 1,
  minInlineSize: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: vars.font.family.heading, // Figma: Inter no corpo do grid
  fontSize: vars.font.size.xs, // ~12.5px
  color: vars.color.institutional.ink2,
  '::placeholder': { color: vars.color.institutional.ink5 },
})
export const kbd = style({
  marginInlineStart: vars.space.xs,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  color: vars.color.institutional.ink5,
  background: vars.color.institutional.paperWarm,
  paddingInline: vars.space.xs,
  borderRadius: vars.radius.sm,
})

// Status-chips = segmented control no MESMO padrão do grid de Contratos (trilho paper-warm; segmento
// ativo branco "elevado"; Nunito 11px semibold; altura 30px). Agora clicáveis → filtram por status.
export const statusChips = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.125rem', // 2px (Contratos)
  padding: '0.125rem', // 2px
  background: vars.color.institutional.paperWarm,
  borderRadius: vars.radius.md,
  minInlineSize: 0,
  overflowX: 'auto',
})
const chipBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  blockSize: '1.875rem', // 30px (Contratos)
  paddingInline: '0.625rem', // 10px
  borderRadius: vars.radius.sm,
  fontFamily: vars.font.family.body, // Nunito (Contratos)
  fontSize: '0.6875rem', // 11px
  fontWeight: vars.font.weight.semibold,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.ink4,
  transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
})
export const chip = style([
  chipBase,
  {
    ':hover': {
      background: vars.color.surface.default,
      color: vars.color.institutional.ink2,
      boxShadow: vars.shadow.card,
    },
  },
])
export const chipActive = style([
  chipBase,
  {
    background: vars.color.surface.default,
    color: vars.color.institutional.ink2,
    boxShadow: vars.shadow.card,
  },
])
// Estado que o backend ainda não produz (Transmitido/Recusado/Pago/Conciliado) → desabilitado (chrome).
export const chipDisabled = style([
  chipBase,
  {
    color: vars.color.institutional.ink5,
    cursor: 'not-allowed',
    opacity: 0.5,
  },
])
const chipCount = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: vars.font.family.mono,
  fontSize: '0.59375rem', // 9.5px (Contratos)
  fontWeight: vars.font.weight.medium,
  minInlineSize: '1rem',
  blockSize: '1rem',
  paddingInline: '0.25rem',
  borderRadius: vars.radius.sm,
  color: vars.color.institutional.ink5,
  background: vars.color.institutional.paperWarm,
})
// Quando o chip ativo (fundo branco) carrega o contador, o badge ganha o tom paper-beige p/ contraste.
export const chipCountOnActive = style([
  chipCount,
  { color: vars.color.institutional.ink2, background: vars.color.institutional.paperBeige },
])

// ── Filtros avançados ("Adicionar filtro", estilo do mock) ────────────────────
// Empurra o bloco de filtros para a direita da filter-bar (igual ao fbar-right do mock).
export const fbarRight = style({ marginInlineStart: 'auto', display: 'inline-flex', gap: vars.space.sm })
export const fltWrap = style({ position: 'relative', display: 'inline-flex' })
export const addFilterBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  blockSize: '2rem',
  paddingInline: '0.625rem',
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.default,
  fontFamily: vars.font.family.body,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink2,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  ':hover': {
    background: vars.color.institutional.paperWarm,
    borderColor: vars.color.institutional.blueLine,
  },
})
// Prefixo "FILTRO" (caixa-alta, esmaecido), igual ao mock.
export const addFilterLabel = style({
  fontSize: '0.59375rem',
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})
export const addFilterMenu = style({
  position: 'absolute',
  insetBlockStart: 'calc(100% + 0.375rem)',
  insetInlineEnd: 0,
  zIndex: 50,
  minInlineSize: '17rem',
  maxBlockSize: '22rem',
  overflowY: 'auto',
  paddingBlock: vars.space.xs,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.card,
})
export const menuGroupLabel = style({
  paddingInline: vars.space.md,
  paddingBlock: vars.space.xs,
  fontSize: '0.5625rem',
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})
const menuItemBase = {
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  inlineSize: '100%',
  paddingInline: vars.space.md,
  paddingBlock: '0.4375rem',
  border: 'none',
  background: 'transparent',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  textAlign: 'start',
} as const
export const menuItem = style([
  menuItemBase,
  {
    color: vars.color.institutional.ink2,
    cursor: 'pointer',
    ':hover': { background: vars.color.institutional.blueBg },
  },
])
export const menuItemDisabled = style([
  menuItemBase,
  { color: vars.color.institutional.ink5, cursor: 'not-allowed', opacity: 0.6 },
])
export const menuItemLabel = style({ flex: 1, minInlineSize: 0 })
export const menuTypeTag = style({
  fontFamily: vars.font.family.mono,
  fontSize: '0.5rem',
  fontWeight: vars.font.weight.medium,
  letterSpacing: '0.04em',
  color: vars.color.institutional.ink5,
  background: vars.color.institutional.paperWarm,
  paddingInline: '0.3125rem',
  paddingBlock: '0.125rem',
  borderRadius: vars.radius.sm,
})
// Linha de chips de filtro ativos (abaixo da filter-bar).
export const activeFilters = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingInline: vars.space.lg,
  paddingBlockEnd: vars.space.sm,
  background: vars.color.surface.default,
})
export const activeFiltersLabel = style({
  fontFamily: vars.font.family.body, // Nunito (marca)
  fontSize: '0.59375rem',
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})
export const filterChip = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  blockSize: '2rem',
  paddingInlineStart: '0.625rem',
  paddingInlineEnd: '0.25rem',
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.blueLine}`,
  borderRadius: vars.radius.md,
  background: vars.color.institutional.blueBg,
})
export const filterChipLabel = style({
  fontFamily: vars.font.family.body,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.blueDeep,
})
export const filterChipRange = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  color: vars.color.institutional.ink4,
})
const chipControlBase = {
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.sm,
  background: vars.color.surface.default,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink2,
  paddingBlock: '0.125rem',
  paddingInline: '0.375rem',
} as const
export const filterChipInput = style([chipControlBase, { fontFamily: vars.font.family.mono }])
export const filterChipSelect = style([chipControlBase, { maxInlineSize: '11rem', cursor: 'pointer' }])
export const filterChipRemove = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '1.25rem',
  blockSize: '1.25rem',
  border: 'none',
  borderRadius: vars.radius.sm,
  background: 'transparent',
  color: vars.color.institutional.blueDeep,
  fontSize: vars.font.size.sm,
  lineHeight: 1,
  cursor: 'pointer',
  ':hover': { background: vars.color.institutional.blueLine },
})
export const clearAllFilters = style({
  border: 'none',
  background: 'transparent',
  fontFamily: vars.font.family.body,
  fontSize: '0.6875rem',
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink4,
  cursor: 'pointer',
  ':hover': { color: vars.color.institutional.ink2, textDecoration: 'underline' },
})

// ── Modal de confirmação de EXCLUSÃO (hard-delete) ────────────────────────────
export const confirmOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.lg,
  background: vars.color.institutional.overlay,
})
export const confirmDialog = style({
  inlineSize: '28rem',
  maxInlineSize: '100%',
  padding: vars.space.lg,
  background: vars.color.surface.default,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  boxShadow: vars.shadow.card,
})
export const confirmTitle = style({
  margin: 0,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})
export const confirmText = style({
  marginBlock: vars.space.sm,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.sm,
  lineHeight: 1.5,
  color: vars.color.institutional.ink3,
})
export const confirmWarn = style({
  marginBlockStart: vars.space.sm,
  padding: vars.space.sm,
  borderRadius: vars.radius.sm,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
})
export const confirmActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: vars.space.sm,
  marginBlockStart: vars.space.lg,
})
const confirmBtnBase = {
  blockSize: '2.5rem',
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  cursor: 'pointer',
} as const
export const confirmCancelBtn = style([
  confirmBtnBase,
  {
    border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
    background: vars.color.surface.default,
    color: vars.color.institutional.ink2,
    ':hover': { background: vars.color.institutional.paperWarm },
  },
])
export const confirmDeleteBtn = style([
  confirmBtnBase,
  {
    border: 'none',
    background: vars.color.feedback.errorText,
    color: vars.color.surface.default,
    ':hover': { filter: 'brightness(0.95)' },
    ':disabled': { opacity: 0.6, cursor: 'not-allowed' },
  },
])

// ── Grid (Figma 205-638) — enriquecido pela 012/#47: + Contrato, Forma, Emissão, Bruto ─────────────
// Larguras balanceadas (espaço proporcional entre as colunas); Fornecedor é a flexível (minmax).
// Ordem: checkbox · Tipo · Documento · Fornecedor · Contrato · Forma · Emissão · Venc · Bruto · Líquido ·
// Status. (Emissão é placeholder "—" até o backend expô-la na lista — core-api#95.)
// Venc = 10.5rem p/ caber o campo editável de data (input + ícone do date-picker) sem cortar.
const GRID_COLS = '2.25rem 4.75rem 7rem minmax(15rem, 1.4fr) 6.5rem 8.5rem 6.5rem 10.5rem 7rem 7rem 7.5rem'

// Wrapper rola na horizontal (como o grid largo do Figma) quando a viewport é estreita.
export const gridWrap = style({
  paddingInline: vars.space.lg,
  paddingBlock: vars.space.md,
  minBlockSize: 0, // permite o scroller interno encolher dentro do flex da tela
})
// Scroller do grid (2 eixos), espelhando o grid de Contratos: rola na vertical (maxBlockSize) com header
// sticky e na horizontal (minInlineSize > largura do container). Scrollbar fina/discreta da marca.
export const grid = style({
  minInlineSize: '88rem', // colunas folgadas (sem corte); abaixo disso rola na horizontal
  // Reserva p/ o topo (header do shell + filter-bar) E o rodapé FIXO (3.5rem) + folga, p/ a última
  // linha nunca ficar coberta pelo bottombar (antes 15rem deixava a borda inferior sob o rodapé).
  maxBlockSize: 'calc(100dvh - 18rem)',
  overflow: 'auto',
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  borderRadius: vars.radius.lg,
  background: vars.color.surface.default,
  selectors: {
    '&::-webkit-scrollbar': { width: '0.625rem', height: '0.625rem' },
    '&::-webkit-scrollbar-track': {
      background: vars.color.institutional.paperWarm,
      borderRadius: vars.radius.md,
    },
    '&::-webkit-scrollbar-thumb': {
      background: `color-mix(in srgb, ${vars.color.institutional.ink5} 15%, ${vars.color.institutional.paperRule})`,
      borderRadius: vars.radius.md,
      border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperWarm}`,
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: `color-mix(in srgb, ${vars.color.institutional.ink5} 30%, ${vars.color.institutional.paperRule})`,
    },
  },
})
export const head = style({
  display: 'grid',
  gridTemplateColumns: GRID_COLS,
  gap: '1rem', // 16px — mais respiro entre colunas (ex.: Líquido ↔ Status)
  alignItems: 'center',
  minBlockSize: '2.25rem', // 36px
  paddingInline: vars.space.lg,
  background: vars.color.institutional.paperWarm,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  position: 'sticky', // fixa o cabeçalho ao rolar na vertical (padrão do grid de Contratos)
  top: 0,
  zIndex: 5,
})
// Cabeçalho denso (Figma "Badge"): caixa-alta, bold, tracking largo, ink-5. Fonte +1px (sobre o 2xs=9px).
export const headCell = style({
  fontFamily: vars.font.family.heading,
  fontSize: `calc(${vars.font.size['2xs']} + 0.0625rem)`, // +1px sobre o 2xs (9px → 10px)
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: vars.color.institutional.ink5,
})
export const headCellRight = style([headCell, { textAlign: 'right' }])

export const row = style({
  display: 'grid',
  gridTemplateColumns: GRID_COLS,
  gap: '1rem', // 16px — alinhado ao header; mais respiro entre colunas
  alignItems: 'center',
  minBlockSize: '3.5rem', // 56px
  paddingInline: vars.space.lg,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  fontFamily: vars.font.family.body, // marca: Nunito no corpo da tabela (padroniza com o grid de Contratos)
  fontSize: `calc(${vars.font.size.xs} + 0.0625rem)`, // +1px sobre o xs (12px → 13px) nos campos
  color: vars.color.institutional.ink2,
  transition: 'background 120ms ease',
  ':hover': { background: vars.color.institutional.paperWarm },
  ':last-child': { borderBlockEnd: 'none' },
})
export const cell = style({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })
// Vencimento editável inline (só linhas em Aberto). Input discreto que "vira" campo no hover/focus.
// Fonte Nunito (marca) e largura folgada p/ a data + ícone do date-picker não ficarem cortados.
export const dueInput = style({
  inlineSize: '9.5rem',
  maxInlineSize: '100%',
  paddingBlock: '0.25rem',
  paddingInline: '0.5rem',
  border: `${vars.borderWidth.thin} solid transparent`,
  borderRadius: vars.radius.sm,
  background: 'transparent',
  fontFamily: vars.font.family.body,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink2,
  cursor: 'pointer',
  ':hover': { borderColor: vars.color.institutional.paperRule, background: vars.color.surface.default },
  ':focus': {
    outline: 'none',
    borderColor: vars.color.institutional.blueLine,
    background: vars.color.surface.default,
    boxShadow: `0 0 0 0.125rem ${vars.color.institutional.blueBg}`,
  },
})
export const cellMutedDoc = style([
  cell,
  { fontFamily: vars.font.family.mono, color: vars.color.institutional.ink4 },
])
// Coluna Documento (Figma): número (mono) + sublinha "série …" (mono, menor, esmaecida).
export const cellDoc = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.0625rem',
  minInlineSize: 0,
  overflow: 'hidden',
})
export const cellDocNumber = style([cellMutedDoc, { color: vars.color.institutional.ink2 }])
export const cellDocSeries = style([
  cell,
  {
    fontFamily: vars.font.family.mono,
    fontSize: vars.font.size['2xs'],
    color: vars.color.institutional.ink5,
  },
])
export const cellNet = style({ textAlign: 'right', fontFamily: vars.font.family.mono })
// Bruto (Figma): mono à direita, tom mais discreto que o Líquido.
export const cellGross = style([cellNet, { color: vars.color.institutional.ink4 }])
// Badge de TIPO (Figma grid / mock) — base de layout (9px bold caixa-alta); a COR vem por variante de tipo.
export const typeBadge = style({
  justifySelf: 'start',
  display: 'inline-flex',
  alignItems: 'center',
  paddingBlock: '0.0625rem',
  paddingInline: vars.space.xs,
  borderRadius: vars.radius.sm,
  border: '0.5px solid transparent', // reservado p/ as variantes com borda (não desloca o baseline)
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
})

// Cores por DocumentType (mock): azul = NFS-e/Fatura · âmbar = RPA · laranja = Boleto · neutro = DANFE/
// Recibo/Imposto. Mapeado em tokens do DS (marca azul; reuso de partnerType p/ âmbar/laranja).
export const typeBadgeVariant = styleVariants({
  'NFS-e': { background: vars.color.institutional.blueBg, color: vars.color.institutional.blueDeep },
  Fatura: {
    background: vars.color.institutional.blueBg,
    color: vars.color.institutional.blueDeep,
    borderColor: vars.color.institutional.blueLine,
  },
  DANFE: { background: vars.color.institutional.paperBeige, color: vars.color.institutional.ink2 },
  RPA: {
    background: vars.color.partnerType.collaborator.background,
    color: vars.color.partnerType.collaborator.text,
  },
  Boleto: {
    background: vars.color.partnerType.act.background,
    color: vars.color.partnerType.act.text,
  },
  Recibo: {
    background: vars.color.institutional.paperWarm,
    color: vars.color.institutional.ink3,
    borderColor: vars.color.institutional.paperRule,
  },
  Imposto: {
    background: vars.color.institutional.paperWarm,
    color: vars.color.institutional.ink3,
    borderColor: vars.color.institutional.paperRule,
  },
  neutral: { background: vars.color.institutional.paperBeige, color: vars.color.institutional.ink3 },
})

// Badge de status — Figma "Badge" 9px bold caixa-alta.
export const statusBadge = style({
  justifySelf: 'start',
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.xl,
})
export const statusVariant = styleVariants({
  Rascunho: { background: vars.color.status.cancelledBg, color: vars.color.status.cancelledText },
  Aberto: { background: vars.color.status.pendingBg, color: vars.color.status.pendingText },
  Aprovado: { background: vars.color.status.activeBg, color: vars.color.status.activeText },
  Transmitido: { background: vars.color.status.finishedBg, color: vars.color.status.finishedText },
  Recusado: { background: vars.color.status.terminatedBg, color: vars.color.status.terminatedText },
  Pago: { background: vars.color.status.activeBg, color: vars.color.status.activeText },
  Conciliado: { background: vars.color.status.finishedBg, color: vars.color.status.finishedText },
})

export const placeholder = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingBlock: vars.space.xl,
  paddingInline: vars.space.lg,
  color: vars.color.text.muted,
  fontSize: vars.font.size.sm,
  textAlign: 'center',
})
export const placeholderTitle = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.md,
  color: vars.color.text.secondary,
})
export const errorBanner = style({
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  background: vars.color.feedback.errorBg,
  color: vars.color.feedback.errorText,
  fontSize: vars.font.size.sm,
  textAlign: 'center',
})

// ── Bottombar (footer no padrão Contratos): paginação + Novo Documento ────────
export const bottombar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  height: '3.5rem',
  paddingInline: vars.space.lg,
  // Fonte da marca (Nunito) nos itens do footer; valores monetários (mono) sobrescrevem pontualmente.
  fontFamily: vars.font.family.body,
  background: vars.color.institutional.paperWarm,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  position: 'fixed',
  insetBlockEnd: 0,
  insetInlineStart: 'var(--sidebar-width, 14rem)',
  insetInlineEnd: 0,
  zIndex: 100,
})
// Grupo à direita do footer: Exportar + Novo Documento.
export const footerActions = style({
  marginInlineStart: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexShrink: 0,
})
export const newButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.medium,
  fontFamily: vars.font.family.body,
  color: vars.color.surface.default,
  background: vars.color.institutional.blue,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  ':hover': { background: vars.color.institutional.blueDeep },
})

export const pagination = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  fontSize: vars.font.size.sm,
  color: vars.color.text.muted,
})
export const pageRange = style({})
export const pageNav = style({ display: 'flex', gap: vars.space.xs })
export const pageBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  inlineSize: '2rem',
  blockSize: '2rem',
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  borderRadius: vars.radius.md,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  cursor: 'pointer',
  ':disabled': { opacity: 0.4, cursor: 'not-allowed' },
})
export const separator = style({ color: vars.color.institutional.ink5 })
export const select = style({
  border: `${vars.borderWidth.thin} solid ${vars.color.border.default}`,
  borderRadius: vars.radius.sm,
  background: vars.color.surface.default,
  color: vars.color.text.secondary,
  fontFamily: vars.font.family.body, // <select> não herda font-family por padrão
  fontSize: vars.font.size.sm,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.xs,
  cursor: 'pointer',
})
export const perPageLabel = style({ color: vars.color.text.muted })

// ── Linha clicável (abre detalhe/drawer) — só afeta cursor/hover; NÃO reseta a tipografia da linha ──
export const rowClickable = style({
  cursor: 'pointer',
  ':hover': { background: vars.color.institutional.blueBg },
})

// Célula da checkbox (1ª coluna) — centraliza e não dispara o clique da linha (stopPropagation no JSX).
export const cellCheckbox = style({ display: 'flex', alignItems: 'center', justifyContent: 'center' })
// Linha selecionada — realce sutil (mock: bg azul claro), prevalece sobre o hover.
export const rowSelected = style({
  background: vars.color.institutional.blueBg,
  ':hover': { background: vars.color.institutional.blueBg },
})

// ── Barra de seleção (mock: substitui a paginação quando há linhas marcadas) ───
export const selBar = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  minInlineSize: 0,
})
export const selCount = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingBlock: vars.space.xs,
  paddingInline: vars.space.sm,
  borderRadius: vars.radius.xl,
  background: vars.color.institutional.blueBg,
  color: vars.color.institutional.blueDeep,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
})
export const selSum = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink2,
  whiteSpace: 'nowrap',
})
export const selSumLabel = style({
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink4,
  whiteSpace: 'nowrap',
})
export const selClear = style({
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: vars.color.institutional.blue,
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  textDecoration: 'underline',
  textUnderlineOffset: '0.125rem',
})
// Erro de ação em massa (ex.: 409 de versão) — texto discreto na barra de seleção.
export const selError = style({
  fontSize: vars.font.size.xs,
  color: vars.color.status.terminatedText,
})

// ── Drawer de Detalhe do Documento (onda 2) ───────────────────────────────────
// Painel lateral NÃO-modal (mock): a grade atrás permanece clara (sem escurecer). O backdrop é
// transparente e serve só para fechar ao clicar fora; a linha clicada fica realçada (selecionada).
export const drawerOverlay = style({
  position: 'fixed',
  // Começa ABAIXO do topbar do sistema p/ o header do drawer ficar visível (não some atrás do topbar).
  insetBlockStart: vars.size.topbar,
  insetBlockEnd: 0,
  insetInlineStart: 0,
  insetInlineEnd: 0,
  zIndex: 300,
  background: 'transparent',
  display: 'flex',
  justifyContent: 'flex-end',
})
export const drawerPanel = style({
  inlineSize: 'min(27rem, 100%)',
  blockSize: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: vars.color.surface.default,
  boxShadow: vars.shadow.cardElevated,
  // Base na fonte da marca (Nunito); overlines/badges (Inter) e números (mono) sobrescrevem pontualmente.
  fontFamily: vars.font.family.body,
})
export const drawerHeader = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.md,
  paddingBlock: vars.space.md,
  paddingInline: vars.space.lg,
  borderBlockEnd: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
export const drawerOverline = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})
export const drawerTitle = style({
  margin: 0,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.md,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
})
export const drawerClose = style({
  marginInlineStart: 'auto',
  flexShrink: 0,
  inlineSize: '1.75rem',
  blockSize: '1.75rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.md,
  border: 'none',
  background: 'transparent',
  color: vars.color.institutional.ink4,
  cursor: 'pointer',
  ':hover': { background: vars.color.institutional.paperWarm },
})
export const drawerBody = style({
  flex: 1,
  minBlockSize: 0,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
  padding: vars.space.lg,
})
export const drawerSectionTitle = style({
  margin: `0 0 ${vars.space.sm}`,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})
export const detailGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: vars.space.sm,
})
export const detailField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
  minInlineSize: 0,
})
export const detailLabel = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.semibold,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})
export const detailValue = style({
  fontFamily: vars.font.family.body, // valor = Nunito (marca)
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink2,
})
export const compRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: vars.space.sm,
  paddingBlock: vars.space.xs,
  fontSize: vars.font.size.xs,
  color: vars.color.text.secondary,
})
export const compVal = style({ fontFamily: vars.font.family.mono, color: vars.color.institutional.ink2 })
// Linha única de Retenções (soma) destacada em vermelho (mock): "− Retenções (IRRF, INSS, ISS)  (R$ 550,00)".
export const compRowRetentions = style([
  compRow,
  {
    marginBlock: vars.space.xs,
    paddingInline: vars.space.sm,
    borderRadius: vars.radius.sm,
    background: vars.color.feedback.errorBg,
    color: vars.color.feedback.errorText,
    fontWeight: vars.font.weight.semibold,
  },
])
export const compValRetentions = style([
  compVal,
  { color: vars.color.feedback.errorText, fontWeight: vars.font.weight.semibold },
])
export const netRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBlockStart: vars.space.xs,
  paddingBlockStart: vars.space.sm,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
export const netLabel = style({
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: vars.color.institutional.blueDeep,
})
export const netVal = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.lg,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.blueDeep,
})
export const tituloCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  marginBlockEnd: vars.space.xs,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
export const tituloKind = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minInlineSize: '2.75rem',
  paddingBlock: '0.0625rem',
  paddingInline: vars.space.xs,
  borderRadius: vars.radius.sm,
  background: vars.color.institutional.blueBg,
  color: vars.color.institutional.blueDeep,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  textTransform: 'uppercase',
})
export const tituloInfo = style({
  flex: 1,
  minInlineSize: 0,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink3,
})
export const tituloVal = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.xs,
  color: vars.color.institutional.ink2,
})
export const drawerFooter = style({
  flexShrink: 0,
  display: 'flex',
  justifyContent: 'space-between', // Figma: Editar (esq.) · Fechar (dir.)
  alignItems: 'center',
  gap: vars.space.sm,
  blockSize: '3.5rem', // mesma altura do footer da página (alinhado)
  paddingInline: vars.space.lg, // mesmo recuo lateral do footer da página
  // Levemente diferenciado do footer da página (paperWarm) — um tom acima (paperBeige).
  background: vars.color.institutional.paperBeige,
  borderBlockStart: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
})
export const drawerCloseBtn = style({
  blockSize: '2.5rem',
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: 'none',
  background: vars.color.institutional.blue,
  color: vars.color.surface.default,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  cursor: 'pointer',
  ':hover': { background: vars.color.institutional.blueDeep },
})
// Botão secundário do footer (Editar pagamento) — padrão da tela de criar contrato.
export const drawerEditBtn = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.sm,
  blockSize: '2.5rem',
  paddingInline: vars.space.lg,
  borderRadius: vars.radius.md,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
  color: vars.color.institutional.ink2,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  cursor: 'pointer',
  ':hover': { background: vars.color.institutional.blueBg, borderColor: vars.color.institutional.blueLine },
})
export const dwSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  inlineSize: '100%',
})
// Cabeçalho de seção do drawer (Figma): rótulo + contador + régua fina preenchendo a linha.
export const dwSectionLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  inlineSize: '100%',
})
export const dwSectionRule = style({
  flex: 1,
  blockSize: vars.borderWidth.thin,
  background: vars.color.institutional.paperRule,
})
export const dwSectionCount = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  color: vars.color.institutional.ink4,
})
// Card de Título Gerado (pai/filho) — Figma dw-titulo-card (sem "parcela": usamos pai + retenções).
export const tituloLeft = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  flex: 1,
  minInlineSize: 0,
})
export const tituloOverline = style({
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.color.institutional.ink5,
})
export const tituloNome = style({
  fontFamily: vars.font.family.body, // nome do título = Nunito (marca)
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})
export const tituloVenc = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  color: vars.color.institutional.ink5,
})
export const tituloRight = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: vars.space.xs,
  flexShrink: 0,
})
export const tituloValBold = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.bold,
  color: vars.color.institutional.ink2,
  whiteSpace: 'nowrap',
})
export const statusPill = style({
  display: 'inline-flex',
  alignItems: 'center',
  paddingBlock: '0.1875rem',
  paddingInline: '0.625rem',
  borderRadius: '1.5rem',
  background: vars.color.institutional.paperBeige,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink4,
  whiteSpace: 'nowrap',
})

// Pílula de status do drawer (Figma): dot + rótulo, COR via `statusVariant`. Shape sem cor própria
// (a cor vem da variante); o dot herda a cor do texto (currentColor).
export const dwStatusPill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.space.xs,
  paddingBlock: '0.1875rem',
  paddingInline: '0.625rem',
  borderRadius: vars.radius.xl,
  fontFamily: vars.font.family.heading,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.semibold,
  textTransform: 'uppercase', // CAIXA ALTA igual aos status do grid (pedido P.O.)
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
  '::before': {
    content: '""',
    inlineSize: '0.3125rem',
    blockSize: '0.3125rem',
    borderRadius: '50%',
    background: 'currentColor',
  },
})

// Valor de campo em fonte MONO (Número, Vencimento) — Figma "Mono/Value".
export const detailValueMono = style([detailValue, { fontFamily: vars.font.family.mono }])

// Card de Forma de Pagamento (Figma dw-pix-card) — só o método (chave/banco/favorecido dependem de
// enriquecer o detalhe). Borda fina + cantos arredondados.
export const paymentCard = style({
  inlineSize: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  paddingBlock: vars.space.md,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.surface.default,
})
export const paymentMethodName = style({
  fontFamily: vars.font.family.body, // método = Nunito (marca)
  fontSize: vars.font.size.sm,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink2,
})

// Card do arquivo (Figma FileCard) — placeholder/empty-state honesto: o upload do PDF depende do backend
// (core-api#95). Ícone PDF esmaecido + texto "sem arquivo"; sem botão VER até existir o arquivo.
export const dwFileCard = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.md,
  inlineSize: '100%',
  padding: vars.space.md,
  borderRadius: vars.radius.lg,
  border: `${vars.borderWidth.thin} solid ${vars.color.institutional.paperRule}`,
  background: vars.color.institutional.paperWarm,
})
export const dwFileIcon = style({
  flexShrink: 0,
  inlineSize: '2.25rem',
  blockSize: '2.25rem',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.md,
  background: vars.color.institutional.paperBeige,
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  fontWeight: vars.font.weight.bold,
  letterSpacing: '0.06em',
  color: vars.color.institutional.ink5,
})
export const dwFileInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.0625rem',
  minInlineSize: 0,
})
export const dwFileName = style({
  fontFamily: vars.font.family.body, // nome do arquivo = Nunito (marca)
  fontSize: vars.font.size.xs,
  fontWeight: vars.font.weight.semibold,
  color: vars.color.institutional.ink4,
})
export const dwFileMeta = style({
  fontFamily: vars.font.family.mono,
  fontSize: vars.font.size['2xs'],
  color: vars.color.institutional.ink5,
})
// ── Impressão (PDF via window.print): esconde o cromo, imprime só o grid ──
globalStyle(`${filterBar}, ${bottombar}`, { '@media': { print: { display: 'none !important' } } })
globalStyle(screen, { '@media': { print: { paddingBlockEnd: '0 !important' } } })
