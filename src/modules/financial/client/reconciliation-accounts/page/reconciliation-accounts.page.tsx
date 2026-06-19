/**
 * Grid de contas de Conciliação (TELA 1) — PAGE (view burra §XI). Entrada do módulo pelo menu. A listagem
 * real de contas-cedente depende do core-api#168; até lá é CHROME honesto: estado anunciado + CTA para
 * abrir o workspace com a conta de teste (placeholder, D2), e "Adicionar conta" desabilitado. O grid real
 * (busca/filtros/ordenação) entra na US6 quando #168 expor o cadastro.
 */
import { Link } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { WalletIcon } from '#shared/ui/icons/index.ts'

import * as s from './reconciliation-accounts.css.ts'

const t = createTranslator(ptBR)

// Conta de teste (placeholder) p/ destravar o workspace até #168 expor o cadastro de contas-cedente.
// UUID v4 válido; o import NÃO valida o ref no backend (#152), então qualquer uuid consistente serve.
const PLACEHOLDER_ACCOUNT_REF = 'b1a7c0de-0000-4000-8000-000000000168'

export function ReconciliationAccountsPage() {
  return (
    <div className={s.screen}>
      <div className={s.emptyCard}>
        <WalletIcon />
        <h2 className={s.title}>{t('financial.recon.accounts.unavailable.title')}</h2>
        <p className={s.body}>{t('financial.recon.accounts.unavailable.body')}</p>
        <div className={s.actions}>
          <Link
            to="/financeiro/conciliacao/$accountId"
            params={{ accountId: PLACEHOLDER_ACCOUNT_REF }}
            className={s.btnPrimary}
          >
            {t('financial.recon.accounts.openWorkspace')}
          </Link>
          <button type="button" className={s.btnSecondary} disabled aria-disabled="true">
            {t('financial.recon.accounts.addAccount')}
          </button>
        </div>
      </div>
    </div>
  )
}
