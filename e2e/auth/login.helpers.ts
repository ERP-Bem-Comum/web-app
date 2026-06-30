/**
 * Helpers da suíte de login — localizadores acessíveis + navegação/ação reutilizáveis.
 *
 * Localizadores espelham a UI burra (LoginForm): labels i18n ("E-mail"/"Senha"), único checkbox
 * da tela ("Lembrar este dispositivo"), botão "Entrar", e a mensagem de erro em `role="alert"`.
 * NÃO é um arquivo de teste (não casa o glob `*.e2e.ts`), então não é coletado pelo runner.
 */
import { expect, type Page } from '@playwright/test'

export const loginLocators = (page: Page) => ({
  email: page.getByLabel('E-mail'),
  password: page.getByLabel('Senha'),
  remember: page.getByRole('checkbox'),
  submit: page.getByRole('button', { name: 'Entrar' }),
  error: page.getByRole('alert'),
})

/**
 * Navega para a /login e ESPERA a hidratação do client antes de devolver o controle.
 *
 * Crítico: em SSR a tela existe como HTML antes do React hidratar. Se interagirmos cedo demais, o
 * `<form>` faz submit NATIVO (o `e.preventDefault()` do handler React ainda não está ligado) e a
 * página recarrega `/login?` sem autenticar. `networkidle` cobre o carregamento assíncrono do entry
 * do client (em dev, módulos Vite). É a espera idiomática para apps SSR hidratados.
 */
export async function gotoLogin(page: Page, redirect?: string): Promise<void> {
  const path = redirect === undefined ? '/login' : `/login?redirect=${encodeURIComponent(redirect)}`
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

export type LoginParams = Readonly<{
  email: string
  password: string
  remember?: boolean
  /** Anexado como `?redirect=` ao navegar para /login. */
  redirect?: string
}>

/** Vai para /login (hidratado), preenche o form e submete. Não espera o resultado. */
export async function fillAndSubmitLogin(page: Page, params: LoginParams): Promise<void> {
  await gotoLogin(page, params.redirect)

  const l = loginLocators(page)
  await l.email.fill(params.email)
  await l.password.fill(params.password)
  if (params.remember === true) await l.remember.check()
  await l.submit.click()
}

/** Login completo que aguarda a saída da /login (sucesso). */
export async function login(page: Page, params: LoginParams): Promise<void> {
  await fillAndSubmitLogin(page, params)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}

/**
 * Prova que o submit foi BLOQUEADO no client (Zod no controller): nenhuma request de login sai,
 * sem navegação, sem alerta nem loading. O listener de request é registrado APÓS o goto/preenchimento
 * para não contar o POST do `getCurrentUserFn` (beforeLoad) que dispara ao abrir a /login.
 */
export async function expectSubmitBlocked(
  page: Page,
  fields: Readonly<{ email: string; password: string }>,
): Promise<void> {
  await gotoLogin(page)
  const l = loginLocators(page)
  await l.email.fill(fields.email)
  await l.password.fill(fields.password)

  const posts: string[] = []
  page.on('request', (r) => {
    if (r.method() === 'POST') posts.push(r.url())
  })

  await l.submit.click()
  await page.waitForTimeout(600) // janela: um submit real dispararia o POST RPC aqui

  expect(posts, 'submit inválido não pode disparar request de login').toHaveLength(0)
  expect(page.url()).toContain('/login')
  await expect(l.error).toBeHidden()
  await expect(l.submit).toBeEnabled()
}
