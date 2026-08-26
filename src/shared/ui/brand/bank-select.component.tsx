/**
 * BankSelect — seletor de banco pelo CÓDIGO DE COMPENSAÇÃO (FEBRABAN/COMPE), identidade "brand".
 * View burra: recebe o código selecionado e devolve o novo pelo callback (`BrandPaginator` é o modelo
 * — rótulos entram por props, o componente não fala i18n). A tabela vem de `#shared/banking`.
 *
 * O que ele guarda é o **CÓDIGO** ('237'), não o nome: é o código que o CNAB 240 grava e é por ele que
 * o pré-voo da remessa consegue conferir o cadastro. O nome é derivado na hora de exibir.
 *
 * ⚠️ **VALOR LEGADO.** O cadastro de parceiro guardava o banco como TEXTO LIVRE, então há registros com
 * "Bradesco", "banco 237" ou coisa pior. Quando o valor atual não corresponde a nenhum código
 * conhecido, ele entra como uma opção PRÓPRIA no topo, marcada como não reconhecida, e segue
 * selecionado. Nunca é descartado em silêncio: zerar o banco de um favorecido sem avisar troca um
 * cadastro imperfeito por um cadastro VAZIO, e o operador só descobriria na recusa do banco.
 *
 * Os 12 "Mais usados" repetem dentro de "Todos os bancos" de propósito. O rótulo é o MESMO nos dois
 * grupos (mesmo código → mesmo texto), então tanto faz por onde a pessoa escolhe: o que o campo mostra
 * depois não muda.
 */
import type { ReactNode } from 'react'

import { ChevronDownIcon } from '#shared/ui/icons/index.ts'
import { FEBRABAN_BANKS, FREQUENT_BANKS, bankNameByCode } from '#shared/banking/febraban-banks.ts'
import { control, select, chevron, controlError } from './brand-form.css.ts'

export type BankSelectLabels = Readonly<{
  /** Opção vazia no topo ("Selecione o banco"). */
  placeholder: string
  /** Título do grupo dos 12 mais usados. */
  frequentGroup: string
  /** Título do grupo com a tabela completa. */
  allGroup: string
  /** Prefixo da opção legada, concatenado ao valor bruto (ex.: "Não reconhecido:"). */
  unknownPrefix: string
}>

export type BankSelectProps = Readonly<{
  id: string
  /** Código de compensação selecionado, ou o texto legado ainda não convertido, ou '' (nenhum). */
  value: string
  labels: BankSelectLabels
  invalid?: boolean
  disabled?: boolean
  ariaLabel?: string
  onChange: (code: string) => void
}>

const optionLabel = (code: string, name: string): string => `${code} · ${name}`

/** O valor atual é texto legado (preenchido, mas fora da tabela)? Então ele precisa de opção própria. */
export const isUnknownBank = (value: string): boolean => value !== '' && bankNameByCode(value) === undefined

export function BankSelect(props: BankSelectProps): ReactNode {
  const unknown = isUnknownBank(props.value)
  return (
    <div className={control}>
      <select
        id={props.id}
        className={`${select} ${props.invalid === true ? controlError : ''}`}
        value={props.value}
        disabled={props.disabled ?? false}
        aria-label={props.ariaLabel}
        onChange={(e) => {
          props.onChange(e.target.value)
        }}
      >
        <option value="">{props.labels.placeholder}</option>
        {unknown ? (
          <option value={props.value}>{`${props.labels.unknownPrefix} ${props.value}`}</option>
        ) : null}
        <optgroup label={props.labels.frequentGroup}>
          {FREQUENT_BANKS.map((b) => (
            <option key={`freq-${b.code}`} value={b.code}>
              {optionLabel(b.code, b.name)}
            </option>
          ))}
        </optgroup>
        <optgroup label={props.labels.allGroup}>
          {FEBRABAN_BANKS.map((b) => (
            <option key={b.code} value={b.code}>
              {optionLabel(b.code, b.name)}
            </option>
          ))}
        </optgroup>
      </select>
      <span className={chevron}>
        <ChevronDownIcon size={16} />
      </span>
    </div>
  )
}
