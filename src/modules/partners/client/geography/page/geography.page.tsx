import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { PageHeader } from '#shared/ui/index.ts'

import { useGeographyBinding, type GeoPanel } from '../geography.binding.ts'
import { TerritoryColumn, type ColumnState } from '../components/territory-column.component.tsx'
import { columns, errorBanner, screen, section, ufSelect } from './geography.css.ts'

const t = createTranslator(ptBR)

/** Mapeia o GeoPanel do binding para o ColumnState (burro) do componente. `idle` → lista vazia. */
function toColumnState(panel: GeoPanel): ColumnState {
  switch (panel.status) {
    case 'idle':
      return { status: 'ready', items: [] }
    case 'loading':
      return { status: 'loading' }
    case 'error':
      return { status: 'error', message: t(panel.errorTag) }
    case 'ready':
      return { status: 'ready', items: panel.items }
    default: {
      const _exhaustive: never = panel
      return _exhaustive
    }
  }
}

export function GeographyPage(): ReactNode {
  const g = useGeographyBinding()
  const disabled = !g.canWrite || g.togglePending

  return (
    <div className={screen}>
      <PageHeader title={t('partners.geography.title')} subtitle={t('partners.geography.subtitle')} />

      {g.toggleErrorTag !== null ? (
        <div className={errorBanner} role="alert">
          {t(g.toggleErrorTag)}
        </div>
      ) : null}

      {/* Seção 1 — Estados (sem título de grupo: os cards já têm faixa de título própria) */}
      <section className={section}>
        <div className={columns}>
          <TerritoryColumn
            title={t('partners.geography.states.general')}
            countLabel={g.statesCount}
            searchId="geo-states-general-search"
            searchValue={g.statesGeneralSearch}
            searchPlaceholder={t('partners.geography.states.search')}
            onSearch={g.setStatesGeneralSearch}
            columnLabel={t('partners.geography.states.column')}
            actionLabel={t('partners.geography.action.add')}
            mode="add"
            state={toColumnState(g.statesGeneral)}
            emptyLabel={t('partners.geography.states.empty')}
            addedLabel={t('partners.geography.action.added')}
            addAria={t('partners.geography.add-aria')}
            removeAria={t('partners.geography.remove-aria')}
            disabled={disabled}
            onAction={g.addState}
            loadingLabel={t('partners.geography.loading')}
          />
          <TerritoryColumn
            title={t('partners.geography.states.added')}
            searchId="geo-states-added-search"
            searchValue={g.statesAddedSearch}
            searchPlaceholder={t('partners.geography.states.search')}
            onSearch={g.setStatesAddedSearch}
            columnLabel={t('partners.geography.states.column')}
            actionLabel={t('partners.geography.action.remove')}
            mode="remove"
            state={toColumnState(g.statesAdded)}
            emptyLabel={t('partners.geography.states.added-empty')}
            addedLabel={t('partners.geography.action.added')}
            addAria={t('partners.geography.add-aria')}
            removeAria={t('partners.geography.remove-aria')}
            disabled={disabled}
            onAction={g.removeState}
            loadingLabel={t('partners.geography.loading')}
          />
        </div>
      </section>

      {/* Seção 2 — Municípios (sem título de grupo) */}
      <section className={section}>
        <div className={columns}>
          <TerritoryColumn
            title={t('partners.geography.municipalities.general')}
            beforeSearch={
              <select
                className={ufSelect}
                aria-label={t('partners.geography.municipalities.select-state')}
                value={g.selectedUf ?? ''}
                onChange={(e) => { g.selectUf(e.target.value); }}
              >
                <option value="">{t('partners.geography.municipalities.select-state')}</option>
                {g.ufOptions.map((o) => (
                  <option key={o.uf} value={o.uf}>{o.name}</option>
                ))}
              </select>
            }
            searchId="geo-muni-general-search"
            searchValue={g.municipalitiesGeneralSearch}
            searchPlaceholder={t('partners.geography.municipalities.search')}
            onSearch={g.setMunicipalitiesGeneralSearch}
            columnLabel={t('partners.geography.municipalities.column')}
            actionLabel={t('partners.geography.action.add')}
            mode="toggle"
            state={toColumnState(g.municipalitiesGeneral)}
            emptyLabel={
              g.selectedUf === null
                ? t('partners.geography.select-state-hint')
                : t('partners.geography.municipalities.empty')
            }
            addedLabel={t('partners.geography.action.added')}
            addAria={t('partners.geography.add-aria')}
            removeAria={t('partners.geography.remove-aria')}
            disabled={disabled}
            onAction={(key, added) => { if (added) { g.removeMunicipality(key) } else { g.addMunicipality(key) } }}
            loadingLabel={t('partners.geography.loading')}
          />
          <TerritoryColumn
            title={t('partners.geography.municipalities.added')}
            searchId="geo-muni-added-search"
            searchValue={g.municipalitiesAddedSearch}
            searchPlaceholder={t('partners.geography.municipalities.search')}
            onSearch={g.setMunicipalitiesAddedSearch}
            columnLabel={t('partners.geography.municipalities.column')}
            actionLabel={t('partners.geography.action.remove')}
            mode="remove"
            state={{ status: 'ready', items: [] }}
            emptyLabel={t('partners.geography.municipalities.empty')}
            addedLabel={t('partners.geography.action.added')}
            addAria={t('partners.geography.add-aria')}
            removeAria={t('partners.geography.remove-aria')}
            disabled={disabled}
            onAction={g.removeMunicipality}
            loadingLabel={t('partners.geography.loading')}
            placeholder={
              g.municipalitiesAddedPending ? t('partners.geography.municipalities.added-pending') : undefined
            }
          />
        </div>
      </section>
    </div>
  )
}
