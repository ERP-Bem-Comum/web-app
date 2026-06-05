/**
 * InputWithIcon — wrapper local do Input (átomo) com ícone à direita.
 * Específico da feature de login; não faz parte do design system genérico.
 */
import type { ReactNode } from 'react'

import { Input } from '#shared/ui/index.ts'
import {
  inputWrap,
  iconSlot,
  iconButton,
  iconOrange,
} from './input-with-icon.css.ts'

export type InputWithIconProps = Readonly<{
  id: string
  type?: 'text' | 'email' | 'password'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  invalid?: boolean
  icon: ReactNode
  /** Quando true, o ícone vira um botão clicável (ex: toggle senha). */
  iconAction?: () => void
  /** Aplica cor laranja ao ícone (ex: olho de senha). */
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
          className={`${iconButton} ${props.iconOrange ? iconOrange : ''}`}
          onClick={props.iconAction}
          aria-label="Alternar visibilidade"
          tabIndex={-1}
        >
          {props.icon}
        </button>
      ) : (
        <span className={`${iconSlot} ${props.iconOrange ? iconOrange : ''}`}>{props.icon}</span>
      )}
    </div>
  )
}
