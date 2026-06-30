import { style } from '@vanilla-extract/css'

/**
 * Mecanismo de impressão (PDF via window.print): o conteúdo normal da tela é envolvido por `contentWrap`
 * (display:contents — não afeta o layout) e, durante a impressão, trocado por `contentWrapPrintHidden`
 * para esconder o app; só o printable (display:none na tela, block no @media print) aparece. Espelha o
 * padrão do grid de Contratos.
 */
export const contentWrap = style({
  display: 'contents',
})

export const contentWrapPrintHidden = style({
  display: 'contents',
  '@media': {
    print: { display: 'none' },
  },
})
