/**
 * Helpers PUROS do preview de PDF (sem React/I/O/DOM — §XI · ADR-0009). O `*.binding.ts` usa estas
 * funções para decidir a ESCALA de rasterização de cada página; a nitidez retina sai de multiplicar a
 * escala lógica pelo `devicePixelRatio` (backing store) e dividir de volta no CSS (tamanho lógico).
 *
 * A escala do canvas é uma dimensão de RUNTIME (pixels de rasterização), não um valor de design — por
 * isso vive aqui em número cru, não em token (mesmo caso do `--ocr-zoom`/`--ocr-col-width`).
 */

/** Faixa de zoom do web view — espelha o controle (− % +) do Lançar Documento. */
export const PDF_ZOOM_MIN = 50
export const PDF_ZOOM_MAX = 200

/** Mantém o zoom (%) dentro de [MIN, MAX] e inteiro. Determinístico. Guarda defensiva (o controle já clampa). */
export const clampPdfZoom = (pct: number): number =>
  Math.min(PDF_ZOOM_MAX, Math.max(PDF_ZOOM_MIN, Math.round(pct)))

/** devicePixelRatio seguro: finito e > 0, senão 1 (SSR/jsdom não têm; evita canvas 0×0 ou NaN). */
export const safeDpr = (dpr: number): number => (Number.isFinite(dpr) && dpr > 0 ? dpr : 1)

/**
 * Escala de rasterização (backing store) de uma página = zoom lógico × dpr. É o `scale` passado ao
 * `page.getViewport({ scale })` do pdf.js → define `canvas.width/height` em pixels de dispositivo.
 */
export const backingScale = (zoomPct: number, dpr: number): number =>
  (clampPdfZoom(zoomPct) / 100) * safeDpr(dpr)

/**
 * Converte um comprimento em pixels de backing (o que o pdf.js rasterizou) para o pixel CSS lógico
 * (o que o canvas OCUPA na tela). `cssPx = backingPx / dpr` → nitidez retina sem "inchar" o layout.
 */
export const cssPxFromBacking = (backingPx: number, dpr: number): number => backingPx / safeDpr(dpr)
