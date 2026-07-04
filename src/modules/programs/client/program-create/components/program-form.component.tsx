import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { TargetIcon } from '#shared/ui/icons/index.ts'
import {
  sectionCard,
  sectionHeader,
  sectionIcon,
  sectionH2,
  sectionBody,
  grid,
  colSpanFull,
  field,
  fieldLabel,
  input,
  textarea,
  controlError,
  fieldError,
} from '#shared/ui/brand/brand-form.css.ts'

import type { ProgramFormController } from './program-form.controller.ts'

const t = createTranslator(ptBR)

export type ProgramFormProps = Readonly<{
  controller: ProgramFormController
  /** `false` = modo leitura (detalhe fora de edição): campos desabilitados. */
  editing: boolean
  errorBanner?: ReactNode
}>

/**
 * ProgramForm — APENAS o card de seção "Dados do Programa" do KIT "brand" (compartilhado entre criar e
 * detalhe). O shell (cabeçalho + barra de ações) fica nas pages; o detalhe também compõe o logo. Campos
 * name/sigla/director em grade + `characteristics` como textarea ocupando a linha inteira.
 */
export function ProgramForm(props: ProgramFormProps): ReactNode {
  const { controller: c, editing } = props
  const disabled = !editing
  const isInvalid = (key: string): boolean => c.errors[key] === true
  const invalidMsg = (key: string): string | null =>
    c.errors[key] === true ? t('programs.form.invalid') : null

  return (
    <section className={sectionCard}>
      <div className={sectionHeader}>
        <span className={sectionIcon}>
          <TargetIcon size={17} />
        </span>
        <h2 className={sectionH2}>{t('programs.form.section.data')}</h2>
      </div>
      <div className={sectionBody}>
        {props.errorBanner}
        <div className={grid}>
          <div className={field}>
            <label htmlFor="prog-name" className={fieldLabel}>
              {t('programs.form.name')}
            </label>
            <input
              id="prog-name"
              className={`${input} ${isInvalid('name') ? controlError : ''}`}
              value={c.state.name}
              disabled={disabled}
              onChange={(e) => {
                c.setField('name', e.target.value)
              }}
            />
            {invalidMsg('name') !== null ? <span className={fieldError}>{invalidMsg('name')}</span> : null}
          </div>

          <div className={field}>
            <label htmlFor="prog-sigla" className={fieldLabel}>
              {t('programs.form.sigla')}
            </label>
            <input
              id="prog-sigla"
              className={`${input} ${isInvalid('sigla') ? controlError : ''}`}
              value={c.state.sigla}
              disabled={disabled}
              onChange={(e) => {
                c.setField('sigla', e.target.value)
              }}
            />
            {invalidMsg('sigla') !== null ? <span className={fieldError}>{invalidMsg('sigla')}</span> : null}
          </div>

          <div className={field}>
            <label htmlFor="prog-director" className={fieldLabel}>
              {t('programs.form.director')}
            </label>
            <input
              id="prog-director"
              className={`${input} ${isInvalid('director') ? controlError : ''}`}
              value={c.state.director}
              disabled={disabled}
              onChange={(e) => {
                c.setField('director', e.target.value)
              }}
            />
            {invalidMsg('director') !== null ? (
              <span className={fieldError}>{invalidMsg('director')}</span>
            ) : null}
          </div>

          <div className={`${field} ${colSpanFull}`}>
            <label htmlFor="prog-characteristics" className={fieldLabel}>
              {t('programs.form.characteristics')}
            </label>
            <textarea
              id="prog-characteristics"
              className={`${textarea} ${isInvalid('generalCharacteristics') ? controlError : ''}`}
              value={c.state.generalCharacteristics}
              disabled={disabled}
              rows={3}
              onChange={(e) => {
                c.setField('generalCharacteristics', e.target.value)
              }}
            />
            {invalidMsg('generalCharacteristics') !== null ? (
              <span className={fieldError}>{invalidMsg('generalCharacteristics')}</span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
