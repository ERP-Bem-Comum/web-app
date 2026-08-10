/**
 * ExportMenu — view burra: botão "Exportar conciliação" + dropdown (CSV Nibo/PDF), fiel ao mock (espelha o
 * Importar, abre p/ cima no footer). Recebe o estado de abrir/fechar (`menus`), a ação de export de texto
 * (`exportBinding`) e a de imprimir o relatório (`reportPdf`).
 *
 * O item OFX saiu da TELA (decisão da P.O.: "nunca será ativado"). O formato segue existindo no BFF e no
 * core-api (`format=ofx`) — foi removida a porta de entrada, não o transporte.
 *
 * **Sem gate de conciliação/fechamento (core-api#649).** Os DOIS itens exportam o intervalo VISUALIZADO, a
 * qualquer momento: o CSV pela rota nova por conta+intervalo, o PDF por `window.print()` num bloco oculto.
 * Como o critério virou o mesmo, o único "desabilitado" possível é não haver intervalo resolvido (período
 * personalizado pela metade) — e aí não há o que exportar em nenhum dos dois.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { ChevronDownIcon, DownloadIcon } from '#shared/ui/icons/index.ts'

import * as s from '../page/reconciliation-workspace.css.ts'
import type { HeaderMenusBinding } from '../header-menus.binding.ts'
import type { ExportBinding } from '../export-conciliacao.binding.ts'
import type { ExportFormat } from '../reconciliation-workspace.view-model.ts'

const t = createTranslator(ptBR)

const ITEMS: readonly { ic: string; lblTag: string; hintTag?: string; format: ExportFormat | null }[] = [
  {
    ic: 'CSV',
    lblTag: 'financial.recon.export.csv',
    hintTag: 'financial.recon.export.csvHint',
    format: 'csv-nibo',
  },
  // PDF (#144): caminho separado — imprime o relatório do período visualizado (habilita por conta + período).
  {
    ic: 'PDF',
    lblTag: 'financial.recon.export.pdf',
    hintTag: 'financial.recon.export.pdfHint',
    format: null,
  },
]

// #144: o PDF é um caminho SEPARADO do export de texto (OFX/CSV) — dispara `window.print()` DIRETO (sem aba).
export type ReportPdfMenu = Readonly<{ enabled: boolean; print: () => void }>

export type ExportMenuProps = Readonly<{
  menus: HeaderMenusBinding
  exportBinding: ExportBinding
  reportPdf: ReportPdfMenu
}>

export function ExportMenu({ menus, exportBinding, reportPdf }: ExportMenuProps) {
  const { canExport, periodLabel, exporting, errorTag } = exportBinding
  return (
    <div className={s.ddWrap}>
      <button
        type="button"
        className={s.btnSecondary}
        aria-haspopup="menu"
        aria-expanded={menus.exportOpen}
        onClick={menus.toggleExport}
      >
        <DownloadIcon />
        {t('financial.recon.bottombar.export')}
        <ChevronDownIcon />
      </button>

      {menus.exportOpen ? (
        <>
          <button
            type="button"
            className={s.ddBackdrop}
            aria-label={t('financial.recon.bottombar.export')}
            onClick={menus.closeAll}
          />
          <div className={s.exportMenu} role="menu">
            <div className={s.ddGroup}>{t('financial.recon.export.group')}</div>
            {/* Agora o range descreve o alvo dos DOIS itens (#649) — é o intervalo visualizado. */}
            {periodLabel !== null ? (
              <div className={s.ddGroup}>{`${t('financial.recon.export.periodLabel')}: ${periodLabel}`}</div>
            ) : null}
            {ITEMS.map((it) => {
              // Mesmo critério para os dois: intervalo resolvido em tela. O CSV soma o `exporting` porque é
              // o único que faz rede (o PDF é `window.print()`, síncrono).
              const isPdf = it.format === null
              const disabled = isPdf ? !reportPdf.enabled : !canExport || exporting
              const title = disabled && !exporting ? t('financial.recon.export.noRange') : undefined
              return (
                <button
                  key={it.ic}
                  type="button"
                  role="menuitem"
                  className={disabled ? s.ddItem.off : s.ddItem.on}
                  disabled={disabled}
                  aria-disabled={disabled}
                  title={title}
                  onClick={() => {
                    if (isPdf) {
                      menus.closeAll()
                      reportPdf.print()
                    } else if (it.format !== null) {
                      exportBinding.exportAs(it.format)
                    }
                  }}
                >
                  <span className={s.ddItemIc} aria-hidden>
                    {it.ic}
                  </span>
                  <span className={s.ddItemLbl}>{t(it.lblTag)}</span>
                  {it.hintTag !== undefined ? <span className={s.ddItemHint}>{t(it.hintTag)}</span> : null}
                </button>
              )
            })}
            {errorTag !== null ? <div className={s.ddGroup}>{t(errorTag)}</div> : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
