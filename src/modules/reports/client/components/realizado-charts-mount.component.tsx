/**
 * RealizadoChartsMount — wrapper que gerencia a ANIMAÇÃO de entrada dos 3 gráficos (pedido da P.O.: barras
 * crescem, arcos do donut giram, a linha "desenha"). Começa `animate=false` (SSR + 1º paint com o estado
 * "vazio") e vira true no mount via requestAnimationFrame → dispara as transições CSS. SSR-safe. Expõe o flag
 * por render-prop para a page compor os cartões (as views de gráfico permanecem burras).
 */
import { useEffect, useState, type ReactNode } from 'react'

export type RealizadoChartsMountProps = Readonly<{
  children: (animate: boolean) => ReactNode
}>

export function RealizadoChartsMount(props: RealizadoChartsMountProps): ReactNode {
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setAnimate(true)
    })
    return () => {
      cancelAnimationFrame(id)
    }
  }, [])
  return <>{props.children(animate)}</>
}
