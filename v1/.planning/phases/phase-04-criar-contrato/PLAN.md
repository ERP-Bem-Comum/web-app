# Phase 4 — Criar Contrato (US3)

**Goal**: Formulário de criação de contrato com validações, auto-save e regras de negócio.

**Independent Test**: Acessar `/contratos/adicionar`, preencher formulário e submeter. Ver contrato criado na listagem.

---

## Onda 1: Schema + Server + Mock API

- [ ] Atualizar `ContractCreateInputSchema` com discriminated union por `contractType`
- [ ] Regra: teto OS (`totalValue <= 9999.99` quando classification = OS)
- [ ] Regra: PIX ou bancário obrigatório para SUPPLIER/COLLABORATOR/ACT
- [ ] Ajustar `createContract` server function para enviar novos campos
- [ ] Atualizar mock API (`mock-api.ts`) para aceitar e validar novo payload

## Onda 2: ContractForm Redesign

- [ ] Migrar para React Hook Form + Zod resolver
- [ ] Auto-save em sessionStorage a cada 30s
- [ ] Restaurar rascunho ao montar o componente
- [ ] Layout institucional com field rows e labels no padrão brand
- [ ] Campos: classificação, modelo, objeto, valor, período, tipo, contratante, programa, plano
- [ ] Validação em tempo real com mensagens de erro

## Onda 3: Sidebar + Checklist

- [ ] Sidebar com preview de valor formatado (R$)
- [ ] Sidebar com preview de vigência (início → fim)
- [ ] Checklist de 6 pendências: contratado, contrato, valor, vigência, programa, documento
- [ ] Barra de progresso "Concluído X / 6"
- [ ] Botão "Salvar contrato" desabilitado até checklist completo

## Onda 4: Contratado + Bancário + Upload

- [ ] Seleção de contratado com busca por nome/CNPJ/CPF
- [ ] Hero card do contratado selecionado (nome, fantasia, documento)
- [ ] Dados bancários: banco, agência, conta, DV
- [ ] PIX: tipo de chave, chave
- [ ] Upload de documento principal (PDF)
- [ ] Botão "Salvar como rascunho" (cria com status Rascunho)

## Onda 5: Testes + Polish

- [ ] Teste domain: validação teto OS
- [ ] Teste adapter: createContract happy path + erro 400
- [ ] Build passa, typecheck limpo
- [ ] E2E: fluxo de criação funcional

---

## Decisões

- Formulário usa RHF + Zod para validação declarativa
- Auto-save usa `sessionStorage` com chave `contract-draft-{userId}`
- Design segue padrão do handbook `handbook/contratos/novo_contrato/`
- Sidebar fixa à direita no desktop, colapsada em mobile
