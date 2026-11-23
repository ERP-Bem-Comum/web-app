# 133 — Colaborador: inativar e reativar, com travas de vínculo

**Tamanho:** M → **L** (ampliada em 23/11) · **Status:** botão implementado (fatia 1); travas especificadas,
dependem do core-api (fatia 2) · **Data:** 2026-11-19, ampliada em 2026-11-23
**Backend:** core-api — a fatia 1 usa as rotas que já existem; a fatia 2 precisa de backend novo (issue
no core-api, ver §Backend).
**PR:** web-app#456 — **segurado** até a fatia 2: um botão que inativa sem as travas contradiz as regras
de 23/11.

## Pedido (P.O.)

- **19/11:** habilitar a função de inativar um registro de colaborador em Parceiros > Colaboradores.
- **23/11:** a inativação preserva o histórico (pagamentos, contratos e demais vínculos) e **impede
  novos vínculos**. O usuário precisa ficar sabendo quando tenta vincular uma pessoa inativa.

## Decisões da P.O. (23/11)

1. **Histórico mantido.** Inativar não apaga nem altera contratos, títulos, documentos ou histórico.
2. **Contrato vigente impede a inativação**, com o motivo em tela. **Vigente = Pendente (criado, sem
   assinatura) ou Ativo.** Aditivo vigente vale pelo contrato a que pertence.
3. **O financeiro não pode pagar colaborador inativo.**
4. **Título em aberto também impede a inativação** (opção "a"). Em aberto = Rascunho, Aberto, Aprovado,
   Transmitido ou Recusado (pelo banco). Assim nenhum título fica preso sem poder ser pago.
5. **Pessoa inativa não recebe vínculo novo:** contrato novo, documento a pagar e lançamento manual na
   conciliação recusam colaborador inativo.

## Situação antes (verificada em 23/11)

| Ponto                                 | Front                                                                                    | core-api                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Inativar                              | sem botão (fatia 1 resolve)                                                              | `deactivate-collaborator.ts` **não consulta** contrato nem título |
| Novo contrato (contratado)            | o seletor **mostra** o inativo como ativo (descarta o `active` do agregador `/partners`) | **aceita**                                                        |
| Lançar documento a pagar (favorecido) | o seletor **esconde** o inativo, sem dizer por quê                                       | **aceita**                                                        |
| Lançamento manual na conciliação      | o seletor **esconde** o inativo, sem dizer por quê                                       | **aceita**                                                        |

## Comportamento

### Fatia 1 — botão (implementada)

1. **Detalhe, modo leitura, com `collaborator:write`:** na **barra de ações do rodapé**, entre
   **Voltar** e **Editar**, o botão **Inativar** (colaborador ativo) ou **Reativar** (inativo). O mesmo
   padrão do Fornecedor.
2. **Inativar** abre um diálogo com **Motivo** obrigatório (os 4 do core-api): Desligamento pela ABC,
   Falecimento, Tempo de contrato finalizado, Solicitação de rescisão contratual. O botão só habilita
   com um motivo escolhido. Em caso de erro, o diálogo fica aberto e mostra a mensagem.
3. **Reativar** pede confirmação simples (o core-api não pede motivo).
4. **Cabeçalho:** inativo mostra "Cadastro … · Inativo · <motivo>". Inativo migrado do legado
   (`LEGACY_MIGRATION`, sem causa real) mostra só "Inativo".
5. Ao concluir, o detalhe atualiza na hora e as listas de colaboradores são invalidadas.

### Fatia 2 — travas (depende do core-api)

6. **Ao abrir o diálogo de Inativar**, o front consulta os impedimentos. Se houver contrato vigente ou
   título em aberto, o diálogo **não oferece o motivo** e mostra:

   > **Não é possível inativar este colaborador.**
   > Resolva os vínculos abaixo antes:
   >
   > - Contrato nº 0042/2026 · Ativo · vigência 01/02/2026 a 31/01/2027
   > - Título nº 123 · Aprovado · vencimento 10/12/2026 · R$ 1.500,00

   Com o botão **Fechar** apenas. Cada item é um link para o contrato ou documento.

7. **Corrida:** se um vínculo nascer entre a consulta e o clique, o core-api recusa a inativação com o
   mesmo motivo, e o diálogo mostra a lista que veio no erro.
8. **Seletores mostram o inativo desabilitado**, em vez de esconder ou de mostrar como ativo:
   - **Novo contrato** (contratado), **Lançar documento a pagar** (favorecido) e **Lançamento manual
     na conciliação**: a pessoa inativa aparece na busca **desabilitada**, com a tag **"Inativo"**, e
     não pode ser escolhida. Quem procura vê na hora por que ela não está disponível.
9. **Recusa no core-api** (proteção contra chamada direta e contra corrida): criar contrato, salvar
   documento a pagar e lançamento manual com colaborador inativo devolvem erro com nome próprio, e a
   tela mostra "Este colaborador está inativo e não pode receber novos vínculos."

## Backend (core-api — issue a abrir)

1. **Impedimentos da inativação:** consulta, **na hora**, os contratos vivos (Pendente/Ativo) pela
   public-api de contracts — **não** pelo read-model `par_contract_count_view`, que depende do worker
   de projeção — e os títulos em aberto em que o colaborador é favorecido (`payeeKind = collaborator`).
   - `GET /collaborators/:id/deactivation-blockers` → `{ contracts: [...], payables: [...] }`, com o
     necessário para a tela (número, status, vigência ou vencimento, valor).
   - `POST /collaborators/:id/deactivate` recusa com **409** e o **mesmo payload** quando houver
     impedimento (tagged error com evidência).
2. **Recusar vínculo novo com colaborador inativo:** criar contrato (contratado), salvar documento a
   pagar (favorecido) e lançamento manual na conciliação. Erro com nome próprio (ex.:
   `collaborator-inactive`).
3. **Pagamento:** com a decisão 4, um inativo não deveria ter título em aberto. Exceção: dado legado
   (inativado antes desta regra ou `LEGACY_MIGRATION`). Para esses, aprovar, gerar remessa e marcar
   como Pago também recusam. Levantar quantos casos existem antes de decidir se precisa de limpeza.

## Fora do escopo

- Inativar direto pela lista (ação em linha ou em lote).
- Filtro "Desativado por" na lista (segue `GatedSelect`).
- Autor da inativação no histórico (core-api#1040).
- As mesmas travas para Fornecedor, Financiador e ACT (o pedido é de Colaborador; avaliar depois).

## Arquivos

**Fatia 1 (feito):**

- `server/adapters/core-api/collaborator.schema.ts` + `core-api-collaborators.ts`: `disableBy` →
  `deactivationReason` (só os 4 motivos; o resto vira ausente).
- `client/collaborator-detail/`: view-model (`statusActionFor`, motivos, subtítulo), binding
  (`statusCommand`), diálogo `collaborator-deactivate-dialog.component.tsx`, página.
- i18n: ações, diálogos e rótulos dos motivos.
- Teste: `tests/modules/partners/client/collaborator-detail/collaborator-detail.view-model.test.ts`.

**Fatia 2 (a fazer, depois do core-api):** server fn dos impedimentos; estado "bloqueado" no diálogo;
seletores de contrato, documento a pagar e lançamento manual com o inativo desabilitado; mapa dos erros
novos.
