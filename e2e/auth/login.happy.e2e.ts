/**
 * E2E do login — CASOS FELIZES (H1–H6).
 *
 * Roda contra a stack real atrás do Caddy/HTTPS (ver playwright.config.ts e e2e/README.md).
 * Matriz documentada em specs/002-auth/e2e-login-coverage.md.
 */
import { test, expect } from '@playwright/test'

import { USERS } from '../fixtures/users.ts'
import { fillAndSubmitLogin, login, loginLocators } from './login.helpers.ts'

const SESSION_COOKIE = '__Host-session'
// Padrões que NUNCA podem vazar ao browser (Princípio I / ADR-0005 / SC-002).
const TOKEN_PATTERNS = [/accessToken/i, /refreshToken/i, /Bearer\s/i, /^eyJ/]

test.describe('Login — casos felizes', () => {
  test('H1: credenciais válidas (sem "lembrar") autenticam e saem da /login', async ({ page }) => {
    await login(page, USERS.valid)

    // Fallback de redirect é '/' (safeRedirect) → a Home renderiza.
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: /Bem Comum/i })).toBeVisible()
    await expect(loginLocators(page).submit).toBeHidden()
  })

  test('H2: "lembrar este dispositivo" cria sessão persistente (cookie com expiração)', async ({
    page,
    context,
  }) => {
    await login(page, { ...USERS.valid, remember: true })

    const cookies = await context.cookies()
    const session = cookies.find((c) => c.name === SESSION_COOKIE)
    expect(session, 'cookie __Host-session deve existir após login').toBeDefined()
    // Persistente = tem expiração futura (cookie de sessão teria expires = -1).
    expect(session?.expires).toBeGreaterThan(Date.now() / 1000)
    // Atributos de segurança do prefixo __Host-.
    expect(session?.secure).toBe(true)
    expect(session?.path).toBe('/')
  })

  test('H3: ?redirect=/dashboard leva ao destino após autenticar', async ({ page }) => {
    await fillAndSubmitLogin(page, { ...USERS.valid, redirect: '/dashboard' })

    await page.waitForURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('H4: usuário já autenticado é redirecionado para fora da /login', async ({ page }) => {
    await login(page, USERS.valid)

    // Visitar /login novamente: o beforeLoad redireciona (não renderiza o form).
    await page.goto('/login')
    await page.waitForURL((url) => !url.pathname.startsWith('/login'))
    await expect(loginLocators(page).submit).toBeHidden()
  })

  test('H5: token NUNCA chega ao browser (cookie opaco, sem token em storage)', async ({
    page,
    context,
  }) => {
    await login(page, USERS.valid)

    // (a) Cookies: existe o __Host-session opaco; nenhum cookie carrega/parece token.
    const cookies = await context.cookies()
    const session = cookies.find((c) => c.name === SESSION_COOKIE)
    expect(session, 'sessão deve ser um cookie opaco').toBeDefined()
    expect(session?.httpOnly).toBe(true)
    for (const cookie of cookies) {
      for (const pattern of TOKEN_PATTERNS) {
        expect(cookie.name, `cookie ${cookie.name} não pode conter token`).not.toMatch(pattern)
        expect(cookie.value, `valor do cookie ${cookie.name} não pode ser/conter token`).not.toMatch(pattern)
      }
    }

    // (b) Storage do browser: nada de token em local/sessionStorage.
    const storage = await page.evaluate(() =>
      JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }),
    )
    for (const pattern of TOKEN_PATTERNS) {
      expect(storage).not.toMatch(pattern)
    }
  })

  test('H6: guard — rota protegida sem sessão redireciona à /login preservando o destino', async ({
    page,
  }) => {
    // Sem login: acessar /dashboard cai no beforeLoad do layout _authenticated.
    await page.goto('/dashboard')
    await page.waitForURL(/\/login/)
    // O destino pretendido é preservado em ?redirect= (US2 / FR-004).
    expect(new URL(page.url()).searchParams.get('redirect')).toContain('/dashboard')
    await expect(loginLocators(page).submit).toBeVisible()
  })
})
