import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'

interface Props {
  contract: Contract
}

export function ContractHero({ contract }: Props): ReactNode {
  return (
    <div>
      <h1>{contract.title}</h1>
      <span>{contract.sequentialNumber}</span>
      <span>{contract.status}</span>
      <p>{contract.objective}</p>
    </div>
  )
}
