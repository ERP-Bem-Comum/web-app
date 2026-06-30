/**
 * Hero do fornecedor com picker buscável (Lançar Documento) — view BURRA (§XI). Mantém o MESMO padrão
 * visual do "Contratado" de Contratos (módulos reformados compartilham padrão): item do dropdown =
 * `AvatarLabel` (avatar colorido por tipo + "Nome · Tipo"); selecionado = overline + badge "PJ · TIPO"
 * (cores `partnerType.*`) + nome + CNPJ mascarado. Recebe estado/dados por props; sem hooks de dado.
 *
 * No futuro o OCR auto-identifica o fornecedor (chrome — issue #89); aqui é a via MANUAL.
 * ⚠️ supplierRef hoje só aceita Fornecedor no core-api (não-fornecedor → erro ao salvar — issue #90).
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { AvatarLabel, initialsFrom } from '#shared/ui/index.ts'

import {
  filterPartners,
  partnerKindTag,
  maskDocument,
  isPartnerPF,
  type PartnerOption,
} from '../document-form.view.ts'
import {
  hero,
  heroInfo,
  heroOverline,
  heroName,
  heroCnpj,
  heroBadgeRow,
  heroAlter,
  partnerBadge,
  pickerWrap,
  pickerBackdrop,
  pickerDropdown,
  pickerSearch,
  pickerItem,
  pickerEmpty,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type SupplierPickerProps = Readonly<{
  selected: PartnerOption | null
  options: readonly PartnerOption[]
  open: boolean
  query: string
  /** Modo edição: fornecedor é imutável → esconde "Alterar fornecedor" (somente-consulta). */
  disabled?: boolean
  onToggle: () => void
  onClose: () => void
  onQueryChange: (value: string) => void
  onSelect: (id: string) => void
}>

export function SupplierPicker(props: SupplierPickerProps): ReactNode {
  const { selected } = props
  const filtered = filterPartners(props.options, props.query)

  return (
    <div className={hero}>
      <div className={heroInfo}>
        <div className={heroBadgeRow}>
          <span className={heroOverline}>{t('financial.create.hero.overline')}</span>
          {selected !== null ? (
            <span className={partnerBadge[selected.kind]}>
              {isPartnerPF(selected.kind)
                ? t('financial.create.partner.pf')
                : t('financial.create.partner.pj')}
              {' · '}
              {t(partnerKindTag(selected.kind))}
            </span>
          ) : null}
        </div>
        <span className={heroName}>
          {selected !== null ? selected.name : t('financial.create.hero.placeholder')}
        </span>
        {selected !== null ? (
          <span className={heroCnpj}>
            {`${
              isPartnerPF(selected.kind)
                ? t('financial.create.partner.cpfLabel')
                : t('financial.create.partner.cnpjLabel')
            } ${maskDocument(selected.subtitle)}`}
          </span>
        ) : null}
      </div>

      <div className={pickerWrap}>
        {props.disabled === true ? null : (
          <button type="button" className={heroAlter} onClick={props.onToggle} aria-expanded={props.open}>
            {t('financial.create.hero.change')}
          </button>
        )}

        {props.open && props.disabled !== true ? (
          <>
            <button
              type="button"
              className={pickerBackdrop}
              aria-label={t('financial.create.partner.close')}
              onClick={props.onClose}
            />
            <div className={pickerDropdown} role="listbox">
              <input
                className={pickerSearch}
                value={props.query}
                placeholder={t('financial.create.partner.search')}
                aria-label={t('financial.create.partner.search')}
                autoFocus
                onChange={(e) => {
                  props.onQueryChange(e.target.value)
                }}
              />
              {filtered.length === 0 ? (
                <p className={pickerEmpty}>{t('financial.create.partner.empty')}</p>
              ) : (
                filtered.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    role="option"
                    aria-selected={selected?.id === p.id}
                    className={pickerItem}
                    onClick={() => {
                      props.onSelect(p.id)
                    }}
                  >
                    <AvatarLabel
                      initials={initialsFrom(p.name)}
                      variant={p.kind}
                      text={`${p.name} · ${t(partnerKindTag(p.kind))}`}
                    />
                  </button>
                ))
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
