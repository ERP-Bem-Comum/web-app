/**
 * Regressão visual do SHELL autenticado (tela-raiz `root`, ADR-0012): sidebar (índigo nav) + topbar +
 * container. Reusa o `login()` helper (sessão real via stack). Cobre o estado expandido e o recolhido.
 * Ver `.claude/guides/visual-testing.md`.
 */
import { test, expect } from '@playwright/test'

import { login } from '../auth/login.helpers.ts'
import { USERS } from '../fixtures/users.ts'

test.describe('Shell autenticado — visual', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.valid) // após o sucesso, fica numa rota autenticada (default /dashboard)
  })

  test('sidebar expandida + topbar (em /dashboard)', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    await expect(page).toHaveScreenshot('shell-dashboard-expanded.png', { fullPage: true })
  })

  test('sidebar recolhida (toggle ☰)', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Recolher menu' }).click()
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    await expect(page).toHaveScreenshot('shell-dashboard-collapsed.png', { fullPage: true })
  })
})
