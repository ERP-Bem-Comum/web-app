/**
 * E2E do login — CASOS TRISTES (S1–S8).
 *
 * Roda contra a stack real atrás do Caddy/HTTPS (ver playwright.config.ts e e2e/README.md).
 * Matriz documentada em specs/002-auth/e2e-login-coverage.md. Os textos asseridos são os do
 * catálogo i18n pt-BR (src/shared/i18n/catalog.pt-BR.ts) — a UI nunca mostra status HTTP.
 */
import { test, expect } from '@playwright/test'

import { USERS } from '../fixtures/users.ts'
import { expectSubmitBlocked, fillAndSubmitLogin, gotoLogin, loginLocators } from './login.helpers.ts'

const MSG_INVALID = 'E-mail ou senha inválidos.'
const MSG_DISABLED = 'Sua conta está desativada. Procure o administrador.'

test.describe('Login — casos tristes', () => {
  test('S1: senha errada mostra erro genérico de credenciais', async ({ page }) => {
    await fillAndSubmitLogin(page, { email: USERS.valid.email, password: 'SenhaErrada!2024' })

    const l = loginLocators(page)
    await expect(l.error).toBeVisible()
    await expect(l.error).toHaveText(MSG_INVALID)
    await expect(page).toHaveURL(/\/login/)
  })

  test('S2: e-mail inexistente mostra o MESMO erro (anti-enumeração)', async ({ page }) => {
    await fillAndSubmitLogin(page, { email: USERS.unknown.email, password: USERS.unknown.password })

    const l = loginLocators(page)
    await expect(l.error).toBeVisible()
    // Indistinguível de S1 — proposital (não revela se o e-mail existe).
    await expect(l.error).toHaveText(MSG_INVALID)
    await expect(page).toHaveURL(/\/login/)
  })

  test('S3: conta desabilitada (senha correta) mostra mensagem específica', async ({ page }) => {
    await fillAndSubmitLogin(page, { email: USERS.disabled.email, password: USERS.disabled.password })

    const l = loginLocators(page)
    await expect(l.error).toBeVisible()
    await expect(l.error).toHaveText(MSG_DISABLED)
    await expect(page).toHaveURL(/\/login/)
  })

  test('S4: e-mail com formato inválido bloqueia o submit no client', async ({ page }) => {
    await expectSubmitBlocked(page, { email: 'semarroba', password: 'QualquerSenha!2024' })
  })

  test('S5: e-mail vazio bloqueia o submit no client', async ({ page }) => {
    await expectSubmitBlocked(page, { email: '', password: 'QualquerSenha!2024' })
  })

  test('S6: senha vazia bloqueia o submit no client', async ({ page }) => {
    await expectSubmitBlocked(page, { email: USERS.valid.email, password: '' })
  })

  // S7: anti open-redirect — destino externo é descartado pelo safeRedirect (cai no fallback '/').
  for (const target of ['//evil.com', 'https://evil.com', 'https://evil.com/phish']) {
    test(`S7: redirect malicioso "${target}" nunca leva para fora do app`, async ({ page }) => {
      await gotoLogin(page, target)
      const appHost = new URL(page.url()).host

      const l = loginLocators(page)
      await l.email.fill(USERS.valid.email)
      await l.password.fill(USERS.valid.password)
      await l.submit.click()

      await page.waitForURL((url) => !url.pathname.startsWith('/login'))
      const after = new URL(page.url())
      expect(after.host, 'nunca pode navegar para domínio externo').toBe(appHost)
      expect(after.pathname, 'fallback do safeRedirect é "/"').toBe('/')
    })
  }

  test('S8: durante o submit o botão fica em estado de carregamento (desabilitado + aria-busy)', async ({
    page,
  }) => {
    // Atrasa a resposta do BFF (RPC = POST) para tornar o estado transitório observável.
    await page.route('**', async (route) => {
      if (route.request().method() === 'POST') await new Promise((r) => setTimeout(r, 1500))
      await route.continue()
    })

    await fillAndSubmitLogin(page, USERS.valid)

    // Durante o loading o nome acessível do botão vira "Carregando…"; use o único botão do form.
    const button = page.getByRole('button')
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('aria-busy', 'true')
  })
})
