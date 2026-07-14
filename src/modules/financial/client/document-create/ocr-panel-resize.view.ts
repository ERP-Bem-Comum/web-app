/**
 * Redimensionamento da coluna OCR (Lançar Documento) — helpers PUROS (sem React/I/O, §XI · ADR-0009).
 * A largura da coluna de pré-visualização do documento é UI-state persistida; o binding usa estas funções
 * e a página aplica a largura via a CSS var `--ocr-col-width` (inline) que o grid do `body` consome (com
 * clamp de segurança no CSS). px cru aqui é uma dimensão de runtime controlada pelo usuário (preferência),
 * não um valor de design — por isso não é token (mesmo caso do `--ocr-zoom`).
 */
export const OCR_MIN_PX = 256 // 16rem — largura mínima útil p/ ler o documento
export const OCR_MAX_PX = 768 // 48rem — teto (não engolir o formulário)
export const OCR_DEFAULT_PX = 448 // 28rem — padrão inicial
export const OCR_STEP_PX = 24 // passo do teclado (ArrowLeft/ArrowRight)

// Mantém a largura dentro de [MIN, MAX] e inteira (px). Determinístico, sem relógio.
export const clampOcrWidth = (px: number): number =>
  Math.min(OCR_MAX_PX, Math.max(OCR_MIN_PX, Math.round(px)))

// Lê a largura persistida (localStorage) → px clampado; ausente/ inválida → o padrão.
export const parseSavedOcrWidth = (raw: string | null): number => {
  if (raw === null || raw === '') return OCR_DEFAULT_PX
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? clampOcrWidth(n) : OCR_DEFAULT_PX
}
