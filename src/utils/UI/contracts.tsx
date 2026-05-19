import { Contracts } from '@/components/contracts/FormComponents'
import { TitleLabel } from '@/components/layout/TitleLabel'
import { ContractStatus, ContractType } from '@/enums/contracts'
import { ContractRow, IContract } from '@/types/contracts'
import { Grid } from '@mui/material'
import { Fragment, ReactNode } from 'react'
import { formatDate } from '../dates'
import { IPayables } from '@/types/Payables'
import { BancaryInfo, PixInfo } from '@/types/global'

const StatusBox = ({
  color,
  backgroundColor,
  label,
}: {
  color: string
  backgroundColor: string
  label: string
}) => {
  return (
    <div
      style={{
        color,
        backgroundColor,
        width: 'fit-content',
        padding: 5,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label}
    </div>
  )
}

export const mountStatusBox = ({ contractStatus }: Pick<ContractRow, 'contractStatus'>) => {
  switch (contractStatus) {
    case ContractStatus.PENDING:
      return <StatusBox color="#364E55" backgroundColor="#E0E4E4" label="Pendente" />
    case ContractStatus.SIGNED:
      return <StatusBox color="#ffffff" backgroundColor="#32C6F4" label="Assinado" />
    case ContractStatus.ONGOING:
      return <StatusBox color="#ffffff" backgroundColor="#64BC47" label="Em andamento" />
    case ContractStatus.FINISHED:
      return <StatusBox color="#ffffff" backgroundColor="#3B70BF" label="Finalizado" />
  }
}

export const mountBudgetPlanName = (
  program: IPayables['categorization']['program'],
  budgetPlan: IPayables['categorization']['budgetPlan'],
) => {
  if (budgetPlan && program) {
    return `${budgetPlan.year} ${
      budgetPlan.scenarioName ?? program.name
    } ${budgetPlan.version.toFixed(1)}`
  }

  return ''
}

export const mountPeriod = ({ contractPeriod: data }: Pick<ContractRow, 'contractPeriod'>) => {
  if (data) {
    const startDate = formatDate(data.start)
    const isIndefinite = data.isIndefinite ?? data.end === null
    const endDate = isIndefinite ? 'Prazo Indeterminado' : formatDate(data.end)
    return `${startDate} - ${endDate}`
  }
}

export const switchContractedComponent = (
  type: ContractType,
  editable: boolean,
  onChange: (id: number) => void,
  bancaryDataCallback: (pix: Required<PixInfo>, account: Required<BancaryInfo>) => void,
  contract?: IContract,
) => {
  let item: ReactNode
  switch (type) {
    case ContractType.FINANCIER:
      item = (
        <Contracts.Finnancier
          defaultFinancier={contract?.financier}
          editable={editable}
          onFinancierChange={onChange}
        />
      )
      break
    case ContractType.COLLABORATOR:
      item = (
        <Contracts.Collaborator
          defaultCollaborator={contract?.collaborator}
          editable={editable}
          onCollaboratorChange={onChange}
          bancaryDataCallback={bancaryDataCallback}
        />
      )
      break
    default:
      item = (
        <Contracts.Supplier
          defaultSupplier={contract?.supplier}
          editable={editable}
          onSupplierChange={onChange}
          bancaryDataCallback={bancaryDataCallback}
        />
      )
      break
  }

  return (
    <Fragment>
      <Grid item xs={12}>
        <TitleLabel className="pb-1">Contratado:</TitleLabel>
      </Grid>
      {item}
    </Fragment>
  )
}
