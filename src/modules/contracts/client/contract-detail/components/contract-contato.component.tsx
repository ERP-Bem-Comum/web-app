/**
 * ContractContato — seção Contato do detalhe. Read-only por padrão; ao clicar em "Editar" habilita a
 * edição inline (email/telefone/observações) e salva via PATCH (binding de edição na page). Espelha a
 * seção Contato da tela de inclusão. View burra: estado/efeitos vivem na page.
 */
import type { ReactNode } from 'react'
import type { Contract } from '#modules/contracts/public-api/index.ts'
import {
  sectionBlock,
  sectionBlockFlush,
  sectionHeadRow,
  sectionH3,
  sectionHeadAction,
  fieldRow,
  frCols2,
  fld,
  fldLabel,
  fldBox,
  fldValue,
  editInput,
  editTextarea,
  editActions,
  editError,
  buttonPrimary,
  buttonSecondary,
} from '../page/contract-detail.css.ts'

interface Props {
  readonly contract: Contract
  readonly editing: boolean
  readonly email: string
  readonly telephone: string
  readonly observations: string
  readonly onChange: (field: 'email' | 'telephone' | 'observations', value: string) => void
  readonly onEdit: () => void
  readonly onSave: () => void
  readonly onCancel: () => void
  readonly saving: boolean
  readonly errorText: string | null
}

export function ContractContato(props: Props): ReactNode {
  const { contract, editing } = props
  return (
    <section className={`${sectionBlock} ${sectionBlockFlush}`}>
      <div className={sectionHeadRow}>
        <h3 className={sectionH3}>Contato</h3>
        {!editing && (
          <button type="button" className={sectionHeadAction} onClick={props.onEdit}>Editar</button>
        )}
      </div>

      <div className={`${fieldRow} ${frCols2}`}>
        <div className={fld}>
          <label className={fldLabel}>E-mail</label>
          {editing ? (
            <input className={editInput} type="email" value={props.email} onChange={(e) => { props.onChange('email', e.target.value) }} />
          ) : (
            <div className={fldBox}><span className={fldValue}>{contract.email ?? '—'}</span></div>
          )}
        </div>
        <div className={fld}>
          <label className={fldLabel}>Telefone</label>
          {editing ? (
            <input className={editInput} type="text" value={props.telephone} onChange={(e) => { props.onChange('telephone', e.target.value) }} />
          ) : (
            <div className={fldBox}><span className={fldValue}>{contract.telephone ?? '—'}</span></div>
          )}
        </div>
      </div>
      <div className={fieldRow}>
        <div className={fld}>
          <label className={fldLabel}>Observações</label>
          {editing ? (
            <textarea className={editTextarea} value={props.observations} onChange={(e) => { props.onChange('observations', e.target.value) }} />
          ) : (
            <div className={fldBox}><span className={fldValue}>{contract.observations ?? '—'}</span></div>
          )}
        </div>
      </div>

      {editing && (
        <>
          {props.errorText !== null && <div className={editError} role="alert">{props.errorText}</div>}
          <div className={editActions}>
            <button type="button" className={buttonSecondary} onClick={props.onCancel} disabled={props.saving}>Cancelar</button>
            <button type="button" className={buttonPrimary} onClick={props.onSave} disabled={props.saving}>
              {props.saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
