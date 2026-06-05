/**
 * Event Bus — Observer cross-feature (constituição §XII). Sobre `EventTarget` nativo (§VIII).
 * Eventos são fatos no PASSADO (ex.: `UsuarioAutenticado`). `client/usecase` emite; `view-model` assina.
 * Opt-in: chamada direta é o normal; use o bus só para efeito cross-feature. Tipos de evento client
 * vivem em `client/data` (§XII); o bus é genérico sobre a união de eventos da feature.
 */

export type BusEvent = Readonly<{ type: string }>

export type EventBus<E extends BusEvent> = Readonly<{
  emit: (event: E) => void
  /** Inscreve no `type`; retorna a função de unsubscribe. */
  on: <T extends E['type']>(type: T, handler: (event: Extract<E, { type: T }>) => void) => () => void
}>

export const createEventBus = <E extends BusEvent>(): EventBus<E> => {
  const target = new EventTarget()
  return {
    emit: (event) => {
      target.dispatchEvent(new CustomEvent<E>(event.type, { detail: event }))
    },
    on: (type, handler) => {
      const listener = (e: Event): void => {
        // `e` é sempre o CustomEvent<E> que emitimos acima; detail carrega o evento tipado.
        handler((e as CustomEvent<Extract<E, { type: typeof type }>>).detail)
      }
      target.addEventListener(type, listener)
      return () => {
        target.removeEventListener(type, listener)
      }
    },
  }
}
