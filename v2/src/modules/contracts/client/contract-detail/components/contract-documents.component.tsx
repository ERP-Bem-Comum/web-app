import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'

interface Props {
  contract: Contract
}

export function ContractDocuments({ contract }: Props): ReactNode {
  const allDocs = [
    { id: contract.id, name: 'Contrato Base', type: 'base' as const, status: contract.status },
    ...contract.children.map((a) => ({ id: a.id, name: `Aditivo ${a.amendmentNumber}`, type: 'amendment' as const, status: a.status })),
  ]

  return (
    <table>
      <thead>
        <tr><th>Documento</th><th>Tipo</th><th>Status</th><th>Ações</th></tr>
      </thead>
      <tbody>
        {allDocs.map((doc) => (
          <tr key={doc.id}>
            <td>{doc.name}</td>
            <td>{doc.type}</td>
            <td>{doc.status}</td>
            <td><button>Visualizar</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
