/**
 * Usuários de teste E2E (fixtures compartilhadas pela suíte e pelo global-setup).
 *
 * - `valid`: já seedado pelo serviço `core-api-seed` do docker-compose (idempotente, via /register).
 * - `disabled`: registrado e DESABILITADO pelo global-setup (não há seed/endpoint para o estado
 *   disabled — só UPDATE direto no MySQL; ver e2e/global-setup.ts e e2e/README.md).
 *
 * Credenciais espelham os defaults do docker-compose.yml (SEED_EMAIL/SEED_PASSWORD).
 */
export const USERS = {
  valid: {
    email: process.env['E2E_VALID_EMAIL'] ?? 'admin@bemcomum.dev',
    password: process.env['E2E_VALID_PASSWORD'] ?? 'DevPassw0rd!2024',
  },
  disabled: {
    email: process.env['E2E_DISABLED_EMAIL'] ?? 'disabled@e2e.local',
    password: process.env['E2E_DISABLED_PASSWORD'] ?? 'DevPassw0rd!2024',
  },
  /** Não existe no backend — para o caso de anti-enumeração (mesmo erro que senha errada). */
  unknown: {
    email: 'naoexiste@e2e.local',
    password: 'WhateverPass!2024',
  },
} as const
