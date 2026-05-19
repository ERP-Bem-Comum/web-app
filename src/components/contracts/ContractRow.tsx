import { Children, ContractRow } from '@/types/contracts'
import { maskMonetaryValue } from '@/utils/masks'
import { mountBudgetPlanName, mountPeriod, mountStatusBox } from '@/utils/UI/contracts'
import { TableRow } from '@mui/material'
import { Fragment, useEffect, useState } from 'react'
import TableCellStyled from '../table/TableCellStyled'
import { ActionButton } from './tablesComponents/ActionButton'

interface ContractRowProps {
  row: ContractRow | undefined | null
  index: number
  onClick: (id: number) => void
}

export const CustomContractRow = ({ row, index, onClick }: ContractRowProps) => {
  const [mostRecentInfo, setMostRecentInfo] = useState<Children>()

  useEffect(() => {
    if (row && row.children) {
      if (row.children.length > 0) {
        setMostRecentInfo(row.children.sort((a, b) => b.id - a.id)[0])
      } else {
        setMostRecentInfo(row)
      }
    }
  }, [row])

  const getContractSubject = (data: ContractRow) => {
    let name = 'unknown'
    let subjectType = 'unknown'
    if (data.supplier) {
      name = data.supplier.name
      subjectType = 'Fornecedor'
    }

    if (data.collaborator) {
      name = data.collaborator.name
      subjectType = 'Colaborador'
    }

    if (data.financier) {
      name = data.financier.name
      subjectType = 'Financiador'
    }

    return (
      <Fragment>
        <p>{name}</p>
        <p>{subjectType}</p>
      </Fragment>
    )
  }

  if (!mostRecentInfo || !row) {
    return (
      <TableRow
        id={'row' + index}
        key={`enhanced-table-checkbox-${index}`}
        tabIndex={-1}
        className="hover:bg-[#F6FAFB]"
        onClick={() => 1}
      ></TableRow>
    )
  }

  return (
    <TableRow
      id={'row' + index}
      key={`enhanced-table-checkbox-${index}`}
      tabIndex={-1}
      sx={{
        ':hover': { bgColor: '#F6FAFB' },
        zIndex: 1,
      }}
      onClick={(e) => {
        e.preventDefault()
        onClick(row.id)
      }}
    >
      <TableCellStyled border={false}>
        <div className="flex gap-5 items-center">
          <div>{getContractSubject(mostRecentInfo)}</div>
        </div>
      </TableCellStyled>
      <TableCellStyled>
        <p>{mostRecentInfo.contractModel}</p>
      </TableCellStyled>
      <TableCellStyled>
        <p>{mostRecentInfo.object}</p>
      </TableCellStyled>
      <TableCellStyled>
        <p>{mountBudgetPlanName(mostRecentInfo?.program, mostRecentInfo?.budgetPlan)}</p>
        <p>{mountPeriod(mostRecentInfo)}</p>
      </TableCellStyled>
      <TableCellStyled>
        <p>{mostRecentInfo?.pending ? maskMonetaryValue(mostRecentInfo.pending) : '-'}</p>
      </TableCellStyled>
      <TableCellStyled>
        <p>{maskMonetaryValue(mostRecentInfo.totalValue)}</p>
      </TableCellStyled>
      <TableCellStyled width="5%">{mountStatusBox(mostRecentInfo)}</TableCellStyled>
      <TableCellStyled width="5%">
        <ActionButton
          status={mostRecentInfo.contractStatus}
          contractId={row.id}
          aditiveId={mostRecentInfo.id}
          fileLinks={{
            settleTermUrl: mostRecentInfo.settleTermUrl,
            signedContractUrl: mostRecentInfo.signedContractUrl,
            withdrawalUrl: mostRecentInfo.withdrawalUrl,
          }}
        />
      </TableCellStyled>
    </TableRow>
  )
}
