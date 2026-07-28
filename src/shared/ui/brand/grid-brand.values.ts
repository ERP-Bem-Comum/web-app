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
    // "No limite" (linha do relatório Sem Contrato com restante = 0 / 100% exato) — tinta neutra suave
    // (não é violação como o danger; é o teto exatamente esgotado). Mesma sutileza das demais tintas.
    atLimitBg: '#ecebe7',
    atLimitFg: '#5c584f',
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
    // Paleta dos GRÁFICOS do relatório "Realizado × Planejado" (donut/barras SVG). Hex cru permitido aqui
    // (é um `*.values.ts`, isento do lint só-tokens). A UI aplica via classe (styleVariants no .css.ts) —
    // as views não importam tokens (§boundaries client-ui ↛ ds-tokens).
    chart: {
      // Trio "Realizado vs Previsto" (legendas do legado): Realizado verde, Previsto ciano, Provisionado âmbar.
      realizado: '#1a6f4b',
      previsto: '#32a2c6',
      provisionado: '#c67c1e',
      // 7 fatias do donut "Distribuição por Centro de Custo" (uma por CC) — tons distintos e legíveis.
      cc1: '#396496',
      cc2: '#32a2c6',
      cc3: '#1a6f4b',
      cc4: '#c67c1e',
      cc5: '#8a5cd1',
      cc6: '#c0453c',
      cc7: '#5c8a3a',
      // Barra da "Distribuição Mensal" (planejado por mês).
      bar: '#396496',
      barTrack: '#eef1f5',
    },
    // Paleta EXATA do mock "realizado-planejado-v2" (relatório redesenhado). Trio de cores das medidas +
    // fundos dos níveis da árvore. Hex cru permitido aqui (é um `*.values.ts`). A UI aplica via classe.
    rxp: {
      // --realizado (verde), --provisionado (âmbar), --previsto = primary (azul).
      realizado: '#1f7d55',
      provisionado: '#f8b221',
      previsto: '#396496',
      // Fundos dos níveis da árvore: 1º nível (categoria) mais presente; 2º (subcategoria) mais claro.
      childBg1: '#e7f0fb',
      childBg2: '#f3f8fd',
      // Hover dos níveis (levemente mais saturado que o fundo).
      childBg1Hover: '#dbe9f8',
      childBg2Hover: '#e9f2fb',
      // Linha de GRUPOS de mês (thead1) — azul claro, distinta da sub-linha (thead2, cinza surfaceAlt) abaixo.
      monthHeadBg: '#e6edf7',
      // Anel do nó-folha da árvore (tree-node dot) — contorno na cor primary.
      treeNodeBorder: '#396496',
    },
    // Paleta dos GRÁFICOS do relatório "Equipe ABC" (donut Gênero, barras verticais Raça/Cor, barras
    // horizontais Idade/Função, linha por Ano). Hex cru permitido aqui (é um `*.values.ts`, isento do lint
    // só-tokens). A UI aplica via classe (styleVariants no `.css.ts`) — as views não importam tokens
    // (§boundaries client-ui ↛ ds-tokens). Tons distintos e legíveis, dentro da família "brand".
    equipe: {
      // ── Cores por CATEGORIA, chaveadas pelo `id` canônico do backend (core-api#477) ──
      // Antes eram `gen1..3`/`raca1..6` aplicadas por ÍNDICE, casando com a ordem da lista canônica local.
      // Quando o endpoint agregado passou a mandar 9 gêneros e 7 raças em OUTRA ordem, cada cor foi parar
      // na categoria errada (Pardo com o marrom do Preto, N/A com o roxo do "prefiro não revelar").
      // Chavear pelo `id` — que é estável e é justamente o que o backend garante — elimina a classe do bug:
      // categoria nova sem cor cai no neutro, em vez de roubar a cor da vizinha.
      genero: {
        MULHER_CIS: '#396496', // azul da marca
        HOMEM_CIS: '#32a2c6', // ciano
        MULHER_TRANS: '#7b5ea7', // roxo
        HOMEM_TRANS: '#2f8f6a', // verde-azulado
        TRAVESTI: '#c2557a', // rosa queimado
        NAO_BINARIO: '#c67c1e', // âmbar
        OUTRO: '#7a8794', // cinza médio
        PREFIRO_NAO_RESPONDER: '#b8c0cc', // cinza claro — não-resposta
        NA: '#d5dae1', // cinza mais claro — ausência de dado
      },
      raca: {
        BRANCO: '#396496', // azul
        PRETO: '#5c3d2e', // marrom terroso
        PARDO: '#c67c1e', // âmbar
        AMARELO: '#d4a017', // dourado
        INDIGENA: '#2f8f6a', // verde — categoria que o front antigo OMITIA
        PREFIRO_NAO_RESPONDER: '#b8c0cc', // cinza claro — não-resposta
        NA: '#d5dae1', // cinza mais claro — ausência de dado
      },
      /** Cor de categoria desconhecida (ex.: balde `OUTROS`): neutro, nunca a cor de outra categoria. */
      categoriaFallback: '#98a2b3',
      /** Contorno do rótulo escrito DENTRO da fatia da pizza — dá contraste sobre fatias claras. */
      pieLabelOutline: 'rgba(0,0,0,.35)',
      // Barras horizontais e linha (por Ano) — trilho neutro. `bar` (Idade) = ciano da marca, como no
      // legado. `bar2` (Função) = azul mais escuro: no legado os dois são ciano, mas aqui eles aparecem
      // LADO A LADO na mesma linha da grade, e duas cores iguais fazem parecer o mesmo gráfico repetido
      // (a P.O. apontou em tela). Mesma família, tom distinto — diferencia sem quebrar a identidade.
      bar: '#32a2c6',
      bar2: '#2b6d8f',
      barTrack: '#eef1f5',
      line: '#396496',
    },
    // Paleta dos GRÁFICOS do Dashboard financeiro (donut "Pagamentos por Centro de Custo"), harmonizada com
    // o Equipe ABC: tons dessaturados da família "brand" (sem o vermelho de erro que destoava numa categoria
    // neutra). Set categórico coeso: azul → ciano → verde-azulado → âmbar. A linha "Visão Geral" usa os
    // tokens de tema `vars.color.chart.*` (retonados junto). Aplicado por classe (styleVariants) — §boundaries.
    dash: {
      donut1: '#396496', // azul institucional
      donut2: '#32a2c6', // ciano suave
      donut3: '#2f8f6a', // verde-azulado
      donut4: '#c67c1e', // âmbar (substitui o vermelho)
    },
    // Paleta das 3 MEDIDAS DERIVADAS do relatório "Posição de Pagamentos" + o Total. As medidas NÃO são status
    // crus: Em atraso (não pago e vencido), Pago (liquidado), A pagar (não pago e a vencer); o Total é a soma.
    // Hex cru permitido aqui (é um `*.values.ts`, isento do lint só-tokens); a UI aplica por classe
    // (styleVariants no `.css.ts`) — as views não importam tokens (§boundaries client-ui ↛ ds-tokens).
    // Semântica de cor: vermelho (atenção/atraso) → verde (pago) → âmbar (a pagar) → azul institucional (total).
    posicao: {
      emAtraso: '#c0453c', // vermelho — vencido e não pago
      pago: '#1f7d55', // verde — liquidado
      aPagar: '#f8b221', // âmbar — a vencer
      total: '#396496', // azul institucional — soma das 3
      // Fundo SUAVE tintado do card "Total" (destaque do branco) — tom claro do azul institucional.
      totalTintBg: '#eef3fa',
      // Divisória do card tintado (Total) — tom + forte do tint p/ a linha aparecer entre segmentos tintados.
      totalTintLine: '#caddf2',
    },
    // Paleta dos GRÁFICOS da "Posição de RECEBIMENTOS" — família DISTINTA da de Pagamentos (a P.O. pede
    // diferenciar as duas telas pela cor dos gráficos). Tons mais frios/violeta ("dinheiro que entra"):
    // âmbar-laranja (em atraso) / verde-azulado (recebido) / ciano (a receber) / roxo (barras por financiador).
    posicaoRec: {
      emAtraso: '#c67c1e', // âmbar-laranja — vencido e não recebido (≠ vermelho de Pag)
      recebido: '#2f8f6a', // verde-azulado — recebido
      aReceber: '#32a2c6', // ciano — a receber
      bar: '#7ab5e0', // azul claro — barras "Distribuição por Financiador" (mais leve que o azul de Pag)
    },
    // Análise de Pagamentos: barras "Distribuição Mensal" em CIANO — distingue do azul institucional das
    // barras "Distribuição por Centro de Custo" (dois gráficos na mesma tela não repetem a cor). A Análise de
    // RECEBIMENTOS (espelho) usa uma família DISTINTA (a P.O. pede diferenciar Pag×Rec pela cor dos gráficos):
    // barras "por Centro de Custo" em VERDE-AZULADO + barras "Mensal" em ROXO — sem tocar as de Pagamentos.
    analise: {
      monthBar: '#32a2c6', // ciano da marca — barras "Distribuição Mensal" (Pagamentos)
      costBarRec: '#2f8f6a', // verde-azulado — barras "Distribuição por Centro de Custo" (Recebimentos)
      monthBarRec: '#8a5cd1', // roxo suave — barras "Distribuição Mensal" (Recebimentos)
    },
    // Paleta do relatório "Fluxo de Caixa" — 2 MEDIDAS por seção (Realizado × Previsto) + o gráfico mensal
    // Entradas × Saídas + o Saldo. Semântica de cor: Realizado verde (efetivado), Previsto azul institucional;
    // Entradas verde (dinheiro que entra), Saídas âmbar (dinheiro que sai); Saldo positivo verde / negativo
    // vermelho. Hex cru permitido aqui (é um `*.values.ts`, isento do lint só-tokens); a UI aplica por classe
    // (styleVariants no `.css.ts`) — as views não importam tokens (§boundaries client-ui ↛ ds-tokens).
    fluxo: {
      realizado: '#33876a', // verde suave — valor realizado (efetivado)
      previsto: '#4e769f', // azul frio dessaturado — valor previsto
      entrada: '#33876a', // verde suave — Entradas (inflow) no gráfico mensal por vencimento
      saida: '#c99a58', // âmbar suave — Saídas (outflow) no gráfico mensal por vencimento
      barTrack: '#eef1f5', // trilho neutro das barras
      saldoPos: '#33876a', // verde suave — Saldo positivo (entradas ≥ saídas)
      saldoNeg: '#c07a72', // vermelho DESSATURADO (rosa-tijolo) — Saldo negativo, tom mais frio/suave
      // Fundo tintado do card de Saldo NEGATIVO — MUITO suave e neutro (a P.O. achou o vermelho forte demais).
      saldoNegTintBg: '#f6eeee',
      // Divisória do card de Saldo negativo — tom + forte do tint (aparece entre dois cards tintados).
      saldoNegTintLine: '#e7d6d4',
      // Cores dos 4 gráficos "Previsto × Realizado" — paleta FRIA e SUAVE (dessaturada): Previsto azul-aço,
      // Realizado verde-frio, Saldo verde-pálido. Distintas dos tokens dos KPIs/tabelas acima (não os alteram).
      previstoChart: '#7ba0c4', // azul-aço suave — série "Previsto/Esperado" (timeline, barras CC, donuts)
      realizadoChart: '#5aa78f', // verde-frio suave — série "Realizado"
      saldoLine: '#a9cdbc', // verde-pálido — série "Saldo" na linha do tempo
      // Opacidade dos preenchimentos (barras/donut) — leve transparência p/ suavizar (a P.O. pediu).
      fillOpacity: '0.82',
      // ── Demonstrativo de fluxo de caixa (statement por mês) — cores das faixas de seção + linhas totais. ──
      stmtInInk: '#33876a', // texto/ícone da seção Entradas (verde)
      stmtInBand: '#e9f3ee', // faixa de fundo da seção "+ Entradas"
      stmtOutInk: '#c07a72', // texto/ícone da seção Saídas (rosa-tijolo suave)
      stmtOutBand: '#f7ebea', // faixa de fundo da seção "− Saídas"
      stmtTotBg: '#eef2f8', // fundo da coluna/linha "Total"
      stmtSaldoBg: '#f7f8fa', // fundo das linhas Saldo inicial/acumulado
      stmtNetNegBg: '#f6eeee', // fundo da linha "Fluxo líquido" quando negativo
      stmtNetPosBg: '#e9f3ee', // fundo da linha "Fluxo líquido" quando positivo
    },
  },
  // Medidas específicas do relatório redesenhado (px cru permitido no `*.values.ts`).
  rxp: {
    // Barra de cor à esquerda dos KPIs.
    kpiAccentWidth: '4px',
    // Recuo por nível na árvore da tabela (o mock usa 22px/nível).
    treeIndent: '22px',
    // Diâmetro do nó-folha (tree-node dot).
    treeNode: '8px',
    // Mini-barra de AV% na célula consolidada.
    avBarWidth: '38px',
    avBarHeight: '6px',
    // Track/thumb da barra horizontal "Por centro de custo".
    hbarHeight: '18px',
    // Coluna do nome no gráfico de barras horizontais.
    hbarNameCol: '180px',
    // Fonte dos rótulos de eixo/mês do SVG e da legenda "execução" do donut.
    svgAxisFont: '10px',
    // Espessura da linha do gráfico mensal.
    lineStroke: '2.5px',
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
