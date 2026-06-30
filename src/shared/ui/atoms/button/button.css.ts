import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { vars } from '../../tokens/index.ts'

// Base do botão (fidelidade v1: full-width, ciano, texto preto, radius, padding). Só `vars.*`.
// `position: relative` ancora o spinner absoluto do estado loading.
const base = style({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  border: 'none',
  cursor: 'pointer',
  paddingBlock: vars.space.sm,
  paddingInline: vars.space.md,
  borderRadius: vars.radius.md,
  fontFamily: vars.font.family.body,
  fontWeight: vars.font.weight.semibold,
  fontSize: vars.font.size.sm,
  background: vars.color.brand.normal,
  color: vars.color.brand.onBrand,
  transitionProperty: 'background-color',
  transitionDuration: '150ms',
  selectors: {
    '&:hover:not(:disabled)': { background: vars.color.brand.hover },
    '&:focus-visible': {
      outline: `${vars.focusRing.width} solid ${vars.color.border.focus}`,
      outlineOffset: vars.focusRing.offset,
    },
  },
})

const disabledStyle = style({
  background: vars.color.brand.disabled,
  color: vars.color.brand.onDisabled,
  cursor: 'not-allowed',
})

// Mapa state→className (decisão A1). `normal` é só a base; disabled/loading compõem base + extra.
export const buttonState = styleVariants({
  normal: [base],
  disabled: [base, disabledStyle],
  loading: [base, disabledStyle, { cursor: 'progress' }],
})

// --- Loading (ADR-0009: dirigido por loginCommand.running) ---

// Esconde o texto VISUALMENTE mantendo a largura (sem layout shift) E o nome acessível: `opacity: 0`
// (a11y só remove por `visibility`/`display`/`aria-hidden`, não por opacity) — o spinner sobrepõe.
export const labelHidden = style({ opacity: 0 })

// Spinner de anel único: conic-gradient (cauda esmaecida) + recorte do miolo por mask.
// Dimensionado em `em` (escala com a fonte do botão); cor = onBrand. `black` na máscara é só o
// canal opaco do recorte (não é cor de design). Suaviza sob prefers-reduced-motion (não remove).
const spin = keyframes({ to: { transform: 'rotate(1turn)' } })

export const spinner = style({
  position: 'absolute',
  inlineSize: '1.25em',
  blockSize: '1.25em',
  insetBlockStart: 'calc(50% - 0.625em)',
  insetInlineStart: 'calc(50% - 0.625em)',
  background: `conic-gradient(transparent 10%, ${vars.color.brand.onBrand})`,
  mask: 'radial-gradient(farthest-side, transparent calc(100% - 0.18em), black 0)',
  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 0.18em), black 0)',
  animationName: spin,
  animationDuration: '0.8s',
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
  '@media': {
    // exceção funcional (css/responsive-a11y): NÃO remover o spinner — desacelerar.
    '(prefers-reduced-motion: reduce)': { animationDuration: '2.4s' },
  },
})

// Visualmente oculto, acessível: carrega o nome "carregando" p/ leitor de tela.
// 1px via token (lint só-tokens proíbe px cru); clip-path moderno (sem px).
export const srOnly = style({
  position: 'absolute',
  inlineSize: vars.borderWidth.thin,
  blockSize: vars.borderWidth.thin,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
})
