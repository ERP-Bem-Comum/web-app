/**
 * Tokens ESCOPADOS da nova identidade de Colaboradores (mock "colaboradores-brand"). Espelha 1:1 a paleta,
 * raios, sombras, medidas e tipografia do mock — em px/hex CRUS, o que é permitido só em `*.values.ts`
 * (o lint só-tokens isenta este arquivo, como faz com `recon.values.ts`). A UI consome via os `*.css.ts`.
 *
 * ⚠️ Isolado no módulo (zero regressão no DS global). "Base" para propagar às demais telas depois.
 */
export const collab = {
  color: {
    // Marca (azul institucional do cliente).
    primary: '#396496',
    primaryHover: '#2f5480',
    // Tintas (cinza-azulado frio).
    ink900: '#1a2333',
    ink700: '#384152',
    ink500: '#6b7480',
    ink400: '#98a2b3',
    // Linhas / superfícies.
    line: '#e6e9ef',
    line2: '#eef1f5',
    surface: '#ffffff',
    surfaceAlt: '#f7f8fa',
    rowHover: '#f4f7fc',
    pageBg: '#f2f4f7',
    // Avatar (iniciais).
    avatarBg: '#e7edf4',
    avatarFg: '#396496',
    // Chip "Ativo" (ok — verde).
    okBg: '#e2f1ea',
    okFg: '#1a6f4b',
    okDot: '#1f7d55',
    // Chip "Cadastrado" (cad — azul).
    cadBg: '#e7edf4',
    cadFg: '#345f8f',
    cadDot: '#396496',
    // Chip "Inativo" (danger — vermelho, derivado no mesmo tom do mock).
    dangerBg: '#fcecea',
    dangerFg: '#b23b32',
    dangerDot: '#c0453c',
    // Chip "Pré-cadastro" (warn — âmbar).
    warnBg: '#fbf0dd',
    warnFg: '#8a5a16',
    warnDot: '#c67c1e',
    // Foco (anel suave).
    focusRing: 'rgba(57,100,150,0.14)',
    // Sobreposição p/ estados leves.
    zeroNum: '#98a2b3',
    // Thumb da barra de rolagem (cinza-azulado visível).
    scrollThumb: '#c3ccd8',
    // ── Filtros avançados (mock colaboradores-filtros) ──
    panelBg: '#e9eff6',
    panelBorder: '#d6e0ec',
    groupFg: '#39598c',
    // Chip de filtro aplicado (âmbar do cadastro).
    chipBg: '#fdf6e6',
    chipBorder: '#f0cf7a',
    chipFg: '#916708',
    chipRemoveHover: 'rgba(145,103,8,.12)',
  },
  radius: {
    xs: '6px',
    sm: '8px',
    icon: '10px',
    md: '12px',
    lg: '16px',
    pill: '999px',
  },
  shadow: {
    card: '0 1px 2px rgba(16,24,40,.04),0 1px 3px rgba(16,24,40,.06)',
    btn: '0 1px 2px rgba(16,24,40,.10)',
    focus: '0 0 0 3px rgba(57,100,150,0.14)',
  },
  // grid-template-columns das 7 colunas (idêntico ao mock).
  cols: 'minmax(220px,1.6fr) minmax(200px,1.4fr) .9fr 1fr 1.1fr .8fr 1fr',
  text: {
    thead: '11.5px',
    chip: '11.5px',
    seg: '13px',
    body: '14px',
    avatar: '12px',
    h1: '22px',
    subtitle: '13.5px',
    // Filtros avançados.
    group: '13.5px',
    label: '12.5px',
    panelTitle: '16px',
    panelSub: '12.5px',
    dd: '13px',
    appliedChip: '12.5px',
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
    // Filtros avançados: gaps do grid + padding do painel.
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
    // Chip (pill): padding assimétrico — mais folga à direita (o dot fica à esquerda).
    chipPadBlock: '5px',
    chipPadStart: '9px',
    chipPadEnd: '11px',
    // Botões do cabeçalho / footer.
    btnHeight: '40px',
    pagerHeight: '34px',
    iconBtn: '44px',
    // Toolbar (busca + segmento Todos/Ativos/Inativos) — 44px p/ alinhar com "N filtros aplicados".
    searchH: '44px',
    searchPadStart: '40px',
    segPad: '3px',
    segPadBlock: '8px',
    segPadInline: '16px',
    // Filtros avançados: altura dos controles (44px), caixa do ícone, chip aplicado.
    ctrlH: '44px',
    iconBox: '40px',
    chipH: '32px',
    chipRemove: '20px',
  },
  ease: '.12s',
} as const
