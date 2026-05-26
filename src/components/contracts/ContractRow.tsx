import { Children, ContractRow } from '@/types/contracts'
import { formatDate } from '@/utils/dates'
import { maskMonetaryValue } from '@/utils/masks'
import { formatContractNumber } from '@/utils/UI/contracts'
import { deriveStatus } from '@/utils/contracts/status'
import { TableCell, TableRow } from '@mui/material'
import { useEffect, useState } from 'react'
import { ActionButton } from './tablesComponents/ActionButton'
import styles from './contractsGrid.module.css'

interface ContractRowProps {
  row: ContractRow | undefined | null
  index: number
  onClick: (id: number) => void
}

const tipoBadgeClass = (contractType: string): string => {
  const map: Record<string, string> = {
    Fornecedor: styles.tipoForn,
    Colaborador: styles.tipoCons,
    Financiador: styles.tipoParc,
    ACT: styles.tipoAct,
  }
  return map[contractType] || styles.tipoPserv
}

const avatarBadgeClass = (contractType: string): string => {
  const map: Record<string, string> = {
    Fornecedor: styles.fornAvatarForn,
    Colaborador: styles.fornAvatarCons,
    Financiador: styles.fornAvatarParc,
    ACT: styles.fornAvatarAct,
  }
  return map[contractType] || styles.fornAvatarPf
}

const programaShort = (name: string | undefined): string => {
  if (!name) return '—'
  // Pega a sigla antes do — ou do espaço, ou primeiras letras maiúsculas
  const parts = name.split(' — ')
  if (parts.length > 1) return parts[0]
  // Pega primeiras letras maiúsculas de cada palavra
  const words = name.split(' ')
  if (words.length === 1) return name.slice(0, 4).toUpperCase()
  const sigla = words
    .filter((w) => w[0] === w[0]?.toUpperCase())
    .map((w) => w[0])
    .join('')
    .slice(0, 5)
  return sigla || name.slice(0, 4).toUpperCase()
}

export const CustomContractRow = ({ row, index, onClick }: ContractRowProps) => {
  const [mostRecentInfo, setMostRecentInfo] = useState<Children>()

  useEffect(() => {
    if (!row) return
    if (row.children && row.children.length > 0) {
      setMostRecentInfo(row.children.sort((a, b) => b.id - a.id)[0])
    } else {
      setMostRecentInfo(row)
    }
  }, [row])

  const getContractSubject = (data: ContractRow) => {
    let name = 'unknown'
    let document = '-'
    let isPf = false

    if (data.supplier?.name) {
      name = data.supplier.name
      document = data.supplier.cnpj || '-'
      isPf = false
    } else if (data.collaborator?.name) {
      name = data.collaborator.name
      document = data.collaborator.cpf || '-'
      isPf = true
    } else if (data.financier?.name) {
      name = data.financier.name
      document = data.financier.cnpj || '-'
      isPf = false
    }

    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase()

    return { name, document, initials, isPf }
  }

  if (!mostRecentInfo || !row) {
    return (
      <TableRow
        id={'row' + index}
        key={`enhanced-table-checkbox-${index}`}
        tabIndex={-1}
        className={styles.emptyRow}
        onClick={() => 1}
      ></TableRow>
    )
  }

  const subject = getContractSubject(mostRecentInfo)
  const aditivosCount = row.children?.length ?? 0

  // Só aditivos HOMOLOGADOS de tipo valor entram no Valor Atual
  const aditivosValorSum =
    row.children
      ?.filter(
        (child) =>
          child.aditivoStatus === 'Homologado' &&
          (!child.aditivoType || child.aditivoType === 'valor')
      )
      .reduce((acc, child) => acc + (child.totalValue ?? 0), 0) ?? 0
  const valorAtual = (row.totalValue ?? 0) + aditivosValorSum

  // Saldo = Valor Atual - Valor pago/executado
  const paidValue =
    mostRecentInfo.paidValue ??
    (() => {
      const status = deriveStatus(mostRecentInfo, !!row.children?.length).key
      if (status === 'pendente' || status === 'rascunho') return 0
      if (status === 'finalizado') return valorAtual
      if (status === 'distrato') return valorAtual * 0.5
      return valorAtual * 0.4 // em-andamento
    })()
  const saldo = valorAtual - paidValue

  return (
    <TableRow
      id={'row' + index}
      key={`enhanced-table-checkbox-${index}`}
      tabIndex={-1}
      className={styles.row}
      onClick={(e) => {
        e.preventDefault()
        onClick(row.id)
      }}
    >
      {/* Número */}
      <TableCell className={styles.cell}>
        <span className={styles.docNum}>{formatContractNumber(row.contractCode)}</span>
      </TableCell>

      {/* Contratado */}
      <TableCell className={styles.cell}>
        <div className={styles.forn}>
          <span className={`${styles.fornAvatar} ${avatarBadgeClass(mostRecentInfo.contractType)}`}>
            {subject.initials}
          </span>
          <div className={styles.fornInfo}>
            <span className={styles.fornName}>{subject.name}</span>
            <span className={styles.fornDoc}>{subject.document}</span>
          </div>
        </div>
      </TableCell>

      {/* Objeto */}
      <TableCell className={styles.cell}>
        <span className={styles.objetoCell} title={mostRecentInfo.object}>
          {mostRecentInfo.object}
        </span>
      </TableCell>

      {/* Tipo */}
      <TableCell className={styles.cell}>
        <span className={`${styles.tipoTag} ${tipoBadgeClass(mostRecentInfo.contractType)}`}>
          {mostRecentInfo.contractType}
        </span>
      </TableCell>

      {/* Programa */}
      <TableCell className={styles.cell} align="center">
        <span className={styles.programaCell}>{programaShort(mostRecentInfo.program?.name)}</span>
      </TableCell>

      {/* Valor Atual */}
      <TableCell className={`${styles.cell} ${styles.money}`} align="right">
        {maskMonetaryValue(valorAtual)}
      </TableCell>

      {/* Saldo */}
      <TableCell className={`${styles.cell} ${styles.money}`} align="right">
        {maskMonetaryValue(saldo)}
      </TableCell>

      {/* Início */}
      <TableCell className={styles.cell}>
        <span className={styles.dtCell}>{formatDate(mostRecentInfo.contractPeriod?.start) ?? '-'}</span>
      </TableCell>

      {/* Vigência */}
      <TableCell className={styles.cell}>
        <span className={styles.dtCell}>
          {formatDate(mostRecentInfo.contractPeriod?.end) ?? '-'}
        </span>
      </TableCell>

      {/* Aditivos */}
      <TableCell className={`${styles.cell} ${styles.aditivosCell}`} align="center">
        {aditivosCount > 0 ? (
          <span className={styles.aditivosBadge}>
            <span>+{aditivosCount}</span>
          </span>
        ) : (
          <span className={styles.aditivosNone}>—</span>
        )}
      </TableCell>

      {/* Status */}
      <TableCell className={styles.cell} align="center">
        {(() => {
          const derived = deriveStatus(mostRecentInfo, !!row.children?.length)
          const statusClassMap: Record<string, string> = {
            'em-andamento': styles.statusEmAndamento,
            'pendente': styles.statusPendente,
            'finalizado': styles.statusFinalizado,
            'distrato': styles.statusDistrato,
            'rascunho': styles.statusRascunho,
            'cancelado': styles.statusCancelado,
          }
          return (
            <span className={`${styles.status} ${statusClassMap[derived.key] || ''}`}>
              {derived.label}
            </span>
          )
        })()}
      </TableCell>

      {/* Ações */}
      <TableCell className={`${styles.cell} ${styles.actionCell}`}>
        <ActionButton
          status={mostRecentInfo.contractStatus}
          contractId={row.id}
          aditiveId={mostRecentInfo.id}
          fileLinks={{
            settleTermUrl: mostRecentInfo.settleTermUrl,
            signedContractUrl: mostRecentInfo.signedContractUrl,
            withdrawalUrl: mostRecentInfo.withdrawalUrl,
          }}
          contractData={row}
        />
      </TableCell>
    </TableRow>
  )
}
