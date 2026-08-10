/**
 * Estilos do preview de PDF em canvas (organism · só-tokens · ADR-0007/§X). As páginas são `<canvas>`
 * anexados imperativamente pelo binding; estilizados via `globalStyle` (o binding não toca em classe).
 * Dimensões dos canvases são runtime (backing store, setadas em px pelo binding) — não são design.
 */
import { globalStyle, style } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

/** Viewport rolável: ocupa o painel; posiciona relativo p/ o overlay de estado. */
export const viewport = style({
  position: 'relative',
  flex: 1,
  minBlockSize: 0,
  inlineSize: '100%',
  overflow: 'auto',
  background: vars.color.institutional.paperWarm,
})

/** Coluna de páginas empilhadas (rolagem vertical entre elas), centradas. */
export const pages = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: vars.space.sm,
  padding: vars.space.sm,
})

// Cada página rasterizada: bloco centrado, com moldura/sombra p/ separar do fundo. (globalStyle porque o
// canvas é filho criado em runtime — a view não tem classe para ele.)
globalStyle(`${pages} > canvas`, {
  display: 'block',
  maxInlineSize: '100%',
  blockSize: 'auto',
  borderRadius: vars.radius.sm,
  boxShadow: vars.shadow.card,
  background: vars.color.surface.default,
})

/** Overlay de estado (carregando/erro) sobre o viewport — não bloqueia a rolagem quando ready. */
const overlayBase = style({
  position: 'absolute',
  insetInline: 0,
  insetBlockStart: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: vars.space.xs,
  padding: vars.space.md,
  textAlign: 'center',
})

/** Estado "carregando…": cobre todo o viewport com um véu do fundo. */
export const loading = style([
  overlayBase,
  {
    insetBlockEnd: 0,
    background: vars.color.institutional.paperWarm,
    fontFamily: vars.font.family.body,
    fontSize: vars.font.size.xs,
    color: vars.color.text.muted,
  },
])

/** Estado de erro: nota honesta + caminho para baixar o arquivo (mantém o documento acessível). */
export const error = style([
  overlayBase,
  {
    insetBlockEnd: 0,
    background: vars.color.institutional.paperWarm,
    fontFamily: vars.font.family.body,
    fontSize: vars.font.size.xs,
    color: vars.color.text.secondary,
  },
])

/** Link de download do blob (fallback do estado de erro). */
export const downloadLink = style({
  color: vars.color.institutional.blueDeep,
  fontWeight: vars.font.weight.bold,
  textDecoration: 'underline',
})
