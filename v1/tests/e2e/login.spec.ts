import { test, expect } from '@playwright/test'

test.describe('Login', () => {
  test('deve fazer login com credenciais válidas e redirecionar para contratos', async ({ page }) => {
    await page.goto('/login')

    // Verifica título e campos
    await expect(page.locator('h1')).toContainText('ERP Financeiro')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Preenche credenciais (type com delay garante que React capture onChange)
    await page.locator('input[type="email"]').type('admin@bemcomum.org.br', { delay: 50 })
    await page.locator('input[type="password"]').type('123456', { delay: 50 })
    await page.waitForTimeout(300)

    // Clica em Entrar
    await page.click('button[type="submit"]')

    // Aguarda redirecionamento — verifica presença da tabela de contratos
    await expect(page.locator('text=CONTRATADO')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Novo Contrato')).toBeVisible()
  })

  test('deve exibir erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login')

    await page.locator('input[type="email"]').type('invalido@teste.com', { delay: 50 })
    await page.locator('input[type="password"]').type('senhaerrada', { delay: 50 })
    await page.waitForTimeout(300)
    await page.click('button[type="submit"]')

    // Aguarda mensagem de erro
    const errorMessage = page.locator('.text-red-600')
    await expect(errorMessage).toBeVisible({ timeout: 10000 })
    await expect(errorMessage).not.toHaveText('')
  })

  test('deve exibir erro ao tentar login com servidor offline', async ({ page }) => {
    // Intercepta a requisição da server function e simula falha de rede
    await page.route('**/_serverFn/**', async (route) => {
      await route.abort('internetdisconnected')
    })

    await page.goto('/login')

    await page.locator('input[type="email"]').type('admin@bemcomum.org.br', { delay: 50 })
    await page.locator('input[type="password"]').type('123456', { delay: 50 })
    await page.waitForTimeout(300)
    await page.click('button[type="submit"]')

    // Deve aparecer mensagem de erro
    const errorMessage = page.locator('.text-red-600')
    await expect(errorMessage).toBeVisible({ timeout: 10000 })
  })
})
