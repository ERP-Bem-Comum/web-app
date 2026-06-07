/**
 * InputWithIcon — molécula do design system: o átomo `Input` com um ícone à direita (decorativo ou
 * botão de ação, ex.: toggle de senha). Genérica (sem regra de negócio). Atomic Design: molécula → átomo.
 */
import type { ReactNode } from 'react'

import { Input } from '#shared/ui/atoms/input/index.ts'
import { inputWrap, iconSlot, iconButton, iconOrange } from './input-with-icon.css.ts'

export type InputWithIconProps = Readonly<{
  id: string
  type?: 'text' | 'email' | 'password'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  invalid?: boolean
  icon: ReactNode
  /** Quando definido, o ícone vira um botão clicável (ex.: toggle de senha). */
  iconAction?: () => void
  /** Aplica cor laranja ao ícone (ex.: olho de senha). */
  iconOrange?: boolean
}>

export function InputWithIcon(props: InputWithIconProps): ReactNode {
  return (
    <div className={inputWrap}>
      <Input
        id={props.id}
        type={props.type}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        invalid={props.invalid}
      />
      {props.iconAction !== undefined ? (
        <button
          type="button"
          className={`${iconButton} ${props.iconOrange === true ? iconOrange : ''}`}
          onClick={props.iconAction}
          aria-label="Alternar visibilidade"
          tabIndex={-1}
        >
          {props.icon}
        </button>
      ) : (
        <span className={`${iconSlot} ${props.iconOrange === true ? iconOrange : ''}`}>{props.icon}</span>
      )}
    </div>
  )
}
