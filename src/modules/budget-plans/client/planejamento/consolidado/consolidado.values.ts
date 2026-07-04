/**
 * Valores brutos LOCAIS da tela Consolidado ABC "brand" (isento do lint só-tokens por ser `*.values.ts`,
 * como `grid-brand.values.ts` / `planejamento.values.ts`). Cobre o que o mock `consolidado-brand` usa e que
 * NÃO existe no kit `brand` nem em `planejamento`: a tag âmbar "A pagar", o fundo das sub-linhas da matriz e
 * as MEDIDAS finas (px) do mock que o lint só-tokens não permite cruas nos `.css.ts`. O restante (primary,
 * ink*, line, cadBg, radius, sombras…) vem de `brand`; o conector de árvore reusa `planejamento.treeLine`.
 */
export const consolidado = {
  // Tag "A pagar" — âmbar sóbrio (mock: bg #fdf1d9 / fg #9a6a08).
  payBg: '#fdf1d9',
  payFg: '#9a6a08',
  // Fundo levemente diferente das sub-linhas (filhas) da matriz.
  childBg: '#fafbfd',
  // Conector de árvore (linha vertical + ramo) — mesmo tom do Planejamento.
  treeLine: '#d7ddea',
  // Hover das linhas / botões-ícone (azul bem diluído do mock).
  rowHover: '#f4f7fc',
  iconHover: '#e9edf4',
  // Chip de ícone do rodapé "Total" (levemente mais frio que o cadBg).
  footerChipBg: '#e7ebf4',
  // Medidas (px) do mock — cruas aqui (values.ts é isento do lint só-tokens).
  size: {
    // Cabeçalho da página.
    pageIcon: '46px',
    // Card resumo.
    summaryDoc: '44px',
    summaryTitle: '17px',
    summaryTotalVal: '24px',
    progTagPadBlock: '2px',
    progTagPadInline: '9px',
    progTagFont: '11.5px',
    // Barra de filtros.
    ctrlH: '40px',
    selectMinW: '150px',
    ddMinW: '190px',
    ddPanelMaxH: '260px',
    checkbox: '16px',
    // Section head da matriz.
    sectionDoc: '34px',
    sectionTitleFont: '16px',
    segPad: '3px',
    segBtnPadBlock: '7px',
    segBtnPadInline: '14px',
    segBtnFont: '13px',
    navBtn: '34px',
    // Grid da matriz.
    firstColMin: '280px',
    monColMin: '120px',
    gridMinW: '900px',
    theadPadBlock: '13px',
    theadFont: '11.5px',
    rowPadBlock: '15px',
    rowPadInline: '18px',
    footerPadBlock: '16px',
    // Célula do nome.
    chevron: '22px',
    chevronRadius: '6px',
    ccChip: '32px',
    ccChipSm: '28px',
    ccChipRadius: '9px',
    nameFont: '14px',
    subFont: '12px',
    nameGap: '1px',
    payPadBlock: '2px',
    payPadInline: '8px',
    payFont: '10.5px',
    childIndent: '38px',
    // Conector de árvore. insetX = padding da célula (18) + 9 do mock → o nó/linha ficam SOB a coluna do
    // chevron do pai (não na margem esquerda), alinhados verticalmente com a árvore, como no mock.
    treeInsetX: '27px',
    treeInsetY: '-15px',
    // Compensação positiva (= |treeInsetY|): usada no PRIMEIRO filho p/ a linha começar no topo da própria
    // linha (não subir para o pai).
    treeInsetYPos: '15px',
    treeWidth: '20px',
    treeLineOffset: '6px',
    treeLineWidth: '2px',
    treeBranch: '14px',
    treeDotInset: '3px',
    treeDot: '8px',
    treeDotBorder: '2px solid',
  },
} as const
