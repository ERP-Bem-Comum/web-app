# Quickstart / Validação em tela — 025 Integração Parceiros × Contratos

> Stack local de pé (`../ERP-INFRA/local/up.sh` → `https://app.localhost`), login `admin.full@bemcomum.dev`.
> Pré-condição: ter parceiros de vários tipos com dados (Fornecedor/ACT com banco/PIX/e-mail; Financiador
> com telefone; Colaborador com e-mail).

## US1 — Dados do contratado pré-preenchidos (inclusão + detalhe)
1. Inclusão de contrato → selecionar um **Fornecedor** com banco/PIX/e-mail → banco e PIX aparecem
   preenchidos e **bloqueados** (somente-leitura); e-mail aparece preenchido e **editável**.
2. Selecionar um **ACT** → idem (banco/PIX/e-mail).
3. Selecionar um **Financiador** → telefone pré-preenchido (editável); banco/PIX vazios (gated).
4. Trocar o contratado → campos re-preenchem com o novo parceiro.
5. Editar o e-mail/telefone e salvar → valor salvo é o editado. Abrir o **detalhe** → banco/PIX (leitura)
   e contato aparecem.

## US2 — ACT no grid e detalhe
6. Ter um contrato cujo contratado é um **ACT** → no **grid**, a linha mostra o ACT (nome + estilo do tipo
   ACT), como os demais; no **detalhe**, o contratado ACT é exibido. Os outros tipos seguem corretos.

## US3 — Máscara de telefone
7. Na inclusão (Contato) e no detalhe (edição), digitar telefone → exibe `(xx) xxxxx-xxxx`; salvar mantém
   o telefone correto.

## US4 — Cadastrar novo parceiro e voltar
8. Inclusão de contrato → "cadastrar novo parceiro" → vai ao módulo de parceiros (mesma aba, sem URL
   quebrada). Cadastrar um parceiro → volta para a inclusão de contrato (form em branco; o novo parceiro
   aparece na busca de contratado).

## US5 — Auto-PIX no cadastro de parceiro
9. Novo Fornecedor (ou ACT) → preencher CNPJ e e-mail → escolher tipo de chave PIX = CNPJ → a chave
   preenche com o CNPJ (editável); trocar para e-mail → preenche com o e-mail; trocar para aleatória →
   chave limpa. Editar a chave manualmente funciona.

## Sem regressão
10. Criação/edição/detalhe/grid de contratos e cadastros de parceiros seguem funcionando.

## Gates
- `pnpm typecheck` 0 · `pnpm lint` 0 erros · `pnpm test` + `pnpm test:dom` verdes vs baseline. NÃO commitar
  antes da validação em tela (a usuária commita).
