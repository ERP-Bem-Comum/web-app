/**
 * Tokens da identidade de GRID "brand" (mocks colaboradores-brand + colaboradores-filtros), promovidos de
 * Colaboradores (PR #154) para reuso por TODOS os grids (Fornecedores/Financiadores/ACT/Programas/Usuários).
 * px/hex CRUS são permitidos aqui (é um `*.values.ts`, isento do lint só-tokens, como `recon.values.ts`).
 * A UI consome via os `*.css.ts` (BrandDataTable, brand-page, brand-filters, brand-paginator). A COR do
 * avatar é passada por grid (cada tipo mantém a sua — `vars.color.partnerType.*` / neutro / marca).
 */
export const brand = {
  color: {
    primary: '#396496',
    primaryHover: '#2f5480',
    ink900: '#1a2333',
    ink700: '#384152',
    ink500: '#6b7480',
    ink400: '#98a2b3',
    line: '#e6e9ef',
    line2: '#eef1f5',
    lineStrong: '#d3d9e3',
    surface: '#ffffff',
    surfaceAlt: '#f7f8fa',
    // Asterisco de campo obrigatório (vermelho) nos formulários "brand".
    reqStar: '#c0392b',
    rowHover: '#f4f7fc',
    pageBg: '#f2f4f7',
    // Chip "ok" (Ativo — verde).
    okBg: '#e2f1ea',
    okFg: '#1a6f4b',
    okDot: '#1f7d55',
    // Chip "cad" (Cadastrado / azul).
    cadBg: '#e7edf4',
    cadFg: '#345f8f',
    cadDot: '#396496',
    // Chip "danger" (Inativo — vermelho).
    dangerBg: '#fcecea',
    dangerFg: '#b23b32',
    dangerDot: '#c0453c',
    // Chip "warn" (Pré-cadastro — âmbar).
    warnBg: '#fbf0dd',
    warnFg: '#8a5a16',
    warnDot: '#c67c1e',
    focusRing: 'rgba(57,100,150,0.14)',
    zeroNum: '#98a2b3',
    scrollThumb: '#c3ccd8',
    // Filtros avançados.
    panelBg: '#e9eff6',
    panelBorder: '#d6e0ec',
    groupFg: '#39598c',
    // Chip de filtro aplicado (âmbar).
    chipBg: '#fdf6e6',
    chipBorder: '#f0cf7a',
    chipFg: '#916708',
    chipRemoveHover: 'rgba(145,103,8,.12)',
  },
  radius: {
    xs: '6px',
    sm: '8px',
    iconSm: '9px',
    icon: '10px',
    md: '12px',
    lg: '16px',
    pill: '999px',
  },
  shadow: {
    card: '0 1px 2px rgba(16,24,40,.04),0 1px 3px rgba(16,24,40,.06)',
    // Profundidade sobre fundo BRANCO (busca/filtro/exportar/tabela do grid). O 1º nível é um anel fino
    // (0-offset) que dá relevo em TODAS as bordas — inclusive topo e lateral esquerda; os demais são a
    // queda direcional (embaixo/direita) que levanta o cartão.
    cardDepth:
      '0 0 0 1px rgba(16,24,40,.04),0 2px 5px -1px rgba(16,24,40,.10),0 8px 20px -4px rgba(16,24,40,.14)',
    btn: '0 1px 2px rgba(16,24,40,.10)',
    focus: '0 0 0 3px rgba(57,100,150,0.14)',
    // Barra de ações fixa dos formulários "brand" (sombra para cima).
    actionbar: '0 -1px 3px rgba(16,24,40,.05)',
  },
  text: {
    thead: '11.5px',
    chip: '11.5px',
    seg: '13px',
    body: '14px',
    avatar: '12px',
    h1: '22px',
    subtitle: '13.5px',
    group: '13.5px',
    label: '12.5px',
    panelTitle: '16px',
    panelSub: '12.5px',
    dd: '13px',
    appliedChip: '12.5px',
    // Formulário "brand".
    sectionH2: '15px',
    hint: '12px',
  },
  weight: {
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  space: {
    xxs: '2px',
    xs: '7px',
    sm: '10px',
    md: '12px',
    lg: '14px',
    xl: '22px',
    xxl: '28px',
    gridRow: '16px',
    gridCol: '18px',
    panelInl: '24px',
  },
  size: {
    avatar: '34px',
    dot: '7px',
    rowPadInline: '22px',
    theadPadBlock: '13px',
    rowPadBlock: '14px',
    chipPadBlock: '5px',
    chipPadStart: '9px',
    chipPadEnd: '11px',
    btnHeight: '40px',
    pagerHeight: '34px',
    iconBtn: '44px',
    searchH: '44px',
    searchPadStart: '40px',
    segPad: '3px',
    segPadBlock: '8px',
    segPadInline: '16px',
    ctrlH: '44px',
    iconBox: '40px',
    chipH: '32px',
    chipRemove: '20px',
    // Formulário "brand": campo (input/select) 42px; caixa do ícone da seção 32px; botão voltar 40px.
    field: '42px',
    sectionIconBox: '32px',
    backBtn: '40px',
  },
  ease: '.12s',
} as const
