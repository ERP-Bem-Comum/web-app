import { TitleLabel } from '@/components/layout/TitleLabel'
import { IContract } from '@/types/contracts'
import { Grid } from '@mui/material'
import { Fragment } from 'react'
import { ContractsChildListLine } from './ContractChildListLine'

interface ContractsChildListProps {
  contract?: IContract
}

const flattenArray = (contract?: IContract) => {
  if (!contract) return []
  const contractCopy = { ...contract }
  const childs = contractCopy.children ? [...contractCopy.children] : []
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { children, ...contractCopyWithoutChildren } = contractCopy
  childs.push(contractCopyWithoutChildren)
  childs.shift()
  return childs
}

export const ContractsChildList = ({ contract }: ContractsChildListProps) => {
  const children = flattenArray(contract)

  if (!contract || !children) {
    return null
  }

  return (
    <Fragment>
      <Grid item xs={12}>
        <TitleLabel>Aditivos:</TitleLabel>
      </Grid>
      {children.map((child, index) => (
        <ContractsChildListLine
          contract={contract}
          currentChild={child}
          index={index}
          key={'line' + index}
        />
      ))}
    </Fragment>
  )
}
