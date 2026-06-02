import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'

interface Props {
  contract: Contract
}

export function ContractTimeline({ contract }: Props): ReactNode {
  return (
    <div>
      <h3>Timeline</h3>
      <ul>
        <li>Criado em: {contract.createdAt.toLocaleDateString('pt-BR')}</li>
        {contract.signedAt && <li>Assinado em: {contract.signedAt.toLocaleDateString('pt-BR')}</li>}
        {contract.children.filter((a) => a.status === 'Homologado').map((a) => (
          <li key={a.id}>Aditivo {a.amendmentNumber} homologado</li>
        ))}
      </ul>
    </div>
  )
}
