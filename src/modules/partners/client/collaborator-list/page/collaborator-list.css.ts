/**
 * Estilos da tela de Colaboradores (nova identidade "colaboradores-brand"). Fundo, botões do cabeçalho
 * (btn-ghost "Importar" + btn-primary "Novo") fiéis ao mock. Consome os tokens ESCOPADOS `collab`
 * (paleta do mock) + `vars` só p/ fonte/anel de foco. A tabela/paginação têm css próprios.
 */
import { style, globalStyle } from '@vanilla-extract/css'

import { vars } from '#shared/ui/tokens/index.ts'

import { collab } from '../collab-brand.values.ts'

export const screen = style({
  // A rota é full-bleed no shell (root.view-model → fullBleedContent): o shell zera o padding e o fundo
  // cinza abaixo encosta nas bordas. O respiro interno (28px, como o mock) vem do padding próprio.
  padding: collab.space.xxl,
  display: 'flex',
  flexDirection: 'column',
  blockSize: '100%',
  overflowY: 'auto',
  background: collab.color.pageBg,
  fontFamily: vars.font.family.heading, // Inter
  color: collab.color.ink700,
  // Barra de rolagem sempre visível quando há overflow (o macOS auto-esconde; estilizar força a exibição).
  scrollbarWidth: 'thin',
  scrollbarColor: `${collab.color.scrollThumb} transparent`,
  selectors: {
    '&::-webkit-scrollbar': { inlineSize: '0.625rem' },
    '&::-webkit-scrollbar-thumb': {
      background: collab.color.scrollThumb,
      borderRadius: collab.radius.sm,
    },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  },
})

// Impede os filhos flex de ENCOLHER (default flex-shrink:1). Sem isto, ao expandir o painel de filtro a
// tabela é espremida (só 2 linhas) em vez de o container rolar. Com flex-shrink:0 o `screen` rola de verdade.
globalStyle(`${screen} > *`, { flexShrink: 0 })

/* Cabeçalho da página (mock): título + subtítulo à esquerda, ações à direita. */
export const header = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: vars.space.md,
  marginBlockEnd: collab.space.xl,
})

export const headText = style({ display: 'flex', flexDirection: 'column', gap: collab.space.xxs })

export const headTitle = style({
  margin: 0,
  fontSize: collab.text.h1,
  fontWeight: collab.weight.bold,
  color: collab.color.ink900,
  letterSpacing: '-.01em',
})

export const headSubtitle = style({
  margin: 0,
  fontSize: collab.text.subtitle,
  color: collab.color.ink400,
})

export const headActions = style({
  marginInlineStart: 'auto',
  display: 'flex',
  gap: collab.space.sm,
})

/* Ações do cabeçalho (Importar CSV/Excel + Novo colaborador) */
export const toolbarActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: collab.space.sm,
})

const headerButton = style({
  blockSize: collab.size.btnHeight,
  display: 'inline-flex',
  alignItems: 'center',
  gap: collab.space.sm,
  paddingInline: vars.space.md,
  borderRadius: collab.radius.sm,
  fontFamily: vars.font.family.heading,
  fontSize: collab.text.body,
  fontWeight: collab.weight.semibold,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  selectors: {
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${collab.color.primary}`,
      outlineOffset: vars.focusRing.offset,
    },
    '&:disabled': { opacity: 0.6, cursor: 'default' },
  },
})

/* "Importar CSV/Excel" — btn-ghost (outline). */
export const importButton = style([
  headerButton,
  {
    border: `${vars.borderWidth.thin} solid ${collab.color.line}`,
    background: collab.color.surface,
    color: collab.color.ink700,
    selectors: {
      '&:hover:not(:disabled)': { background: collab.color.surfaceAlt, borderColor: collab.color.ink400 },
    },
  },
])

/* "Novo colaborador" — btn-primary (azul da marca). */
export const newButton = style([
  headerButton,
  {
    border: 'none',
    background: collab.color.primary,
    color: collab.color.surface,
    boxShadow: collab.shadow.btn,
    selectors: {
      '&:hover:not(:disabled)': { background: collab.color.primaryHover },
    },
  },
])
