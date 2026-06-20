# Chrome honesto — lacunas de backend e a costura pronta

> Onde o core-api ainda **não** expõe endpoint, a UI é fiel ao mock mas **desabilitada/anunciada**, sem
> dados fabricados (SC-006). A **costura** (porta no repository + gateway + server-fn stub) já é criada
> devolvendo "indisponível", para ligar trocando só o adapter quando a issue entregar.

| Lacuna                                                                    | Issue            | Impacto na UI                                                                                                                                                      | Costura preparada (liga depois)                                                                                                                                          |
| ------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Conta-cedente: listar/criar/saldo/contagens **sem endpoint HTTP**         | **core-api#168** | TELA 1 (grid de contas) inteira é chrome: lista anunciada como indisponível, "Adicionar conta bancária" desabilitado. TELA 2 não tem seletor real de conta.        | `repository.listAccounts()/getAccount()/createAccount()` + `*.server-fn` devolvendo `unavailable`. Substituir o adapter `core-api-financial` quando #168 expor as rotas. |
| Seleção de conta no workspace (consequência de #168)                      | **core-api#168** | TELA 2 usa **UUID v4 fixo de placeholder** (não há conta de seed nem UUID conhecido; o import não valida o ref). Reusar o mesmo uuid nas chamadas correlacionadas. | `account-selector.binding.ts` usa o uuid placeholder agora; troca para o grid real (`listAccounts`) quando #168 chegar (mesma porta).                                    |
| Enriquecer sugestões/títulos com **nome do fornecedor + nº do documento** | **core-api#172** | Match card e grid de títulos exibem o **mínimo** (documento/valor/vencimento/forma); slots de fornecedor/nº doc ficam vazios/anunciados.                           | Modelo `PaidPayable`/`MatchSuggestion` já tem os campos opcionais; mapper preenche quando o response trouxer.                                                            |
| **Listar períodos** para obter `periodId` fora do fechamento              | **core-api#173** | **Exportar** (OFX/CSV) na bottombar fica desabilitado/anunciado. **Fechar período funciona** normalmente.                                                          | `reconciliation.gateway.ts` (download) + `export-period.server-fn` stub prontos; habilita Exportar quando #173 permitir obter o `periodId`.                              |
| Importar **PDF via OCR**                                                  | **core-api#145** | No menu Importar, a opção **PDF** fica desabilitada/anunciada; OFX/CSV funcionam.                                                                                  | Menu já lista PDF como indisponível; liga quando #145 entregar (mesma server-fn de import com `format` novo ou rota OCR).                                                |

## Lacunas descobertas na implementação (abertas como issues)

- **core-api#174** — sugestões de match **em lote** por extrato. Sem isso, o **palpite por linha** (alta/média)
  na lista é inviável (seria N requisições); a banda aparece só no painel da transação selecionada.
- **core-api#175** — expor **`reconciliationId`** na listagem de transações (ou lookup por transação). Sem
  isso, o **Desfazer** só funciona para conciliações feitas na mesma sessão; pós-reload fica anunciado.

## Princípios do chrome honesto (todos)

- **Nunca** renderizar números/linhas falsas: estado vazio + aviso claro ("disponível quando … #NNN").
- Botão/opção desabilitado com `aria-disabled` e tooltip explicando a dependência.
- A **porta** (repository/gateway) existe e tem assinatura final; só o **adapter** muda quando o backend
  chegar — zero refactor de fronteira/UI.
- Espelha o padrão já adotado no OCR (#62) e em "Lançar Documento" (#89/web-app#34).
