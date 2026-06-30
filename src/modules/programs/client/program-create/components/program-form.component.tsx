import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Field, Input } from '#shared/ui/index.ts'
import { TargetIcon } from '#shared/ui/icons/index.ts'

import type { ProgramFormController } from './program-form.controller.ts'
import { card, sectionTitle, grid, textareaField, textarea, label as labelClass } from './program-form.css.ts'

const t = createTranslator(ptBR)

export type ProgramFormProps = Readonly<{
  controller: ProgramFormController
  editing: boolean
  errorBanner?: ReactNode
}>

export function ProgramForm(props: ProgramFormProps): ReactNode {
  const { controller: c, editing } = props
  const invalid = (key: string): string | undefined =>
    c.errors[key] === true ? t('programs.form.invalid') : undefined

  return (
    <div className={card}>
      <h2 className={sectionTitle}>
        <TargetIcon size={18} />
        {t('programs.form.section.data')}
      </h2>
      {props.errorBanner}
      <div className={grid}>
        {/* Logo: gerenciado pelo ProgramLogoUploader no detalhe (upload é pós-criação — precisa do id).
            No criar, o logo é adicionado depois de salvar, abrindo o programa. */}
        <Field htmlFor="prog-name" label={t('programs.form.name')} error={invalid('name')}>
          <Input
            id="prog-name"
            value={c.state.name}
            disabled={!editing}
            onChange={(v) => {
              c.setField('name', v)
            }}
          />
        </Field>
        <Field htmlFor="prog-sigla" label={t('programs.form.sigla')} error={invalid('sigla')}>
          <Input
            id="prog-sigla"
            value={c.state.sigla}
            disabled={!editing}
            onChange={(v) => {
              c.setField('sigla', v)
            }}
          />
        </Field>
        <Field htmlFor="prog-director" label={t('programs.form.director')} error={invalid('director')}>
          <Input
            id="prog-director"
            value={c.state.director}
            disabled={!editing}
            onChange={(v) => {
              c.setField('director', v)
            }}
          />
        </Field>
      </div>

      <div className={textareaField}>
        <label className={labelClass} htmlFor="prog-characteristics">
          {t('programs.form.characteristics')}
        </label>
        <textarea
          id="prog-characteristics"
          className={textarea}
          value={c.state.generalCharacteristics}
          disabled={!editing}
          onChange={(e) => {
            c.setField('generalCharacteristics', e.target.value)
          }}
        />
      </div>
    </div>
  )
}
