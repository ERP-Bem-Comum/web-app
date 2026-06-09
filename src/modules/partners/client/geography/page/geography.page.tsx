import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { Input, PageHeader } from '#shared/ui/index.ts'

import { useGeographyBinding, type PanelState, type TerritoryItem } from '../geography.binding.ts'
import { TerritoryList } from '../components/territory-list.component.tsx'
import { count, errorBanner, message, panel, panelHeader, panelTitle, panels, screen } from './geography.css.ts'

const t = createTranslator(ptBR)

export function GeographyPage(): ReactNode {
  const g = useGeographyBinding()

  return (
    <div className={screen}>
      <PageHeader title={t('partners.geography.title')} subtitle={t('partners.geography.subtitle')} />

      {g.toggleErrorTag !== null ? (
        <div className={errorBanner} role="alert">
          {t(g.toggleErrorTag)}
        </div>
      ) : null}

      <div className={panels}>
        <section className={panel}>
          <div className={panelHeader}>
            <h2 className={panelTitle}>{t('partners.geography.states.title')}</h2>
            {g.statesCount !== null ? <span className={count}>{g.statesCount}</span> : null}
          </div>
          <Input
            id="geo-states-search"
            value={g.statesSearch}
            placeholder={t('partners.geography.states.search')}
            onChange={g.setStatesSearch}
          />
          <Panel
            state={g.states}
            emptyLabel={t('partners.geography.states.empty')}
            toggleAria={t('partners.geography.toggle-aria')}
            toggleDisabled={!g.canWrite || g.togglePending}
            onToggle={g.toggleState}
            onSelect={g.selectUf}
            selectedKey={g.selectedUf}
          />
        </section>

        <section className={panel}>
          <div className={panelHeader}>
            <h2 className={panelTitle}>{t('partners.geography.municipalities.title')}</h2>
            {g.selectedUf !== null && g.municipalitiesCount !== null ? (
              <span className={count}>{g.municipalitiesCount}</span>
            ) : null}
          </div>
          {g.selectedUf === null ? (
            <p className={message}>{t('partners.geography.select-state-hint')}</p>
          ) : (
            <>
              <Input
                id="geo-muni-search"
                value={g.municipalitiesSearch}
                placeholder={t('partners.geography.municipalities.search')}
                onChange={g.setMunicipalitiesSearch}
              />
              <Panel
                state={g.municipalities}
                emptyLabel={t('partners.geography.municipalities.empty')}
                toggleAria={t('partners.geography.toggle-aria')}
                toggleDisabled={!g.canWrite || g.togglePending}
                onToggle={g.toggleMunicipality}
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}

type PanelProps = Readonly<{
  state: PanelState<TerritoryItem>
  emptyLabel: string
  toggleAria: string
  toggleDisabled: boolean
  onToggle: (key: string, checked: boolean) => void
  onSelect?: (key: string) => void
  selectedKey?: string | null
}>

function Panel(props: PanelProps): ReactNode {
  switch (props.state.status) {
    case 'idle':
    case 'loading':
      return <p className={message}>{t('partners.geography.loading')}</p>
    case 'error':
      return <p className={message}>{t(props.state.errorTag)}</p>
    case 'ready':
      return (
        <TerritoryList
          items={props.state.items}
          emptyLabel={props.emptyLabel}
          toggleAria={props.toggleAria}
          toggleDisabled={props.toggleDisabled}
          onToggle={props.onToggle}
          onSelect={props.onSelect}
          selectedKey={props.selectedKey}
        />
      )
    default: {
      const _exhaustive: never = props.state
      return _exhaustive
    }
  }
}
