/**
 * Event Bus (Observer) — §XII. Eventos no passado; emit/on; unsubscribe.
 * TDD: escrito ANTES da impl.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { createEventBus } from '../../../src/shared/bus/bus.ts'

type TestEvent =
  | { type: 'UsuarioAutenticado'; userId: string }
  | { type: 'SessaoEncerrada' }

describe('createEventBus', () => {
  it('entrega o evento ao handler inscrito no tipo', () => {
    const bus = createEventBus<TestEvent>()
    let received: string | null = null
    bus.on('UsuarioAutenticado', (e) => {
      received = e.userId
    })

    bus.emit({ type: 'UsuarioAutenticado', userId: 'u1' })

    assert.equal(received, 'u1')
  })

  it('não entrega a handlers de outro tipo', () => {
    const bus = createEventBus<TestEvent>()
    let calls = 0
    bus.on('SessaoEncerrada', () => {
      calls += 1
    })

    bus.emit({ type: 'UsuarioAutenticado', userId: 'u1' })

    assert.equal(calls, 0)
  })

  it('unsubscribe para a entrega', () => {
    const bus = createEventBus<TestEvent>()
    let calls = 0
    const off = bus.on('SessaoEncerrada', () => {
      calls += 1
    })

    bus.emit({ type: 'SessaoEncerrada' })
    off()
    bus.emit({ type: 'SessaoEncerrada' })

    assert.equal(calls, 1)
  })
})
