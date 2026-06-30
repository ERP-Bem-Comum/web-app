/**
 * Regressão visual dos ORGANISMOS do design system (spec 009) — pixel-diff contra baseline.
 * Roda contra a stack (https://app.localhost), na rota pública de showcase `/showcase/organisms`
 * (catálogo de QA do DS, dados estáticos — não é tela de produto). Baseline OFICIAL é `-linux`
 * (Docker/CI); ver `.claude/guides/visual-testing.md`. Atualizar baseline (após revisão humana):
 * pnpm test:visual:update.
 *
 * Screenshots por ESTADO via `data-testid` (determinísticos): cada seção da showcase vira um PNG.
 */
import { test, expect } from '@playwright/test'

test.describe('Organismos — visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/showcase/organisms')
    await page.waitForLoadState('networkidle')
    await page.evaluate(async () => {
      await document.fonts.ready
    })
  })

  test('PageHeader — com ações', async ({ page }) => {
    await expect(page.getByTestId('ph-actions')).toHaveScreenshot('page-header-actions.png')
  })

  test('PageHeader — sem ações', async ({ page }) => {
    await expect(page.getByTestId('ph-plain')).toHaveScreenshot('page-header-plain.png')
  })

  test('DataTable — ready com dados', async ({ page }) => {
    await expect(page.getByTestId('dt-ready')).toHaveScreenshot('data-table-ready.png')
  })

  test('DataTable — vazio', async ({ page }) => {
    await expect(page.getByTestId('dt-empty')).toHaveScreenshot('data-table-empty.png')
  })

  test('DataTable — carregando', async ({ page }) => {
    await expect(page.getByTestId('dt-loading')).toHaveScreenshot('data-table-loading.png')
  })

  test('DataTable — erro', async ({ page }) => {
    await expect(page.getByTestId('dt-error')).toHaveScreenshot('data-table-error.png')
  })
})
