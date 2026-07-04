/**
 * Valores brutos LOCAIS da tela de Planejamento "brand" (isento do lint só-tokens por ser `*.values.ts`,
 * como `grid-brand.values.ts` / `geography.values.ts`). Cobre o que o mock `planejamento-brand` usa e que
 * NÃO existe no kit brand: cores de status "Rascunho", fundo/linha das sub-linhas, hover dos botões-ícone,
 * e as MEDIDAS finas (px) que o lint só-tokens não permite crus nos `.css.ts`. O restante (primary, ink*,
 * line, cadBg, okBg, radius, sombras…) vem de `brand`.
 */
export const planejamento = {
  // Badge "Rascunho" (cinza neutro do mock).
  draftBg: '#ececeb',
  draftFg: '#5a5b58',
  draftDot: '#9a9b97',
  // Fundo levemente diferente das sub-linhas (planos filhos).
  childBg: '#fafbfd',
  // Conector de árvore (linha vertical + ramo horizontal).
  treeLine: '#d7ddea',
  // Hover dos botões-ícone circulares/quadrados (chevron, kebab).
  iconHover: '#e9edf4',
  // Ring de foco da busca (azul diluído do mock).
  searchFocusRing: '0 0 0 3px rgba(43,75,140,.12)',
  // Nome do plano na sub-linha (levemente mais claro que ink900).
  childName: '#26314a',
  // Medidas (px) do mock — cruas aqui (values.ts é isento do lint só-tokens).
  size: {
    // Cabeçalho da página.
    pageIcon: '46px',
    // Toolbar.
    searchIconInset: '14px',
    createPadInline: '20px',
    // thead / linhas.
    theadPadBlock: '13px',
    theadFont: '12px',
    rowPadBlock: '16px',
    // Célula do nome.
    childIndent: '40px',
    indent: '22px',
    chevron: '22px',
    chevronRadius: '6px',
    planIcon: '34px',
    planIconChild: '30px',
    nameGap: '1px',
    planNameFont: '14.5px',
    subFont: '12.5px',
    // Conector de árvore.
    treeInsetX: '11px',
    treeInsetY: '-18px',
    treeWidth: '20px',
    treeLineOffset: '6px',
    treeLineWidth: '2px',
    treeBranch: '16px',
    treeDotInset: '3px',
    treeDot: '8px',
    treeDotBorder: '2px solid',
    // Badge de status.
    badgePadBlock: '5px',
    badgePadStart: '9px',
    badgePadEnd: '11px',
    badgeFont: '12px',
    dot: '7px',
    sortGap: '4px',
    // Kebab.
    kebab: '30px',
    kebabRadius: '7px',
    kebabFont: '20px',
    // Rodapé.
    footerGap: '11px',
    grandFont: '15px',
  },
} as const
