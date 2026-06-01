/**
 * globalSetup do Playwright — prepara os usuários de teste antes da suíte.
 *
 * O usuário `valid` (admin) já é seedado pelo serviço `core-api-seed` do compose. Aqui garantimos o
 * usuário `disabled`: registramos via core-api e, como NÃO há seed nem endpoint para o estado
 * "disabled" no backend, marcamos direto no MySQL (UPDATE em auth_user). Tudo idempotente.
 *
 * Pré-requisito: `docker compose up -d` (mysql + core-api + web + caddy healthy). Em dev, o
 * core-api é exposto em http://localhost:3001 (docker-compose.override.yml).
 *
 * ⚠️ Acoplado ao MySQL via `docker compose exec` por necessidade: o domínio do core-api modela
 * `status='disabled'` + `disabled_at`, mas não expõe transição (use-case/rota). O UPDATE seta as
 * DUAS colunas juntas — há CHECK bicondicional `auth_user_disabled_consistency_chk` (setar só uma
 * viola a constraint, erro InnoDB 3819).
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { USERS } from './fixtures/users.ts'

const execFileAsync = promisify(execFile)

const CORE_API_URL = process.env['E2E_CORE_API_URL'] ?? 'http://localhost:3001/api/v2'
const MYSQL_ROOT_PASSWORD = process.env['MYSQL_ROOT_PASSWORD'] ?? 'rootdev'
const MYSQL_SERVICE = process.env['E2E_MYSQL_SERVICE'] ?? 'mysql'
const MYSQL_DATABASE = process.env['E2E_MYSQL_DATABASE'] ?? 'core'

/** Registra um usuário no core-api. 201 (criado) e 409 (já existe) são sucesso (idempotente). */
async function registerUser(email: string, password: string): Promise<void> {
  let res: Response
  try {
    res = await fetch(`${CORE_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch (cause) {
    throw new Error(
      `[e2e:setup] não consegui falar com o core-api em ${CORE_API_URL}. A stack está de pé? ` +
        `Rode "docker compose up -d" e aguarde os healthchecks.`,
      { cause },
    )
  }
  if (res.status !== 201 && res.status !== 409) {
    const body = await res.text()
    throw new Error(`[e2e:setup] register de ${email} falhou: HTTP ${String(res.status)} — ${body}`)
  }
}

/** Marca um usuário como disabled direto no MySQL (status + disabled_at juntos). Idempotente. */
async function disableUser(email: string): Promise<void> {
  const sql =
    `UPDATE auth_user SET status='disabled', disabled_at=NOW(3), updated_at=NOW(3) ` +
    `WHERE email=${escapeSqlString(email)};`
  try {
    await execFileAsync('docker', [
      'compose',
      'exec',
      '-T',
      MYSQL_SERVICE,
      'mysql',
      '-uroot',
      `-p${MYSQL_ROOT_PASSWORD}`,
      MYSQL_DATABASE,
      '-e',
      sql,
    ])
  } catch (cause) {
    throw new Error(
      `[e2e:setup] não consegui desabilitar ${email} via "docker compose exec ${MYSQL_SERVICE}". ` +
        `A stack está de pé e o Docker acessível? Rode "docker compose up -d".`,
      { cause },
    )
  }
}

/** Aspas simples para literal SQL (defensivo — emails de teste são controlados). */
function escapeSqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

export default async function globalSetup(): Promise<void> {
  await registerUser(USERS.disabled.email, USERS.disabled.password)
  await disableUser(USERS.disabled.email)
  // eslint-disable-next-line no-console
  console.log(`[e2e:setup] usuário disabled pronto: ${USERS.disabled.email}`)
}
