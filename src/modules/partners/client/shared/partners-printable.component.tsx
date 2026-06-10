import type { ReactNode } from 'react'

import { doc, docHeader, title as titleClass, emitted, table, th, td, tdEmpty } from './partners-printable.css.ts'

/**
 * Printable genérico de uma listagem de Parceiros (tabela) — invisível na tela, aparece só na impressão
 * (`window.print` → "Salvar como PDF"). Espelha o padrão do `printable-document` de Contratos.
 */
export type PartnersPrintableProps = Readonly<{
  title: string
  emittedLabel: string
  columns: readonly string[]
  rows: readonly (readonly string[])[]
  emptyLabel: string
}>

export function PartnersPrintable(props: PartnersPrintableProps): ReactNode {
  return (
    <div className={doc}>
      <div className={docHeader}>
        <h1 className={titleClass}>{props.title}</h1>
        <span className={emitted}>{props.emittedLabel}</span>
      </div>
      <table className={table}>
        <thead>
          <tr>
            {props.columns.map((c) => (
              <th key={c} className={th}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.length === 0 ? (
            <tr>
              <td className={tdEmpty} colSpan={props.columns.length}>{props.emptyLabel}</td>
            </tr>
          ) : (
            props.rows.map((cells) => (
              <tr key={cells.join('§')}>
                {cells.map((cell, j) => (
                  <td key={props.columns[j] ?? String(j)} className={td}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
