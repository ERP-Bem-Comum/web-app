import { ContractRow } from '@/types/contracts'
import { formatDate } from '@/utils/dates'
import { maskMonetaryValue } from '@/utils/masks'
import { getHistoryById } from '@/services/contracts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function addHeader(doc: jsPDF, title: string, contract: ContractRow) {
  doc.setFontSize(10)
  doc.setTextColor(41, 140, 171)
  doc.text('ERP Financeiro', 14, 12)

  doc.setFontSize(16)
  doc.setTextColor(31, 28, 26)
  doc.text(title, 14, 24)

  doc.setDrawColor(229, 222, 212)
  doc.setLineWidth(0.5)
  doc.line(14, 28, 196, 28)
}

function addContractMeta(
  doc: jsPDF,
  contract: ContractRow,
  startY: number
): number {
  const subject =
    contract.supplier?.name ||
    contract.collaborator?.name ||
    contract.financier?.name ||
    '—'

  doc.setFontSize(9)
  doc.setTextColor(51, 46, 41)

  const metaLines = [
    `Contrato: ${contract.contractCode || '—'}`,
    `Contratado: ${subject}`,
    `Objeto: ${(contract.object || '—').substring(0, 90)}`,
    `Vigência: ${formatDate(contract.contractPeriod?.start) || '—'} a ${formatDate(contract.contractPeriod?.end) || '—'}`,
  ]

  let y = startY
  metaLines.forEach((line) => {
    doc.text(line, 14, y)
    y += 5
  })

  return y + 4
}

export async function downloadPaymentHistoryDocument(contract: ContractRow) {
  try {
    const resp = await getHistoryById(contract.id)
    const history = resp?.data

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    addHeader(doc, 'HISTÓRICO DE PAGAMENTOS', contract)

    let y = addContractMeta(doc, contract, 36)

    if (history?.payable && history.payable.length > 0) {
      const allInstallments = history.payable.flatMap((p) =>
        p.installments.map((inst) => ({
          ...inst,
          type: p.paymentType,
        }))
      )

      allInstallments.sort(
        (a, b) =>
          new Date(a.dueDate || a.createdAt).getTime() -
          new Date(b.dueDate || b.createdAt).getTime()
      )

      const body = allInstallments.map((inst, idx) => [
        String(idx + 1),
        inst.type || '—',
        formatDate(inst.dueDate) || formatDate(inst.createdAt) || '—',
        maskMonetaryValue(inst.value || 0),
        inst.status || '—',
      ])

      autoTable(doc, {
        startY: y,
        head: [['#', 'Tipo', 'Vencimento', 'Valor', 'Status']],
        body,
        headStyles: {
          fillColor: [250, 247, 242],
          textColor: [31, 28, 26],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [51, 46, 41],
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        theme: 'grid',
        styles: {
          lineColor: [229, 222, 212],
          lineWidth: 0.3,
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 40 },
          2: { cellWidth: 35 },
          3: { cellWidth: 40, halign: 'right' },
          4: { cellWidth: 'auto' },
        },
      })
    } else {
      doc.setFontSize(10)
      doc.setTextColor(115, 107, 97)
      doc.text('Nenhum pagamento registrado.', 14, y)
    }

    doc.setFontSize(8)
    doc.setTextColor(153, 145, 135)
    doc.text(
      `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} — ERP Financeiro`,
      14,
      285
    )

    doc.save(`historico-pagamentos-${contract.contractCode || contract.id}.pdf`)
  } catch (error) {
    console.error('Erro ao gerar histórico de pagamentos:', error)
    alert('Erro ao gerar documento. Tente novamente.')
  }
}

export function downloadSettlementDocument(contract: ContractRow) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  doc.setFontSize(10)
  doc.setTextColor(41, 140, 171)
  doc.text('ERP Financeiro', 14, 12)

  doc.setFontSize(18)
  doc.setTextColor(31, 28, 26)
  doc.text('TERMO DE QUITAÇÃO', 105, 30, { align: 'center' })

  doc.setDrawColor(229, 222, 212)
  doc.setLineWidth(0.5)
  doc.line(40, 34, 170, 34)

  const subject =
    contract.supplier?.name ||
    contract.collaborator?.name ||
    contract.financier?.name ||
    '—'

  doc.setFontSize(10)
  doc.setTextColor(51, 46, 41)

  const metaStartY = 44
  const metaLines = [
    `Contrato nº: ${contract.contractCode || '—'}`,
    `Contratado: ${subject}`,
    `Objeto: ${(contract.object || '—').substring(0, 100)}`,
    `Vigência: ${formatDate(contract.contractPeriod?.start) || '—'} a ${formatDate(contract.contractPeriod?.end) || '—'}`,
    `Valor Total: ${maskMonetaryValue(contract.totalValue || 0)}`,
    `Status: ${contract.contractStatus || '—'}`,
  ]

  let y = metaStartY
  metaLines.forEach((line) => {
    doc.text(line, 14, y)
    y += 6
  })

  y += 6

  doc.setFontSize(10)
  doc.setTextColor(31, 28, 26)

  const bodyText = [
    'Pelo presente instrumento, as partes declaram que o contrato acima identificado,',
    'firmado entre as partes, encontra-se integralmente quitado, satisfeitas todas as',
    'obrigações contratuais, financeiras e de natureza técnica, não havendo, até a',
    'presente data, quaisquer pendências de qualquer natureza entre as partes.',
    '',
    'Fica expressamente declarado que o contratado está em dia com todas as obrigações',
    'assumidas, incluindo mas não se limitando a: entrega de produtos/serviços,',
    'prestação de contas, pagamentos e quaisquer outras responsabilidades previstas',
    'no instrumento contratual e em seus aditivos.',
    '',
    'O presente termo é emitido em caráter irrevogável e irretratável, podendo ser',
    'utilizado para todos os fins de direito, especialmente para comprovação de',
    'quitação perante órgãos públicos, bancos e demais instituições.',
  ]

  bodyText.forEach((line) => {
    if (line === '') {
      y += 4
      return
    }
    const split = doc.splitTextToSize(line, 182)
    split.forEach((part: string) => {
      doc.text(part, 14, y)
      y += 5
    })
  })

  y += 16

  doc.setFontSize(9)
  doc.setTextColor(51, 46, 41)

  doc.text('_________________________________', 30, y)
  doc.text('_________________________________', 120, y)

  y += 6
  doc.text('Contratante', 55, y, { align: 'center' })
  doc.text('Contratado', 155, y, { align: 'center' })

  doc.setFontSize(8)
  doc.setTextColor(153, 145, 135)
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} — ERP Financeiro`,
    105,
    285,
    { align: 'center' }
  )

  doc.save(`termo-quitacao-${contract.contractCode || contract.id}.pdf`)
}
