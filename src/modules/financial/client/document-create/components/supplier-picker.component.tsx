/**
 * Hero do fornecedor com picker buscável (Lançar Documento) — view BURRA (§XI). Espelha o UX de busca de
 * parceiro de Contratos: botão "Alterar fornecedor" abre um dropdown com TODOS os parceiros cadastrados
 * (Fornecedor/Financiador/Ato), filtrável por nome/CNPJ. Recebe estado e dados por props; sem hooks de dado.
 *
 * No futuro o OCR auto-identifica o fornecedor pela leitura do documento (chrome — issue #89); aqui é a
 * via MANUAL. ⚠️ supplierRef hoje só aceita Fornecedor no core-api (não-fornecedor → erro ao salvar).
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { initialsFrom } from '#shared/ui/index.ts'

import { filterPartners, partnerKindTag, type PartnerOption } from '../document-form.view.ts'
import {
  hero,
  heroInfo,
  heroOverline,
  heroName,
  heroCnpj,
  heroAlter,
  pickerWrap,
  pickerBackdrop,
  pickerDropdown,
  pickerSearch,
  pickerItem,
  pickerItemSelected,
  pickerAvatar,
  pickerItemInfo,
  pickerItemName,
  pickerItemCnpj,
  pickerEmpty,
  kindBadge,
} from '../page/lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type SupplierPickerProps = Readonly<{
  selected: PartnerOption | null
  options: readonly PartnerOption[]
  open: boolean
  query: string
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
        <span className={heroOverline}>
          {selected !== null ? t(partnerKindTag(selected.kind)) : t('financial.create.hero.overline')}
        </span>
        <span className={heroName}>
          {selected !== null ? selected.name : t('financial.create.hero.placeholder')}
        </span>
        {selected !== null ? <span className={heroCnpj}>{selected.subtitle}</span> : null}
      </div>

      <div className={pickerWrap}>
        <button type="button" className={heroAlter} onClick={props.onToggle} aria-expanded={props.open}>
          {t('financial.create.hero.change')}
        </button>

        {props.open ? (
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
                    className={`${pickerItem} ${selected?.id === p.id ? pickerItemSelected : ''}`}
                    onClick={() => {
                      props.onSelect(p.id)
                    }}
                  >
                    <span className={pickerAvatar} aria-hidden="true">
                      {initialsFrom(p.name)}
                    </span>
                    <span className={pickerItemInfo}>
                      <span className={pickerItemName}>{p.name}</span>
                      <span className={pickerItemCnpj}>{p.subtitle}</span>
                    </span>
                    <span className={kindBadge.blue}>{t(partnerKindTag(p.kind))}</span>
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
