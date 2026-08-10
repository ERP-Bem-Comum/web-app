/**
 * Modal "Centros de Custo - {Programa}" (view BURRA §1.5). Dropdown de centro + "Adicionar centro", árvore
 * de 3 níveis (Centro→Categoria→Subcategoria) com ações por linha e um painel de formulário lateral cujos
 * campos variam pelo modo (add/editar centro/categoria/subcategoria). Todo o estado vem do binding.
 */
import type { ReactNode } from 'react'

import { ChevronUpIcon, ChevronDownIcon, EditIcon } from '#shared/ui/index.ts'
import type {
  CostCenterType,
  SubCategoryType,
  ReleaseType,
} from '#modules/budget-plans/client/planejamento/detalhe/centros-custo.view-model.ts'
import type {
  CentrosCustoBinding,
  CentrosCustoErrorTag,
  ToggleTarget,
} from '#modules/budget-plans/client/planejamento/detalhe/centros-custo.binding.ts'

import {
  overlay,
  modal,
  head,
  headTexts,
  title,
  subtitle,
  close,
  toolbar,
  field,
  label,
  select,
  input,
  body,
  bodyWithForm,
  tree,
  rowCentro,
  rowCategoria,
  rowSub,
  subList,
  rowName,
  rowNameCentro,
  rowNameOff,
  rowActions,
  rowStart,
  chevronButton,
  chevronSpacer,
  editButton,
  switchLabel,
  switchInput,
  switchTrack,
  switchText,
  actionLink,
  addCentroButton,
  formPanel,
  formTitle,
  formError,
  formActions,
  cancelButton,
  submitButton,
} from './centros-custo-modal.css.ts'

export type CentrosCustoLabels = Readonly<{
  titlePrefix: string // "Centros de Custo -"
  subtitle: string
  close: string
  centro: string
  addCentro: string
  addCategoria: string
  addSub: string
  edit: string
  deactivate: string
  activate: string
  /** Texto do switch travado por herança (no lugar de "Ativar"/"Desativar") — ex.: "Inativo por herança". */
  inherited: string
  /** Tooltip do switch travado: diz QUAL ancestral desligou o nó e como destravar. */
  lockedByAncestor: (ancestorName: string) => string
  expand: string
  collapse: string
  nome: string
  centroTipo: string
  subTipo: string
  releaseType: string
  cancel: string
  save: string
  add: string
  formTitle: Readonly<{
    'add-centro': string
    'edit-centro': string
    'add-categoria': string
    'edit-categoria': string
    'add-sub': string
    'edit-sub': string
  }>
}>

export type CentrosCustoModalProps = Readonly<{
  binding: CentrosCustoBinding
  labels: CentrosCustoLabels
  centroTipoLabels: Readonly<Record<CostCenterType, string>>
  subTipoLabels: Readonly<Record<SubCategoryType, string>>
  releaseTypeLabels: Readonly<Record<ReleaseType, string>>
  /** Resolve o rótulo i18n de uma tag de erro da submissão (validação client-side OU eco do backend). */
  translateError: (tag: CentrosCustoErrorTag) => string
}>

const CLOSE_GLYPH = '✕'

export function CentrosCustoModal(props: CentrosCustoModalProps): ReactNode {
  const { binding: b, labels: L } = props
  if (!b.open) return null

  const mode = b.formMode
  const showForm = mode.kind !== 'none'
  const centro = b.selectedCentro

  const nameClass = (active: boolean, base: string): string => (active ? base : `${base} ${rowNameOff}`)

  const chevron = (kind: 'centro' | 'categoria', id: number): ReactNode => {
    const collapsed = b.isCollapsed(kind, id)
    return (
      <button
        type="button"
        className={chevronButton}
        aria-label={collapsed ? L.expand : L.collapse}
        aria-expanded={!collapsed}
        onClick={() => {
          b.toggleCollapse(kind, id)
        }}
      >
        {collapsed ? <ChevronDownIcon size={16} /> : <ChevronUpIcon size={16} />}
      </button>
    )
  }

  const editAction = (onClick: () => void): ReactNode => (
    <button type="button" className={editButton} onClick={onClick}>
      <EditIcon size={14} />
      {L.edit}
    </button>
  )

  /**
   * Switch de (des)ativação. TRAVA quando um ancestral está inativo: o `active` que chega é o EFETIVO, mas o
   * PATCH grava a INTENÇÃO — ligar o filho com o pai desligado gravaria `true` e a releitura devolveria
   * `false`, e o switch voltaria sozinho, parecendo bug (core-api#469). Travado + `title` dizendo QUEM
   * desligou é o que dá p/ afirmar com honestidade enquanto o core não expõe a intenção individual.
   */
  const activeSwitch = (target: ToggleTarget, active: boolean): ReactNode => {
    const lock = b.lockOf(target)
    const label = active ? L.deactivate : L.activate
    const lockedTitle = lock === null ? undefined : L.lockedByAncestor(lock.ancestorName)
    return (
      <label className={switchLabel} title={lockedTitle}>
        <input
          type="checkbox"
          role="switch"
          className={switchInput}
          checked={active}
          disabled={lock !== null || b.submitting}
          aria-label={lockedTitle ?? label}
          onChange={() => {
            b.toggleActive(target)
          }}
        />
        <span className={switchTrack} aria-hidden="true" />
        <span className={switchText}>{lock === null ? label : L.inherited}</span>
      </label>
    )
  }

  return (
    <div className={overlay} role="dialog" aria-modal="true" aria-label={`${L.titlePrefix} ${b.programName}`}>
      <div className={modal}>
        <header className={head}>
          <div className={headTexts}>
            <h2 className={title}>
              {L.titlePrefix} {b.programName}
            </h2>
            <p className={subtitle}>{L.subtitle}</p>
          </div>
          <button type="button" className={close} aria-label={L.close} onClick={b.close}>
            {CLOSE_GLYPH}
          </button>
        </header>

        <div className={toolbar}>
          <label className={field}>
            <span className={label}>{L.centro}</span>
            <select
              className={select}
              value={centro?.id ?? ''}
              onChange={(e) => {
                b.selectCentro(Number(e.target.value))
              }}
            >
              {b.centros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={addCentroButton}
            onClick={() => {
              b.startForm({ kind: 'add-centro' })
            }}
          >
            {L.addCentro}
          </button>
        </div>

        <div className={showForm ? `${body} ${bodyWithForm}` : body}>
          <div className={tree}>
            {centro !== null ? (
              <>
                <div className={rowCentro}>
                  <span className={rowStart}>
                    {chevron('centro', centro.id)}
                    <span className={nameClass(centro.active, rowNameCentro)}>
                      {centro.name} - {props.centroTipoLabels[centro.type]}
                    </span>
                  </span>
                  <span className={rowActions}>
                    <button
                      type="button"
                      className={actionLink}
                      onClick={() => {
                        b.startForm({ kind: 'add-categoria', centroId: centro.id })
                      }}
                    >
                      {L.addCategoria}
                    </button>
                    {editAction(() => {
                      b.startForm({ kind: 'edit-centro', centroId: centro.id })
                    })}
                    {activeSwitch({ kind: 'centro', centroId: centro.id }, centro.active)}
                  </span>
                </div>

                {b.isCollapsed('centro', centro.id)
                  ? null
                  : centro.categories.map((cat) => (
                      <div key={cat.id}>
                        <div className={rowCategoria}>
                          <span className={rowStart}>
                            {chevron('categoria', cat.id)}
                            <span className={nameClass(cat.active, rowName)}>{cat.name}</span>
                          </span>
                          <span className={rowActions}>
                            <button
                              type="button"
                              className={actionLink}
                              onClick={() => {
                                b.startForm({ kind: 'add-sub', centroId: centro.id, categoriaId: cat.id })
                              }}
                            >
                              {L.addSub}
                            </button>
                            {editAction(() => {
                              b.startForm({
                                kind: 'edit-categoria',
                                centroId: centro.id,
                                categoriaId: cat.id,
                              })
                            })}
                            {activeSwitch(
                              { kind: 'categoria', centroId: centro.id, categoriaId: cat.id },
                              cat.active,
                            )}
                          </span>
                        </div>

                        {b.isCollapsed('categoria', cat.id) || cat.subCategories.length === 0 ? null : (
                          <div className={subList}>
                            {cat.subCategories.map((sub) => (
                              <div key={sub.id} className={rowSub}>
                                <span className={rowStart}>
                                  <span className={chevronSpacer} aria-hidden="true" />
                                  <span className={nameClass(sub.active, rowName)}>{sub.name}</span>
                                </span>
                                <span className={rowActions}>
                                  {editAction(() => {
                                    b.startForm({
                                      kind: 'edit-sub',
                                      centroId: centro.id,
                                      categoriaId: cat.id,
                                      subId: sub.id,
                                    })
                                  })}
                                  {activeSwitch(
                                    {
                                      kind: 'sub',
                                      centroId: centro.id,
                                      categoriaId: cat.id,
                                      subId: sub.id,
                                    },
                                    sub.active,
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
              </>
            ) : null}
          </div>

          {showForm ? (
            <div className={formPanel}>
              <h3 className={formTitle}>{L.formTitle[mode.kind]}</h3>

              <label className={field}>
                <span className={label}>{L.nome}</span>
                <input
                  className={input}
                  value={b.form.nome}
                  onChange={(e) => {
                    b.setNome(e.target.value)
                  }}
                />
              </label>

              {mode.kind === 'add-centro' || mode.kind === 'edit-centro' ? (
                <label className={field}>
                  <span className={label}>{L.centroTipo}</span>
                  <select
                    className={select}
                    value={b.form.centroTipo}
                    onChange={(e) => {
                      b.setCentroTipo(e.target.value as CostCenterType)
                    }}
                  >
                    {b.centroTipoOptions.map((v) => (
                      <option key={v} value={v}>
                        {props.centroTipoLabels[v]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {mode.kind === 'add-sub' || mode.kind === 'edit-sub' ? (
                <>
                  <label className={field}>
                    <span className={label}>{L.subTipo}</span>
                    <select
                      className={select}
                      value={b.form.subTipo}
                      onChange={(e) => {
                        b.setSubTipo(e.target.value as SubCategoryType)
                      }}
                    >
                      {b.subTipoOptions.map((v) => (
                        <option key={v} value={v}>
                          {props.subTipoLabels[v]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={field}>
                    <span className={label}>{L.releaseType}</span>
                    <select
                      className={select}
                      value={b.form.releaseType}
                      onChange={(e) => {
                        b.setReleaseType(e.target.value as ReleaseType)
                      }}
                    >
                      {b.releaseTypeOptions.map((v) => (
                        <option key={v} value={v}>
                          {props.releaseTypeLabels[v]}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              {b.errorTag !== null ? (
                <p className={formError} role="alert">
                  {props.translateError(b.errorTag)}
                </p>
              ) : null}

              <div className={formActions}>
                <button type="button" className={cancelButton} onClick={b.cancelForm} disabled={b.submitting}>
                  {L.cancel}
                </button>
                <button type="button" className={submitButton} onClick={b.submitForm} disabled={b.submitting}>
                  {mode.kind.startsWith('add') ? L.add : L.save}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
