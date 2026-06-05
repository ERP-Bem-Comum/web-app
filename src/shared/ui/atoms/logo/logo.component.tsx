import type { ReactNode } from 'react'

import { logo } from './logo.css.ts'

/**
 * Logo (átomo) — BURRO e genérico: não embute o caminho da marca (vem por `src`).
 * `size` (default 48) é dinâmico por instância → vai como atributos width/height do <img>
 * (zero-runtime do vanilla-extract não comporta classe estática por instância). `alt` é
 * obrigatório (a11y).
 */
export type LogoProps = Readonly<{
  src: string
  alt: string
  size?: number
}>

export function Logo(props: LogoProps): ReactNode {
  const size = props.size ?? 48

  return <img className={logo} src={props.src} alt={props.alt} width={size} height={size} />
}
