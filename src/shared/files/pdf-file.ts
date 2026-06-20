/**
 * Aceitação robusta de PDF na borda da UI. `File.type` é NÃO-confiável por spec (pode vir vazio ou
 * divergente conforme SO/navegador/origem do drag-drop), então aceitamos por MIME `application/pdf`
 * OU pela extensão `.pdf` do nome. A validação REAL (magic bytes `%PDF`) acontece no backend ao anexar.
 * Tipo estrutural (não `File`) para ser testável sem o global `File`. PURA.
 */
export const isPdfFile = (file: Readonly<{ type: string; name: string }>): boolean =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
