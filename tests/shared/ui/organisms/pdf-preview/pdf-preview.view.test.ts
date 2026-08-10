/**
 * pdf-preview.view (node:test) — helpers PUROS de escala do canvas do preview de PDF. Cobrem o clamp de
 * zoom (50–200), o `devicePixelRatio` seguro (fallback 1) e a conversão backing↔css (nitidez retina).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import {
  PDF_ZOOM_MAX,
  PDF_ZOOM_MIN,
  backingScale,
  clampPdfZoom,
  cssPxFromBacking,
  safeDpr,
} from '#shared/ui/organisms/pdf-preview/pdf-preview.view.ts'

describe('clampPdfZoom', () => {
  it('mantém dentro de [50, 200] e arredonda', () => {
    assert.equal(clampPdfZoom(100), 100)
    assert.equal(clampPdfZoom(49), PDF_ZOOM_MIN)
    assert.equal(clampPdfZoom(0), PDF_ZOOM_MIN)
    assert.equal(clampPdfZoom(201), PDF_ZOOM_MAX)
    assert.equal(clampPdfZoom(1000), PDF_ZOOM_MAX)
    assert.equal(clampPdfZoom(124.6), 125)
  })
})

describe('safeDpr', () => {
  it('devolve o dpr quando finito e > 0', () => {
    assert.equal(safeDpr(2), 2)
    assert.equal(safeDpr(1.5), 1.5)
  })
  it('cai em 1 para valores inválidos (SSR/jsdom sem devicePixelRatio)', () => {
    assert.equal(safeDpr(0), 1)
    assert.equal(safeDpr(-3), 1)
    assert.equal(safeDpr(Number.NaN), 1)
    assert.equal(safeDpr(Number.POSITIVE_INFINITY), 1)
  })
})

describe('backingScale', () => {
  it('escala lógica (zoom/100) × dpr', () => {
    assert.equal(backingScale(100, 1), 1)
    assert.equal(backingScale(100, 2), 2)
    assert.equal(backingScale(50, 2), 1)
    assert.equal(backingScale(200, 1), 2)
  })
  it('clampa o zoom antes de escalar e sanea o dpr', () => {
    assert.equal(backingScale(10, 1), 0.5) // 10 → clamp 50 → 0.5
    assert.equal(backingScale(100, 0), 1) // dpr inválido → 1
  })
})

describe('cssPxFromBacking', () => {
  it('divide o backing pelo dpr (tamanho CSS lógico)', () => {
    assert.equal(cssPxFromBacking(200, 2), 100)
    assert.equal(cssPxFromBacking(150, 1), 150)
  })
  it('usa dpr saneado', () => {
    assert.equal(cssPxFromBacking(120, 0), 120)
  })
})
