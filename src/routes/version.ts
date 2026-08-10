/**
 * Revisão em execução (`/version`) — server route SEM component (server-only, no molde do `/ready`).
 * Responde SEMPRE 200 com `{ revision }`: não é probe de saúde, é identidade da build. Quem consome é o
 * check agendado do ERP-INFRA, que compara esta revisão com o HEAD da `develop` e acusa divergência.
 *
 * Por que existe (incidente 2026-08-10): a tag `:qa` é flutuante e o `deploy.sh` da VPS é chamado também
 * pelo pipeline do core-api, então o front chegava em QA por caminhos que nenhum gate observava — e não
 * havia como saber, de fora, QUAL build estava no ar. Só o próprio processo sabe. Isso cobre os três
 * casos que notificação de build não cobre: deploy manual, deploy de carona e deploy que não aconteceu.
 *
 * `APP_REVISION` é lida direto do `process.env`, FORA do EnvSchema — mesmo motivo de `LOG_LEVEL`/
 * `NODE_ENV` (env.config.ts): é diagnóstico de camada baixa, precisa responder mesmo se a config quebrar.
 * Vem do `ARG GIT_SHA` do web.Dockerfile (default `dev` fora do CI). `cache-control: no-store` — uma
 * revisão cacheada é pior que revisão nenhuma.
 */
import { createFileRoute } from '@tanstack/react-router'

const UNKNOWN_REVISION = 'unknown'

export const Route = createFileRoute('/version')({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ revision: process.env.APP_REVISION ?? UNKNOWN_REVISION }), {
          status: 200,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        }),
    },
  },
})
