# Dossiê de Encerramento — Projeto de Modernização do ERP

> **Natureza do projeto:** Modernização / Reengenharia de Software (não é ERP novo, tampouco manutenção corretiva).
> **Fonte única de conteúdo técnico** para elaboração dos documentos formais do Kit de Encerramento
> (Documento Mestre, Escopo, Manuais, Regras de Negócio, Pendências, Riscos, Ata, Termo de Aceite, Garantia).
> **Versão:** 1.0 · **Data-base:** julho/2026 · **Elaboração:** Consultoria (PO/QA) + levantamento técnico.
> _Títulos alternativos para a capa: "Dossiê de Encerramento da Reestruturação do ERP Corporativo" · "Entrega Oficial da Modernização do ERP"._
> Campos entre `[PREENCHER]` dependem de dados que só o time/consultoria tem (datas, assinaturas, contagens de teste).

---

## Sumário

- **Parte I — Projeto de Modernização:** 1. Objetivo · 2. Contexto e Justificativa Técnica · 3. Comparativo Antes × Depois · 4. Escopo da Modernização (Resultado) · 5. Não Contemplados / Escopo Futuro
- **Parte II — Técnico:** 6. Arquitetura · 7. Estrutura & Fluxos · 8. Livro de Regras de Negócio · 9. Migração de Dados (ETL)
- **Parte III — Governança:** 10. Decisões · 11. Pendências & Roadmap · 12. Riscos · 13. Inventário/Responsabilidades/Testes · 14. Glossário

---

# PARTE I — O PROJETO DE MODERNIZAÇÃO

## 1. Objetivo do Projeto

O presente projeto teve como objetivo **modernizar a plataforma do ERP existente**, preservando as funcionalidades consolidadas dos módulos legados e promovendo a **reconstrução tecnológica** da solução. Durante a execução, verificou-se que limitações arquiteturais do sistema original **inviabilizavam a evolução incremental** inicialmente prevista. Em razão disso, optou-se tecnicamente pela **reconstrução da aplicação**, mantendo a **compatibilidade funcional** com os módulos existentes e promovendo a **reformulação completa** dos módulos de **Gestão de Contratos, Contas a Pagar e Conciliação Bancária**.

> **Enquadramento:** o sistema foi **preservado do ponto de vista funcional**, porém sua **arquitetura, código e componentes foram reconstruídos**, e determinados módulos passaram também por **evolução funcional**. Não se trata de um ERP inteiramente novo, nem de manutenção corretiva — é um **Projeto de Modernização (Software Reengineering)**.

## 2. Contexto e Justificativa Técnica da Reconstrução

O escopo inicialmente contratado previa a **reforma de dois módulos** (Gestão de Contratos e Financeiro). Ao longo da execução, a equipe identificou **limitações estruturais na base existente** que tornavam essa estratégia inviável, levando à reconstrução da aplicação para garantir consistência, qualidade e evolutividade.

> **Registro técnico (redação recomendada para o Documento Mestre):**
> _"Durante a execução do projeto, foram identificadas limitações arquiteturais na solução existente que comprometiam a manutenção da estratégia inicial de evolução incremental. Para assegurar a qualidade, a estabilidade e a sustentabilidade da solução, optou-se pela reconstrução da aplicação, preservando as regras de negócio e a experiência operacional dos módulos legados."_

Essa redação comunica uma **decisão de engenharia fundamentada**, e não uma mudança de plano.

### Situação Inicial × Situação Final

| Situação Inicial                                   | Situação Final                                                                                                                                            |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sistema legado (partes com inconsistência fiscal)  | Plataforma reconstruída                                                                                                                                   |
| Arquitetura antiga (evolução incremental inviável) | Nova arquitetura modular e evolutiva                                                                                                                      |
| Interfaces legadas                                 | Interfaces modernizadas                                                                                                                                   |
| Código legado / acoplado                           | Código reconstruído (tipado, testável)                                                                                                                    |
| 2 módulos a reformar                               | 3 módulos modernizados **com evolução funcional** (Contratos, Contas a Pagar, Conciliação) + demais módulos **reconstruídos preservando funcionalidades** |

## 3. Comparativo Antes × Depois (executivo)

| Item                         | Antes (legado)     | Depois (modernizado)                                                         |
| ---------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| **Arquitetura**              | Monolítica legada  | Monólito modular + BFF (fatias verticais isoladas)                           |
| **Interface**                | Legada             | Modernizada (React 19 + design system tokens)                                |
| **Componentes**              | Legados/acoplados  | Reutilizáveis (Atomic Design, zero-runtime)                                  |
| **Código**                   | Legado             | Reconstruído (TypeScript estrito, erros como valores)                        |
| **Segurança**                | Limitada           | JWT ES256, RBAC, CSP estrita, cookie de sessão seguro                        |
| **Performance/Estabilidade** | —                  | ✔ Melhorada (arquitetura assíncrona, projeções, otimistic-lock)              |
| **OCR / Ingestão**           | Não existia        | ✔ Novo (upload + leitura fiscal XML/PDF)                                     |
| **Motor Fiscal**             | Limitado           | Novo (retenções automáticas ISS/IRRF/INSS/CSRF + Reforma Tributária CBS/IBS) |
| **Conciliação Bancária**     | Antiga/manual      | Reformulada (motor de match, períodos, transferências, export Nibo)          |
| **Auditoria**                | Inexistente/frágil | Trilha por-campo (Time Travel)                                               |
| **Deploy / Infra**           | Legado             | AWS ECS Multi-AZ, CI/CD, secrets gerenciados                                 |
| **Migração de dados**        | —                  | ETL com quarentena e reconciliação auditável                                 |

> Este comparativo "vende o projeto sozinho" — recomendado como **anexo executivo** do Documento Mestre.

## 4. Escopo da Modernização (Resultado do Projeto)

### 4.1 Módulos reconstruídos **preservando funcionalidades** (mesmas regras, nova implementação)

| Módulo                                                                 | Objetivo                               | Observação                                                                                                         |
| ---------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Autenticação & Segurança**                                           | Reconstrução preservando + endurecendo | JWT ES256, RBAC, reset por e-mail, sessão opaca                                                                    |
| **Parceiros** (Fornecedores, Financiadores, Atores/ACT, Colaboradores) | Reconstrução preservando               | Cadastro de colaborador em 2 etapas, histórico, export legado                                                      |
| **Programas**                                                          | Reconstrução preservando               | Catálogo (ETI/PARC/EPV), sigla, logo                                                                               |
| **Notificações / E-mail**                                              | Reconstrução preservando + endurecendo | Outbox transacional + worker dedicado                                                                              |
| **Plano Orçamentário**                                                 | Reconstrução preservando               | CRUD, estrutura de custos, 4 modelos de cálculo, cenário/calibração, Consolidado ABC — _em ativação nesta entrega_ |
| **Dashboard**                                                          | Reconstrução preservando               | Indicadores/últimos pagamentos — _em ativação (front-first)_                                                       |
| **Relatórios (9)**                                                     | Reconstrução preservando               | Front 100% pronto; plugam endpoints reais — _em ativação_                                                          |

### 4.2 Módulos reconstruídos **e evoluídos** (reformulação com evolução funcional)

**Gestão de Contratos** — reconstruído e reformulado:

- Novo modelo de **vigência** (período fixo/indefinido; original × vigente)
- Novo **histórico de aditivos** (Acréscimo/Supressão/Prazo/Diversos + homologação)
- Nova **numeração** sequencial · Novo **controle de saldo** (valor original × vigente por aditivo)
- **Auto-expiração** automática (job D+1) · **Upload de documentos** com exclusão lógica auditada
- **Timeline** de ciclo de vida · Categorização exposta para herança pelo Financeiro
- Novo layout, melhorias de usabilidade e de desempenho

**Financeiro — Contas a Pagar** — totalmente reestruturado:

- **OCR / Ingestão** de nota fiscal (novo — não existia)
- **Novo motor fiscal** + **novo modelo de retenções** (títulos-filho automáticos ISS/IRRF/INSS/CSRF; Reforma Tributária)
- **Grid orientado a título** (pai + filhos pagáveis) · **Aprovação** com alçada/cascata · **Baixa manual** por título
- **Auditoria por-campo (Time Travel)** · Vencimento em lote · Filtros/busca/exportação
- Novos workflows de lançamento, aprovação e liquidação

**Conciliação Bancária** — reconstruída:

- Novo **motor de sugestões (match)** · Conciliação 1:1 e N:1 · **desfazer**
- **Lançamento manual** · **Transferência/Aplicação/Resgate** entre contas (contrapartida)
- **Conciliação parcial + tratamento de diferença** (multa/juros/desconto/tarifa)
- **Períodos** (fechar/reabrir) · **Importação** (OFX/CSV) · **Exportação** (OFX/CSV/**Nibo**)
- Auditoria do vínculo extrato↔título

### 4.3 Componentes Transversais reconstruídos (não pertencem a um módulo)

Reconstruídos como base compartilhada de toda a plataforma:

- **Autenticação e sessão** (JWT ES256, cookie `__Host-session` opaco, refresh com rotação)
- **RBAC / permissões** (catálogo único, default-deny)
- **Design system** e **componentes React** reutilizáveis (Atomic Design, tokens, zero-runtime)
- **Layout, menu, navegação** (shell autenticado, roteamento tipado)
- **APIs / BFF** (server functions como única fronteira; contratos Zod/OpenAPI)
- **Arquitetura** (monólito modular DDD hexagonal; erros como valores; outbox transacional)
- **Banco de dados** (schema por módulo isolado; projeções materializadas)
- **Serviços / workers** (projeções, e-mail, jobs one-shot)
- **Migração de dados (ETL)** e **infraestrutura/deploy** (AWS ECS, CI/CD)

> **Este item costuma ser esquecido na documentação** — e representa parte substancial do esforço de reengenharia.

## 5. Itens NÃO Contemplados / Escopo Futuro

> Seção crítica (proteção jurídica). Insumo para "Funcionalidades Não Entregues" + "Registro Formal de Pendências".

### 5.1 Contas a Receber (decisão acordada em reunião)

O **módulo de Contas a Receber do legado NÃO foi replicado** nesta modernização. Motivo: era um dos módulos com **problemas fiscais** no legado. Decisão acordada com o cliente **em reunião**: será **refeito, reestruturado e reimplantado como módulo totalmente novo**, com **esforço medido e orçado pós-entrega**. Consequência: relatórios/telas do lado **recebíveis** (Posição Recebíveis, Análise de Recebimentos, lado "entradas" do Fluxo de Caixa) ficam **aguardando** esse módulo novo.

### 5.2 Pós-entrega já previsto (inicia após esta entrega)

- **Van bancária / CNAB** — transmissão bancária (remessa/retorno).
- **Carga dos contratos legados** — inserção via **script**.
- **Módulo novo de Contas a Receber** (§5.1).

### 5.3 Fora do escopo (não contratado)

- Conciliação **PIX** / **Open Finance** · Integração direta com **banco (API online)** · **API Receita Federal**
- **Painel de BI** avançado / relatórios gerenciais além dos 9 · **Multi-tenant**
- **Compartilhamento externo** do Plano Orçamentário por credencial (adiado) · **Bounce handling** de e-mail

### 5.4 Melhorias identificadas (backlog pós-modernização — orçado à parte)

- Aprovação de pagamentos por **e-mail** (magic-link) + colunas aprovador/data
- **Reclassificação** de categoria/centro na conciliação (editar o próprio título)
- **Reenvio** de convite de colaborador + data de envio

---

# PARTE II — TÉCNICO

## 6. Arquitetura Técnica

### 6.1 Visão geral

- **`web-app` (Front + BFF unificado)** — TanStack Start (Vite+Nitro) · React 19 · TypeScript estrito · vanilla-extract · Zod 4 · TanStack Query/Router. A **server function é a única fronteira** client↔server; **o browser nunca fala com o backend**; **o token nunca vai ao browser**.
- **`core-api` (Backend)** — Node 24 + Fastify · **Monólito Modular** (DDD hexagonal) · MySQL 8.4 · contract-first (Zod/OpenAPI). Erros como valores (`Result`); outbox transacional.

### 6.2 Camadas por módulo

- **Backend:** `domain/` (puro, VOs branded, agregados) → `application/` (casos de uso, ports) → `adapters/` (HTTP, persistência Drizzle/MySQL, storage, e-mail) → `public-api/` (única fronteira de import externo) [+ `worker/`].
- **Frontend:** `server/` (BFF·DDD, token vive aqui) × `client/` (MVVM: view burra + viewModel agnóstico + binding + repository) + `public-api/`. Governança por `eslint-plugin-boundaries`.

### 6.3 Banco, Segurança, Ambientes

- **Banco:** um `core` por módulo isolado por GRANT (auth*/par*/ctr*/fin*/budget\_); só o core-api escreve; sem join cross-DB em runtime (projeções via outbox); optimistic-lock + CHECKs + UNIQUE por chave natural.
- **Segurança:** JWT ES256 + refresh opaco + cookie `__Host-session`; RBAC default-deny; CSP estrita + nonce + security headers; anti-enumeração/anti-brute-force/rate-limit; uploads com magic-bytes; XML anti-XXE; segredos em AWS Secrets Manager.
- **Ambientes/Deploy:** **Produção = AWS ECS (Fargate)** — ALB (TLS/WAF) → API (≥2 tasks) + 5 workers · **RDS MySQL 8.4 Multi-AZ** · **Amazon SES** · **ECR** · **CloudWatch** · pipeline CodePipeline→CodeBuild→CodeDeploy. QA = Magalu VPS (Compose+Caddy). Dev = "clone & run" (Compose local). Imagem multi-stage non-root; migrations fora do boot (job one-shot); jobs one-shot via cron externo. Env crítica: `CORE_API_URL` do BFF **deve conter `/api`**; `<MOD>_DRIVER=mysql`+`DATABASE_URL` por módulo.

## 7. Estrutura & Fluxos principais

**Contas a Pagar:** Lançar Documento → herda categorização do contrato → calcula líquido → **gera pai (líquido) + 1 filho por retenção** → grava (agregado+trilha+evento na mesma transação). Aprovar (`Aberto→Aprovado`). Baixa manual (`Aprovado→Pago`, por título). Vencimento individual/lote.
**Conciliação:** Importar extrato (OFX/CSV, dedup FITID) → motor sugere → **conciliar (1:1/N:1) ou rejeitar**; sem título → lançamento manual; entre contas → transferência/aplicação/resgate; **fechar período** → **exportar Nibo**; reabrir.
**Colaborador (2 etapas):** pré-cadastro → **convite por e-mail (token)** → **autocadastro** → Complete.
**Orçamento:** plano (ano+programa) → estrutura de custos → orçamento por rede → 4 modelos de cálculo → cenário/calibração → aprovar → insights/consolidado.
**Login:** credenciais → JWT ES256 + refresh → BFF cunha cookie opaco → refresh silencioso.

## 8. Livro de Regras de Negócio (consolidado)

| #     | Regra                  | Detalhe                                                                                                        |
| ----- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| RN-01 | Valor líquido          | Bruto − Desc. na Fonte − Σ Retenções − Descontos + Multa + Juros; rejeita ≤0. Impostos registrados não abatem. |
| RN-02 | Retenções permitidas   | Só NFS-e e RPA (ISS/IRRF/INSS/CSRF); demais tipos, nenhuma.                                                    |
| RN-03 | Geração de títulos     | 1 pai (líquido) + 1 filho por retenção; ajuste regenera filhos.                                                |
| RN-04 | Chave DANFE            | Obrigatória e validada (44 díg.) quando tipo = DANFE.                                                          |
| RN-05 | Aprovação              | `Aberto→Aprovado`; operador≠aprovador (RBAC); alçada opt-in (nulo=aprova); cascata.                            |
| RN-06 | Baixa                  | Só título Aprovado→Pago; por título; data não futura.                                                          |
| RN-07 | Estados                | Draft→Open→Approved→(Paid por título)→Reconciled/PartiallyReconciled; Transmitted/Refused reservados.          |
| RN-08 | Conciliação            | Nunca automática; só título Pago; fechamento 100%.                                                             |
| RN-09 | Diferença              | Multa/Juros/Tarifa · Desconto · Parcial (saldo aberto).                                                        |
| RN-10 | Realocação patrimonial | Transferência/Aplicação/Resgate sem fornecedor; contrapartida na conta destino.                                |
| RN-11 | Período                | Fecha só sem pendências; guarda contra período fechado; reabertura auditada.                                   |
| RN-12 | Contrato               | Valor/prazo mudam só por aditivo homologado; auto-expiração D+1; documento herda programa/plano.               |
| RN-13 | Orçamento              | 4 modelos server-side; edição só Rascunho/Em Calibração; aprovação binária.                                    |
| RN-14 | Colaborador            | Cadastro 2 etapas; convite single-use 7 dias; re-completar = 409.                                              |
| RN-15 | Auditoria              | Trilha derivada do estado; autor na aprovação e baixa.                                                         |

## 9. Migração de Dados (ETL legado → core)

- **3 estágios** em ordem dura (Parceiros → Contratos → Financeiro), encadeados por arquivos **de-para** em disco.
- Leitura do legado direta (SELECT-only); **escrita 100% via domínio** (sem SQL de escrita em tabela de negócio).
- **Idempotência por `legacy_id`**; reconciliação `lido = migrado + quarentenado + já existia`.
- **Quarentena:** linha inválida nunca aborta o lote (resumo PII-free + detalhe isolado). Exclusões por allowlist.
- **Migrado:** parceiros, usuários, programas, contratos, contas cedentes, títulos, aprovações. **Não migrado (deliberado):** senha legada, histórico de colaborador (arquivado), **Contas a Receber** (§5).

---

# PARTE III — GOVERNANÇA

## 10. Registro de Decisões Técnicas & Funcionais

| ID   | Decisão                                                          | Justificativa                                                                             |
| ---- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| D-01 | Reconstruir a aplicação (modernização, não evolução incremental) | Limitações arquiteturais inviabilizavam evoluir a base legada com qualidade/estabilidade. |
| D-02 | Contas a Receber não replicado; refeito novo pós-entrega         | Problemas fiscais no legado; acordado em reunião.                                         |
| D-03 | Produção em AWS ECS (Multi-AZ, ≥2 tasks)                         | Disponibilidade/escala/segurança.                                                         |
| D-04 | Aprovação binária (alçada opt-in)                                | Regra da organização (sem alçada monetária).                                              |
| D-05 | Categorização nova via ACL (não portar cost-centers legado)      | Modelo novo soberano; evita corromper o modelo.                                           |
| D-06 | Conciliação dirigida pelo período e nunca automática             | Controle contábil; usuário confirma o match.                                              |
| D-07 | Read-model próprio (projeção via outbox) p/ Dashboard/Reports    | Isolamento entre módulos.                                                                 |
| D-08 | CSV/PDF client-side                                              | Simplicidade; menos dependências no backend.                                              |
| D-09 | E-mail via outbox transacional + worker dedicado                 | Atomicidade (e-mail sse a operação commitou).                                             |

## 11. Pendências Conhecidas & Roadmap pós-modernização

| ID   | Item                                                                 | Tipo                  | Responsável           | Previsão       |
| ---- | -------------------------------------------------------------------- | --------------------- | --------------------- | -------------- |
| P-01 | Ativação final do Plano Orçamentário                                 | Ativação              | Desenvolvedor         | Nesta entrega  |
| P-02 | Dashboard — KPIs/distribuição (endpoint de estatísticas)             | Ativação              | Desenvolvedor         | Curto prazo    |
| P-03 | Relatórios — plugar endpoints reais                                  | Ativação              | Desenvolvedor         | Curto prazo    |
| P-04 | Van bancária / CNAB                                                  | Escopo futuro         | Desenvolvedor         | Pós-entrega    |
| P-05 | Carga dos contratos legados via script                               | Escopo futuro         | Desenvolvedor/Cliente | Pós-entrega    |
| P-06 | **Contas a Receber (módulo novo)**                                   | Escopo futuro (orçar) | Desenvolvedor         | Pós-entrega    |
| P-07 | Motor de palpites da conciliação (sensibilidade em dado real)        | Melhoria              | Desenvolvedor         | Manutenção     |
| P-08 | Enriquecimento da conciliação (nome fornecedor/nº doc)               | Melhoria              | Desenvolvedor         | Manutenção     |
| P-09 | Vencimento de retenção independente (hoje propaga pai→filho)         | Ajuste backend        | Desenvolvedor         | Manutenção     |
| P-10 | 3 melhorias pós-go-live (aprovação e-mail, reclassificação, reenvio) | Evolução              | Desenvolvedor         | Orçado à parte |
| P-11 | Identidade de marca nos e-mails transacionais                        | Evolução              | Desenvolvedor         | Manutenção     |

## 12. Riscos Conhecidos

- **Van bancária** depende da VAN/credenciais (dependência externa/cliente).
- **OCR** depende da **qualidade do PDF** (escaneado sem texto → preenchimento manual).
- **Migração/ETL** depende da qualidade do dado legado (quarentena exige correção manual).
- **Read-models** dependem do **worker de projeção** rodar em produção.
- **Configuração de ambiente:** `DRIVER=mysql`+`DATABASE_URL` por módulo; `CORE_API_URL` com `/api`.
- **Contas a Receber** ausente afeta relatórios do lado recebíveis até o módulo novo.

## 13. Inventário, Responsabilidades e Testes

### 13.1 Inventário de Artefatos

Código-fonte (`core-api` + `web-app` + `ERP-INFRA`) · schema por módulo + migrations · scripts (ETL 3 estágios, seed admin, jobs one-shot) · documentação (ADRs, runbooks, catálogo de env, contratos OpenAPI, este dossiê) · layouts/integrações (OFX/CSV/**Nibo 15 colunas**, leitura XML NFS-e/NF-e) · **136 issues fechadas** (evidência do entregue).

### 13.2 Matriz de Responsabilidades (proposta)

| Item                                              | Cliente    | Fornecedor |
| ------------------------------------------------- | ---------- | ---------- |
| Infraestrutura AWS / contas de nuvem              | X          | (apoia)    |
| Código-fonte / arquitetura                        |            | X          |
| Banco (modelagem/migrations)                      |            | X          |
| Backup / restore (rotina)                         | X          | (define)   |
| Firewall / DNS / SSL                              | X          | (apoia)    |
| Credenciais bancárias / VAN                       | X          |            |
| Qualidade do dado legado (correção de quarentena) | X          | (aponta)   |
| Correção de defeitos na garantia                  |            | X          |
| Novas funcionalidades / escopo futuro             | (contrata) | X          |

### 13.3 Relatório de Testes / Homologação

**Gate de regressão-zero:** `pnpm verify` = **typecheck + lint + testes**, obrigatório antes de qualquer merge (nenhum PR fecha com o gate vermelho).

**Inventário de testes automatizados (contagem de artefatos no código-fonte):**

| Camada                   |       Arquivos de teste | Casos (`test()`/`it()`) | Suítes (`describe()`) |
| ------------------------ | ----------------------: | ----------------------: | --------------------: |
| Backend (core-api)       |                     635 |                   3.832 |                 1.176 |
| Frontend / BFF (web-app) | 255 (162 unit + 93 DOM) |                  ~1.819 |                     — |
| **Total**                |                **~890** |              **~5.650** |                     — |

**Distribuição no backend por área (arquivos):** módulos de negócio 563 · shared 20 · ETL 17 · jobs 10 · workers 6 · pipeline 6 · infra 6 · scripts 4 · cleanup 2 · regressão 1.

**Tipos de teste executados no escopo:**

1. **Unitário (backend)** — `node --test` sobre `tests/**/*.test.ts`: domínio, use-cases, VOs branded, erros-como-valor.
2. **Unitário puro (front/BFF)** — `node:test`, lógica agnóstica de framework (ViewModels, mappers, schemas Zod). 162 arquivos.
3. **DOM (front)** — Vitest + jsdom (`pnpm test:dom`): componentes/views, bindings, controllers de formulário. 93 arquivos, globs disjuntos do runner puro (ADR-0011).
4. **Integração com MySQL real (backend)** — `test:integration:*` por módulo (`auth`, `partners`, `programs`, `budget-plans`, `financial`, `notifications`, `storage`, `infra`, `photo`, `logo`) + **4 suítes de ETL** (`etl`, `etl:orchestrate`, `etl:contracts`, `etl:financial`) cobrindo a migração legado→core. 25 arquivos.
5. **E2E / smoke de API (backend)** — `test:e2e:{auth,contracts,collaborators}` (Bruno) + `test:integration:all`.
6. **Regressão visual (front)** — Playwright com baseline `-linux` (`pnpm test:e2e`): login (happy/sad) + shell/organisms por screenshot. 5 specs.

**QA funcional / validação em tela (manual, não automatizado):** cada entrega foi validada funcionalmente contra o core-api real e registrada nos PRs (ex.: encerrar/editar conta-cedente validado contra core-api #402/#404; match por `paidAt` no #272; empty-state real do Planejamento; ingestão OCR + web-view). Equivale ao teste de aceitação do P.O.

> **Nota de fidelidade:** os números acima são a **contagem de artefatos de teste existentes no código**, não um relatório de execução datado. Para "X casos executados / Y aprovados / cobertura Z%" com data e evidências (prints/vídeos/logs/assinaturas), rodar `pnpm verify` + `pnpm test:dom` (front) e `pnpm test` + integração (backend) e anexar a saída. **[PREENCHER]:** cobertura %, evidências, aprovações formais.

**Fluxos críticos sugeridos para homologação:** lançar→aprovar→baixar; importar extrato→conciliar; cadastro de colaborador com convite; criar plano orçamentário.

## 14. Glossário

- **Fato Gerador / Documento:** documento fiscal lançado (agregado raiz do financeiro).
- **Título (Payable):** obrigação de pagamento; Pai = líquido, Filho = retenção.
- **Retenção:** imposto na fonte (ISS/IRRF/INSS/CSRF) → gera título-filho.
- **Conta cedente:** conta bancária da organização usada na conciliação.
- **Conciliação:** vínculo entre transação do extrato e título Pago; parcial = saldo aberto.
- **ACT:** Acordo de Cooperação Técnica (sub-tipo de parceiro).
- **ABC:** nome da organização (não é a curva ABC).
- **Rede:** recorte do orçamento por estado ou município.
- **Outbox:** garante que eventos/e-mails só saem se a transação commitou.
- **BFF:** Backend-for-Frontend (única fronteira do web-app com o backend).
- **Modernização / Reengenharia:** reconstrução tecnológica preservando funcionalidade; evolução funcional em módulos específicos.

---

_Fim do Dossiê de Encerramento — Projeto de Modernização do ERP. Mapeamentos técnicos exaustivos por módulo disponíveis como anexos para o Manual Técnico._
