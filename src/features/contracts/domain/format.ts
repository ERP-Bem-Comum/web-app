import type { ContractRow } from './types'
import { jsPDF } from 'jspdf'

export function formatContractNumber(code: string): string {
  const match = code.match(/(CT|OS|CNT|C|A)-(\d{4})-(\d{4})/)
  if (match) {
    const prefix = match[1] === 'CNT' || match[1] === 'C' ? 'CT' : match[1] === 'A' ? 'OS' : match[1]
    return `${prefix} ${match[3]}/${match[2]}`
  }
  return code
}

/**
 * Formata o número de um aditivo a partir do código do contrato base.
 * Padrão: AD {sequencial} {numero}/{ano}
 * Ex: contractCode="CT-2026-0001", index=1 → "AD 01 0001/2026"
 */
export function formatAditiveNumber(contractCode: string, index: number): string {
  const match = contractCode.match(/(CT|OS|CNT|C|A)-(\d{4})-(\d{4})/)
  if (match) {
    const seq = String(index).padStart(2, '0')
    return `AD ${seq} ${match[3]}/${match[2]}`
  }
  return `AD ${String(index).padStart(2, '0')} ${contractCode}`
}

function buildContractText(row: ContractRow): string {
  const subject = row.supplier?.name || row.financier?.name || row.collaborator?.name || 'N/A'
  const doc = row.supplier?.cnpj || row.financier?.cnpj || row.collaborator?.cpf || '-'
  const valor = (row.totalValue as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  const periodoStart = row.contractPeriod?.start ? new Date(row.contractPeriod.start).toLocaleDateString('pt-BR') : '-'
  const periodoEnd = row.contractPeriod?.end ? new Date(row.contractPeriod.end).toLocaleDateString('pt-BR') : '-'

  return [
    `Contrato Nº: ${row.contractCode}`,
    ``,
    `Contratado: ${subject}`,
    `Documento: ${doc}`,
    `Objeto: ${row.object}`,
    `Tipo: ${row.contractType}`,
    `Status: ${row.contractStatus}`,
    `Valor: R$ ${valor}`,
    `Período: ${periodoStart} a ${periodoEnd}`,
    ``,
    `Documento gerado em ${new Date().toLocaleDateString('pt-BR')}.`,
  ].join('\n')
}

function createContractPDF(row: ContractRow, title: string, extraLines: string[]): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = 20

  // Header bar
  doc.setFillColor(57, 100, 150) // brand-blue #396496
  doc.rect(0, 0, pageWidth, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ERP FINANCEIRO', margin, 8)

  y = 28

  // Title
  doc.setTextColor(31, 28, 26) // ink-1
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin, y)
  y += 10

  // Divider
  doc.setDrawColor(229, 222, 212) // paper-rule
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // Contract info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(77, 71, 64) // ink-3

  const lines = buildContractText(row).split('\n')
  for (const line of lines) {
    if (line.trim() === '') {
      y += 4
      continue
    }
    const splitLines = doc.splitTextToSize(line, contentWidth)
    doc.text(splitLines, margin, y)
    y += splitLines.length * 5 + 1
  }

  y += 6

  // Extra content
  doc.setTextColor(77, 71, 64)
  for (const line of extraLines) {
    if (line.trim() === '') {
      y += 4
      continue
    }
    const splitLines = doc.splitTextToSize(line, contentWidth)
    doc.text(splitLines, margin, y)
    y += splitLines.length * 5 + 1
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10
  doc.setFontSize(8)
  doc.setTextColor(153, 145, 135) // ink-5
  doc.text('Documento gerado digitalmente via ERP Financeiro.', margin, footerY)

  return doc
}

export function downloadPaymentHistoryDocument(row: ContractRow) {
  const extra = [
    '',
    'HISTÓRICO DE PAGAMENTOS',
    '',
    'Pagamentos realizados:',
    '- Este contrato possui pagamentos registrados no módulo financeiro.',
    '- Para mais detalhes, consulte o sistema ERP Financeiro.',
  ]
  const doc = createContractPDF(row, 'HISTÓRICO DE PAGAMENTOS', extra)
  doc.save(`historico-pagamentos-${row.contractCode}.pdf`)
}

export function downloadSettlementDocument(row: ContractRow) {
  const extra = [
    '',
    'TERMO DE QUITAÇÃO',
    '',
    'Pelo presente instrumento, declara-se quitado o contrato acima identificado,',
    'conforme execução contratual e pagamentos realizados.',
    '',
    `Data: ${new Date().toLocaleDateString('pt-BR')}`,
  ]
  const doc = createContractPDF(row, 'TERMO DE QUITAÇÃO', extra)
  doc.save(`termo-quitacao-${row.contractCode}.pdf`)
}
