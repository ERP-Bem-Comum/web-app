/**
 * Design tokens — VALORES crus (tema claro), fiéis à identidade da v1.
 *
 * Módulo PURO: objeto `as const`, sem import de framework/vanilla-extract — é a fonte
 * única de verdade dos valores e é testável por `node:test` (ver tests/shared/ui/tokens).
 * O `theme.css.ts` consome este objeto ao aplicar `createGlobalTheme(':root', vars, …)`.
 *
 * ⚠ Marca: TESTE de azul sóbrio (#2B6CB0) por pedido da stakeholder — pendente de validação do P.O.
 * (a marca v1 original era o ciano #32C6F4). Reverter trocando os tokens de acento de volta. NÃO herdar
 * a paleta "institucional" da v1 (azul #396496 / verde #1f7d55). Ver ADR-0007/0008 e data-model.md.
 *
 * Famílias self-host via @fontsource (ADR-0008): os family-names abaixo casam com os
 * registrados pelos pacotes (`Inter Variable`, `Nunito Variable`, `JetBrains Mono`).
 */

const SANS_FALLBACK =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const MONO_FALLBACK = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'

export const tokenValues = {
  color: {
    brand: {
      normal: '#2B6CB0',
      hover: '#3F84C6',
      onBrand: '#FFFFFF',
      disabled: '#E0E0E0',
      onDisabled: '#6F6F6F',
    },
    surface: {
      default: '#ffffff',
      raised: '#ffffff',
      // Fundo de "tela" (canvas) — fallback quando a imagem de fundo do login não carrega.
      // Tom de marca claro (provisório; P.O. confirma). Contrasta com o card branco.
      canvas: '#E7EFF8',
      // Fundo sutil/cinza claro para telas de autenticação (login).
      subtle: '#F5F5F7',
      // Fundo do SHELL autenticado (canvas do app por trás de cards/tabelas). Legado
      // `.bg-erp-background` = rgb(232 238 240). Cinza-frio neutro, baixo contraste.
      app: '#E8EEF0',
    },
    text: {
      primary: '#292820',
      secondary: '#4d4740',
      muted: '#736b61',
      onBrand: '#000000',
    },
    border: {
      default: '#e5ded4',
      focus: '#2B6CB0',
      // Hairline neutra-fria (~oklab 14% da marca sobre branco): define a aresta de superfícies
      // elevadas sobre fundo claro de baixo contraste (ex.: card de login sobre o canvas ciano)
      // sem a dissonância quente do `default`. Harmoniza com branco E com o canvas.
      subtle: '#d6e4ea',
    },
    feedback: {
      errorBg: '#fef2f2',
      errorText: '#dc2626',
    },
    // Chrome / navegação (sidebar + topbar) — índigo institucional do legado
    // (`.bg-erp-nav` = rgb(70 78 120) = #464E78). NÃO é a marca (ciano): é a moldura.
    nav: {
      // Fundo da sidebar.
      background: '#464E78',
      // Fundo da topbar (barra superior).
      surface: '#ffffff',
      // Item ativo na sidebar = cor de marca (ciano); casa com color.brand.normal.
      itemActive: '#2B6CB0',
      // Hover de item de nav (branco a 6% sobre o índigo).
      itemHover: 'rgba(255,255,255,0.06)',
      // Fundo do grupo de sub-itens (escurece o índigo).
      submenuBackground: 'rgba(0,0,0,0.15)',
      // Texto de item ativo (sobre índigo ou sobre ciano).
      textActive: '#ffffff',
      // Texto de item inativo (lavanda dessaturada).
      textMuted: '#b0b3c7',
      // Tinta forte do título do chrome ("Bem Comum" na topbar).
      ink: '#1a1a2e',
      // Texto neutro de topbar (saudação, item de menu) — ardósia.
      textOnSurface: '#334155',
      // Borda/hairline do chrome (borda inferior da topbar, borda do dropdown).
      border: '#e2e8f0',
      // Hover de superfície clara do chrome (botão de usuário, item "Sair").
      surfaceHover: '#f1f5f9',
    },
    status: {
      // Pendente — âmbar suave (antes laranja saturado #E65100/#FFF3E0).
      pendingBg: '#FFF4E5',
      pendingText: '#B45309',
      activeBg: '#E8F5E9',
      activeText: '#2E7D32',
      finishedBg: '#E3F2FD',
      finishedText: '#1565C0',
      // Distrato — vermelho-tijolo suave (antes #C62828/#FFEBEE).
      terminatedBg: '#FCECEA',
      terminatedText: '#C0453C',
      // Cancelado (§1.7) — NEUTRO/cinza, distinto do vermelho do distrato (cancelar Pendente ≠ distratar).
      cancelledBg: '#F2EDE5',
      cancelledText: '#736961',
      prazoBg: '#E0F7FA',
      prazoText: '#298CAB',
      valorBg: '#E8F5E9',
      valorText: '#33B266',
      escopoBg: '#FFF8E1',
      escopoText: '#D97706',
      distratoBg: '#FFEBEE',
      distratoText: '#E54D40',
      outroBg: '#F5F5F5',
      outroText: '#736961',
      // Aditivos: marrom (escopo) e laranja (outro) — paleta própria, distinta do reuso
      // de escopo* pelo chip "Vencendo" e pela timeline (não regredir aqueles).
      aditEscopoBg: '#EFE6DC',
      aditEscopoText: '#8A5A33',
      aditOutroBg: '#FFF1E0',
      aditOutroText: '#D9772E',
      // #201 — Aprovado = AZUL CLARO (distinto do azul de "Transmitido"=finished) e Conciliado = ROXO,
      // p/ não repetir cor nos badges (Pago=verde/active, Transmitido=azul/finished, Aberto=amarelo/pending).
      approvedBg: '#EAF4FE',
      approvedText: '#1E88E5',
      reconciledBg: '#EBE5F7',
      reconciledText: '#5B3D9E',
    },
    // Tipos de parceiro/contrato (badges). Paleta por tipo (brand do cliente):
    //   Fornecedor = azul · Colaborador = amarelo · Financiador = verde · ACT = laranja.
    // `background`/`border` em tint de baixa opacidade.
    partnerType: {
      supplier: { text: '#1d6cab', background: '#e9f2fb', border: '#a8cdee' }, // azul (mais limpo, menos teal)
      collaborator: { text: '#b07d12', background: '#fff7e0', border: 'rgba(217,153,26,0.30)' }, // amarelo
      financier: { text: '#1c7943', background: 'rgba(51,178,102,0.10)', border: 'rgba(51,178,102,0.25)' }, // verde
      act: { text: '#c2410c', background: 'rgba(234,88,12,0.10)', border: 'rgba(234,88,12,0.22)' }, // laranja
    },
    // Séries de gráfico (Dashboard "Resumo Mensal", feature 043). Papel dedicado: cor de
    // SÉRIE/eixo/grid de gráfico SVG nativo, não reaproveita os papéis de badge/status. O ciano
    // #32C6F4 é fiel ao legado (série "Previsto" = papel de AÇÃO da marca v1); `realized` reusa o
    // verde institucional (#1f7d55); `grid`/`axis` reusam border.subtle / text.muted.
    chart: {
      forecast: '#32C6F4',
      realized: '#1f7d55',
      grid: '#d6e4ea',
      axis: '#736b61',
    },
    institutional: {
      blue: '#396496',
      blueDeep: '#2d4f75',
      blueBg: '#e8eef5',
      blueLine: '#8bb0d6',
      green: '#1f7d55',
      greenDeep: '#176642',
      orange: '#F5A623',
      orangeLight: '#FFF8E7',
      ink2: '#332e29',
      ink3: '#4d4740',
      ink4: '#736b61',
      ink5: '#999187',
      paperRule: '#e5ded4',
      paperWarm: '#faf7f2',
      paperBeige: '#f2ede5',
      overlay: 'rgba(0,0,0,0.45)',
      surfaceTranslucent: 'rgba(255,255,255,0.92)',
    },
  },
  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
  space: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  font: {
    family: {
      heading: `"Inter Variable", ${SANS_FALLBACK}`,
      body: `"Nunito Variable", ${SANS_FALLBACK}`,
      mono: `"JetBrains Mono", ${MONO_FALLBACK}`,
    },
    size: {
      // Degrau denso do Figma DS v1 (Badge/header de grid = 9px). Aditivo — não altera os existentes.
      '2xs': '0.5625rem',
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  shadow: {
    // Elevação base do átomo Card (sobre fundo branco): discreta.
    card: '0 4px 22px 0 rgba(0, 0, 0, 0.05)',
    // Elevação em CAMADAS (ambient de contato + key light com spread negativo): separa a superfície
    // de um fundo claro de baixo contraste. Usada na variante `elevated` (card do login).
    cardElevated: '0 1px 2px 0 rgba(0, 0, 0, 0.06), 0 8px 24px -4px rgba(0, 0, 0, 0.12)',
  },
  // Anel de foco (acessibilidade): largura do traço + distância. Conceito semântico próprio —
  // um tema de alto contraste pode engrossar o anel sem tocar nos componentes. A cor vive em
  // color.border.focus. Não há degrau de 2px em `space` (xs já é 4px), por isso token dedicado.
  focusRing: {
    width: '2px',
    offset: '2px',
  },
  // Largura de traço de borda. `thin` (1px, hairline) é a borda padrão de input/superfície.
  // Vira token porque o lint "só-tokens" do DS proíbe `px` cru — INCLUSIVE 1px e dentro de
  // template literal (não há exceção). Um tema de alto contraste pode engrossar sem tocar
  // componentes. A COR da borda vive em color.border.*; aqui é só a espessura.
  borderWidth: {
    // Traço sub-pixel (0.5px) — bordas delicadas de badges/chips, fiel à v1.
    hairline: '0.5px',
    thin: '1px',
    thick: '2px',
  },
  // Dimensões semânticas de layout. `topbar` = altura da barra superior fixa do shell, referenciada
  // em 3 pontos que precisam concordar (header, paddingBlockStart do shell, calc do body) — token único.
  size: {
    topbar: '3.5rem',
  },
} as const

export type TokenValues = typeof tokenValues

/**
 * Forma (estrutura) do tema, sem amarrar aos literais — todo valor-folha é `string`.
 * Útil para provar que um tema alternativo (ex.: dark) satisfaz o MESMO contrato
 * sem precisar repetir os valores exatos do tema claro. Ver contract-extensibility.test.ts.
 */
type DeepTokenShape<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : DeepTokenShape<T[K]>
}
export type TokenShape = DeepTokenShape<TokenValues>
