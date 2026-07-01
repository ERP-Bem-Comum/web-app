# Spec — Autocadastro de Colaborador (#040)

## Contexto

O cadastro de colaborador tem 2 partes:

- **1ª parte (pré-cadastro):** o ADMIN cria via "Novo Colaborador" (`collaborator-create`) — dados básicos.
- **2ª parte (dados pessoais):** informações bem pessoais; o **próprio colaborador** preenche via link
  do e-mail de convite ("Completar meu cadastro" → `autocadastroUrl`).

Esta feature entrega a **tela PÚBLICA** que esse link abre. Rota nova, isolada, ZERO regressão nos
fluxos existentes (detail/my-account intocados).

## Ator

Colaborador convidado, **deslogado** (pode não ter acesso ao sistema). Autentica-se pelo **token** do
link + confirmação dos **primeiros dígitos do CPF** (prova de posse leve).

## Contrato core-api (`/api/v1/collaborators/autocadastro`)

1. **GET** `?token=<token>` → 200 `{ collaboratorId, name, cpfMasked }` (preview). Token
   desconhecido/expirado → **404** (anti-enumeração).
2. **POST** body `{ token, cpfPrefix, ...camposDa2aFase }`:
   - **200** sucesso (token uso-único invalidado).
   - **400** `collaborator-autocadastro-cpf-mismatch` (CPF não confere — token PRESERVADO).
   - **404** token expirado/usado.
   - `cpfPrefix`: primeiros dígitos do CPF (≥3, max 14).
   - `...camposDa2aFase` = `completeRegistrationBodySchema` (mesmos campos do complete-registration).

## User Stories

- **US1 (P1) — Abrir o link e ver quem sou.** Ao abrir `/autocadastro?token=`, vejo "Olá, {name}!" e o
  CPF mascarado. Token ausente/inválido → estado "Convite inválido ou expirou" (sem form).
- **US2 (P1) — Confirmar identidade e preencher.** Informo os primeiros dígitos do meu CPF (≥3) e
  preencho as seções da 2ª fase. O botão "Concluir cadastro" fica desabilitado até o cpfPrefix ser válido.
- **US3 (P1) — Enviar.** Ao concluir: sucesso → "Cadastro concluído com sucesso!" (sem exigir login);
  400 (cpf-mismatch) → "O CPF informado não confere. Verifique e tente novamente." (mantém o form);
  404 → "Este convite é inválido ou expirou."

## Requisitos Funcionais

- **FR-001** Rota pública `/autocadastro` com `validateSearch { token?: string }`; SEM guard de sessão
  (o colaborador pode não ter conta). Entra na allowlist `PUBLIC_ROUTES` do guard-coverage.
- **FR-002** Server fn GET (preview) sob v1 → `{ collaboratorId, name, cpfMasked }` | erro-valor
  `autocadastro-invalid` (404).
- **FR-003** Server fn POST (submit) sob v1: 200 ok | `autocadastro-cpf-mismatch` (400, form preservado)
  | `autocadastro-invalid` (404) | `connectivity`/`server`.
- **FR-004** Seções da 2ª fase: Dados Pessoais, Informações Familiares, Saúde e Acessibilidade,
  Informações Contratuais, Contato de emergência, Biografia — os MESMOS campos do complete-registration.
- **FR-005** Reuso do model (`CollaboratorCompleteInput`, `SEXES`, `MARITAL_STATUSES`, enums) e dos helpers
  PUROS (`parseChildrenAges`/`formatChildrenAges`/build-complete tri-state) SEM tocar em detail/my-account.
- **FR-006** i18n PT sob `partners.autocadastro.*`; nada hardcoded; CSS só-tokens.
- **FR-007** Zod na borda das 2 server fns; token nunca no browser além do search param do link.

## Fora de escopo

- OCR / upload de documentos. Login pós-sucesso. Editar/reenviar convite (é backend/admin).

## Critérios de aceite (mapeiam para os testes)

1. token ausente / GET 404 → estado "inválido", sem form.
2. Botão "Concluir" desabilitado enquanto cpfPrefix < 3 dígitos.
3. Submit 400 (cpf-mismatch) mantém o form + mensagem própria; 404 → "inválido".
4. Sucesso → estado/modal de conclusão, sem login.
5. `parseChildrenAges` extrai idades de texto livre (helper puro).
   </content>
   </invoke>
