/**
 * Valores brutos LOCAIS da tela "Calculando Gastos" no padrão visual "brand" (mock `calculando-gastos-brand`).
 * Isento do lint só-tokens por ser `*.values.ts` (como `grid-brand.values.ts` / `consolidado.values.ts`). Cobre
 * o que o mock usa e NÃO existe no kit `brand`: os fundos frios do modal/drawer/seções, o input readonly, a caixa
 * de total tingida, o overlay escuro e as MEDIDAS (px) do mock que o lint não permite cruas nos `.css.ts`. O
 * restante (primary, ink*, line, radius, sombras…) vem de `brand`.
 */
export const calcGastos = {
  color: {
    // Overlay escuro do modal e do drawer (mock: rgba(16,24,40,.45) / .40).
    overlay: 'rgba(16,24,40,.45)',
    drawerOverlay: 'rgba(16,24,40,.40)',
    // Fundo frio do corpo do modal / drawer (mock: --page-bg).
    pageBg: '#eef1f7',
    // Fundo das seções de formulário (mock: --sec-bg).
    secBg: '#eef2f8',
    secBorder: '#e3e9f2',
    // Input somente-leitura (mock: input[readonly] #e9edf3).
    readonlyBg: '#e9edf3',
    // Caixa de total tingida (mock: --tint-blue).
    tintBlue: '#e7edf4',
    // Vermelho da lixeira em hover (mock: --brand-red).
    brandRed: '#d44856',
    // Borda de item/pill em hover (mock: #cfd8e6).
    itemHoverBorder: '#cfd8e6',
    // Trilho de rolagem tingido.
    scrollThumb: '#c3ccd8',
  },
  size: {
    // Modal.
    modalMargin: '22px',
    modalRadius: '18px',
    titlebarH: '56px',
    titlebarPadInline: '20px',
    closeBox: '34px',
    // Abas.
    tabNavW: '44px',
    tabH: '54px',
    tabFont: '13.5px',
    tabRadius: '10px',
    // Corpo (3 colunas).
    bodyPad: '22px',
    colsGap: '20px',
    colRadius: '14px',
    colPad: '16px',
    colTitleFont: '15px',
    litemPadBlock: '12px',
    litemPadInline: '14px',
    litemRadius: '9px',
    litemFont: '13.5px',
    mrowPadBlock: '12px',
    mrowPadInline: '14px',
    mrowRadius: '9px',
    // Rodapé.
    footPadBlock: '14px',
    footPadInline: '20px',
    btnH: '42px',
    btnPadInline: '22px',
    // Drawer.
    drawerW: '470px',
    drawerHeadPad: '16px',
    drawerHeadFont: '16px',
    drawerBodyPad: '18px',
    drawerFootPadBlock: '14px',
    drawerFootPadInline: '18px',
    drawerCloseBox: '32px',
    drawerShadow: '-8px 0 40px rgba(16,24,40,.2)',
    // Seções / campos de formulário.
    fsecPad: '16px',
    fsecRadius: '12px',
    fsecTitleFont: '13.5px',
    fieldGap: '14px',
    fieldLabelFont: '12.5px',
    fieldH: '42px',
    fieldPadInline: '12px',
    fieldChevInset: '12px',
    totalboxPad: '14px',
    totalboxFont: '16px',
    checkRowPadBlock: '11px',
    checkbox: '17px',
    // Pills de mês.
    mpillW: '44px',
    mpillPadBlock: '8px',
    mpillRadius: '7px',
    mpillFont: '12.5px',
    // Caixas de resumo.
    sumboxRadius: '10px',
    sumboxPad: '14px',
    sumboxLabelFont: '12px',
    sumboxValFont: '16px',
    labelMiniFont: '12.5px',
  },
  shadow: {
    modal: '0 24px 70px rgba(16,24,40,.35)',
  },
} as const
