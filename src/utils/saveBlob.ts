// Substituto direto de file-saver#saveAs no subset usado: dispara download de um Blob com nome.
// Assume ambiente de browser (todos os callers são Client Components).
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Revogar no próximo tick para garantir que o navegador iniciou o download.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
