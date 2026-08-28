/**
 * Os 5 selects da taxonomia (Programa → Plano → Centro → Categoria → Subcategoria) — view BURRA.
 * Compartilhado pelo "Editar" da M2 (Sugestão e Buscar/Criar vários). Recebe o binding da cascata e só
 * apresenta: quem reseta os níveis inferiores é o `useTaxonomyCascade` (RN-M2-08), não este componente.
 *
 * Os selects listam SÓ nós existentes (RN-M2-10) — a criação de taxonomia é do Orçamento (ADR-0051).
 * Nível cujo ancestral ainda não foi escolhido fica DESABILITADO: sem árvore não há o que oferecer, e um
 * select vazio e clicável sugere que a lista acabou (specs "disabled precisa parecer disabled").
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { TaxonomyCascadeBinding, TaxonomyOption } from '../taxonomy-cascade.binding.ts'
import type { TaxonomyLevel } from '../reconciliation-workspace.view-model.ts'

const t = createTranslator(ptBR)

function Field({
  label,
  placeholder,
  value,
  options,
  disabled,
  onChange,
}: Readonly<{
  label: string
  placeholder: string
  value: string
  options: readonly TaxonomyOption[]
  disabled: boolean
  onChange: (v: string) => void
}>) {
  return (
    <label className={s.taxField}>
      <span className={s.taxLabel}>{label}</span>
      <select
        className={disabled ? s.taxSelectDisabled : s.taxSelect}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => {
          onChange(e.target.value)
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export type TaxonomyCascadeFieldsProps = Readonly<{ cascade: TaxonomyCascadeBinding }>

export function TaxonomyCascadeFields({ cascade }: TaxonomyCascadeFieldsProps) {
  const { refs } = cascade
  const field = (
    level: TaxonomyLevel,
    tag: string,
    options: readonly TaxonomyOption[],
    disabled: boolean,
  ) => (
    <Field
      label={t(tag)}
      placeholder={t('financial.recon.reclass.select')}
      value={refs[level]}
      options={options}
      disabled={disabled}
      onChange={(v) => {
        cascade.setLevel(level, v)
      }}
    />
  )

  return (
    <div className={s.taxGrid}>
      {field('programRef', 'financial.detail.label.programa', cascade.programOptions, false)}
      {field('budgetPlanRef', 'financial.detail.label.planoOrcamentario', cascade.planoOptions, false)}
      {field(
        'costCenterRef',
        'financial.detail.label.centroCusto',
        cascade.costCenterOptions,
        refs.budgetPlanRef === '',
      )}
      {field(
        'categoryRef',
        'financial.detail.label.categoria',
        cascade.categoryOptions,
        refs.costCenterRef === '',
      )}
      {field(
        'subcategoryRef',
        'financial.detail.label.subcategoria',
        cascade.subcategoryOptions,
        refs.categoryRef === '',
      )}
    </div>
  )
}
