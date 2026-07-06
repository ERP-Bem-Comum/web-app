/**
 * EquipeDetailModal — modal "brand" de DETALHE do colaborador (relatório Equipe ABC). View BURRA (§XI):
 * recebe o colaborador selecionado + rótulos i18n e apenas apresenta os 9 campos ENXUTOS como lista
 * rótulo/valor. Fecha por Esc / clique no overlay / botão "Fechar"; "Editar" dispara `onEdit` (a navegação
 * ao módulo Colaboradores mora na View, nunca aqui). Só renderiza quando `member` não é null.
 *
 * ⚠️ LGPD: apenas os 9 campos sintéticos de `TeamMemberRow` — SEM cpf/email/telefone/endereço/remuneração/
 * alergias/biografia (nem existem no tipo). Não há PII real em lugar nenhum.
 */
import { useEffect, type ReactNode } from 'react'

import type { TeamMemberRow } from '../equipe.view-model.ts'

import {
  modalOverlay,
  modalDialog,
  modalHeader,
  modalTitle,
  modalList,
  modalRow,
  modalDt,
  modalDd,
  modalActions,
  modalCancelBtn,
  modalPrimaryBtn,
} from '../page/equipe.page.css.ts'

export type EquipeDetailModalLabels = Readonly<{
  title: string
  nome: string
  idade: string
  area: string
  funcao: string
  vinculo: string
  genero: string
  racaCor: string
  escolaridade: string
  anoContrato: string
  naLabel: string
  close: string
  edit: string
}>

export type EquipeDetailModalProps = Readonly<{
  /** Colaborador selecionado; null = modal fechado. */
  member: TeamMemberRow | null
  labels: EquipeDetailModalLabels
  onClose: () => void
  onEdit: (member: TeamMemberRow) => void
}>

export function EquipeDetailModal(props: EquipeDetailModalProps): ReactNode {
  const { member, labels, onClose } = props

  // Esc fecha o modal (foco-trap leve; a page controla o open/close via estado).
  useEffect(() => {
    if (member === null) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [member, onClose])

  if (member === null) return null

  const idade = member.idade === null ? labels.naLabel : String(member.idade)
  const fields: readonly (readonly [string, string])[] = [
    [labels.nome, member.nome],
    [labels.idade, idade],
    [labels.area, member.programa],
    [labels.funcao, member.funcao],
    [labels.vinculo, member.vinculo],
    [labels.genero, member.genero],
    [labels.racaCor, member.racaCor],
    [labels.escolaridade, member.escolaridade],
    [labels.anoContrato, String(member.anoContrato)],
  ]

  return (
    <div className={modalOverlay} role="dialog" aria-modal="true" aria-label={labels.title} onClick={onClose}>
      <div
        className={modalDialog}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <div className={modalHeader}>
          <h2 className={modalTitle}>{labels.title}</h2>
        </div>

        <dl className={modalList}>
          {fields.map(([label, value]) => (
            <div className={modalRow} key={label}>
              <dt className={modalDt}>{label}</dt>
              <dd className={modalDd}>{value}</dd>
            </div>
          ))}
        </dl>

        <div className={modalActions}>
          <button type="button" className={modalCancelBtn} onClick={onClose}>
            {labels.close}
          </button>
          <button
            type="button"
            className={modalPrimaryBtn}
            onClick={() => {
              props.onEdit(member)
            }}
          >
            {labels.edit}
          </button>
        </div>
      </div>
    </div>
  )
}
