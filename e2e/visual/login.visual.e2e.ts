/**
 * Regressão visual da tela de login (pública) — pixel-diff contra o baseline.
 * Roda contra a stack (https://app.localhost). Baseline OFICIAL é `-linux` (Docker/CI); ver
 * `.claude/guides/visual-testing.md`. Atualizar baseline (após revisão humana): pnpm test:visual:update.
 */
import { test, expect } from '@playwright/test'

import { gotoLogin } from '../auth/login.helpers.ts'

test.describe('Login — visual', () => {
  test('estado inicial da tela de login', async ({ page }) => {
    await gotoLogin(page) // navega + espera hidratação (networkidle)
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    await expect(page).toHaveScreenshot('login-initial.png', { fullPage: true })
  })

  test('senha visível (toggle do olho acionado)', async ({ page }) => {
    await gotoLogin(page)
    await page.getByLabel('Senha').fill('exemplo-senha')
    await page.getByRole('button', { name: 'Alternar visibilidade' }).click()
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    await expect(page).toHaveScreenshot('login-password-visible.png', { fullPage: true })
  })
})
