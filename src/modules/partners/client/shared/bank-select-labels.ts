/**
 * Rótulos do seletor de banco — em um lugar só, para os cinco formulários que o consomem.
 *
 * O `BankSelect` vive em `#shared/ui/brand` e é BURRO: não fala i18n, como o BrandPaginator. Quem o
 * usa passa os rótulos. Eles não variam por tipo de parceiro — "Selecione o banco…" é a mesma frase
 * para Fornecedor, Colaborador, Financiador e ACT —, então mantê-los por tela significaria cinco
 * lugares para editar a mesma palavra, que é como a divergência começa.
 *
 * Fica aqui, e não junto do componente, porque `src/shared/ui/**` não importa `#shared/i18n` em lugar
 * nenhum hoje: a tradução é responsabilidade de quem monta a tela, não do átomo visual.
 */
import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { BankSelectLabels } from '#shared/ui/brand/bank-select.component.tsx'

const t = createTranslator(ptBR)

export const BANK_LABELS: BankSelectLabels = {
  placeholder: t('partners.form.bankPlaceholder'),
  frequentGroup: t('partners.form.bankFrequent'),
  allGroup: t('partners.form.bankAll'),
  unknownPrefix: t('partners.form.bankUnknown'),
}

/**
 * Aviso do cadastro LEGADO (banco digitado à mão, fora da tabela FEBRABAN). O motivo não é do tipo de
 * parceiro — é do arquivo CNAB, que recusa a transferência sem o código —, então a frase é uma só.
 */
export const BANK_UNKNOWN_HINT: string = t('partners.form.bankUnknownHint')
