# Feature Specification: Relatório da Conciliação no modelo de extrato

**Feature Branch**: `feat/132-relatorio-conciliacao-extrato`

**Created**: 2026-11-06

**Status**: Implementado; aprovado em tela pela P.O. em 06/11/2026

**Issue**: core-api#1108 (Melhoria). Evolui a spec 054.

**Ordem**: decisão da P.O. em 06/11/2026: entra antes da blindagem de segurança, com ciência do tech lead.

**Referência visual**: `Relatorio_Conciliacao_Bancaria_Lote-2.pdf` (modelo demonstrativo da P.O.) e imagem da tela Extrato.

**Input**: "O auditor precisa ver o valor no extrato e o mesmo no relatório, e os títulos ou título que correspondem àquela transação bancária."

## Contexto

O banco apresenta no extrato uma única saída com o valor aglutinado do lote, e isso não muda. O sistema já concilia vários títulos com uma transação, mas o resultado não aparece no PDF nem nas linhas da tela Extrato.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Relatório PDF no modelo de extrato (Priority: P1)

O auditor recebe um PDF profissional, com a logo da Bem Comum, dados da empresa e da conta, período, saldos e as transações em ordem cronológica, com os títulos do lote sob a transação, no mesmo padrão de informação do extrato.

**Why this priority**: é o pedido da auditoria.

**Independent Test**: exportar o PDF de um período com um lote e conferir que os títulos aparecem sob a transação e somam o valor dela.

**Acceptance Scenarios**:

1. **Given** uma conta e um período, **When** exporto o PDF, **Then** o cabeçalho traz nome da empresa, CNPJ do cedente, conta, período, data e hora de emissão e nome do usuário, e o resumo traz saldo inicial, entradas, saídas e saldo final.
2. **Given** uma transação conciliada com vários títulos, **When** exporto, **Then** a linha fica destacada, com o histórico exatamente como veio no extrato, e abaixo dela vêm os títulos abertos, com Título/documento, Favorecido, Vencimento e Líquido pago, e a linha "Total dos títulos".
3. **Given** uma transação que não é lote, **When** exporto, **Then** ela aparece só na linha principal, como no PDF atual.
4. **Given** uma transação pendente, **When** exporto, **Then** ela aparece com status Pendente e sem títulos.
5. **Given** o relatório, **When** o abro, **Then** vejo a logo da Bem Comum e um layout profissional.

---

### User Story 2 - Lote visível na tela Extrato (Priority: P1)

Na tela Extrato, a pessoa identifica de imediato as transações em lote e consulta os títulos de cada uma.

**Why this priority**: tela e relatório precisam contar a mesma história.

**Independent Test**: conciliar um lote e localizar tag, seta e títulos na linha, sem abrir o modal.

**Acceptance Scenarios**:

1. **Given** uma transação com mais de um título, **When** vejo a linha, **Then** ela mostra a seta ao lado da data e a tag "Baixa em lote · N títulos".
2. **Given** a linha de lote, **When** clico na seta, **Then** os títulos expandem ou recolhem na própria lista, sem abrir modal, com Título/Documento, Favorecido, Vencimento, Valor pago e o rodapé "N títulos vinculados" com o total.
3. **Given** a linha de lote, **When** clico no valor da saída, **Then** o modal indica "Pagamento em lote · N títulos".
4. **Given** os títulos abertos, **When** clico em um deles, **Then** abre o modal individual daquele título.
5. **Given** um pagamento individual, **When** vejo a linha, **Then** ela fica sem seta e sem tag, e o clique abre o modal atual.
6. **Given** um lote com tarifa, **When** vejo a linha, **Then** ela também é identificada como lote.

---

### User Story 3 - CSV com um título por linha (Priority: P2)

O CSV reflete todos os títulos conciliados, um por linha, e fecha com o extrato.

**Why this priority**: o CSV já gera um título por linha (`export-reconciliation-nibo.ts`, "N:1 → N linhas"), sem mudança de código.

**Independent Test**: exportar o CSV de um lote e somar as linhas da transação.

**Acceptance Scenarios**:

1. **Given** um lote, **When** exporto, **Then** cada título ocupa uma linha, e a soma fecha com o extrato.

### Edge Cases

- **Título não resolvido:** a linha aparece com "—" nos dados ausentes, sem ocultar o valor.
- **Período sem movimentos:** cabeçalho e resumo aparecem, com "Sem movimentos no período".
- **Falha ao ler os títulos:** o PDF não sai como se a transação não tivesse títulos; o relatório mostra o erro no lugar das movimentações.
- **Lote longo:** o cabeçalho da tabela repete a cada página.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O cabeçalho do relatório DEVE trazer nome da empresa, CNPJ do cedente, conta, período, data e hora de emissão e nome do usuário; o resumo, saldo inicial, entradas, saídas e saldo final.
- **FR-002**: As transações do PDF DEVEM seguir a ordem do extrato, com o mesmo histórico, valor e saldo, sem rótulo que não venha do banco, inclusive no lote (decisão da P.O.), nas colunas da referência: Data, Histórico bancário, Saída (R$), Saldo (R$) e Situação. Quando o período tiver entradas, acrescenta-se a coluna Entrada (R$). Ao final, a linha de totais com a quantidade de movimentações, contando cada lote uma vez.
- **FR-003**: Toda transação em lote DEVE mostrar, sempre aberto no PDF, os títulos vinculados.
- **FR-004**: No PDF, cada título DEVE mostrar Título/documento (número do documento), Favorecido, Vencimento e Líquido pago. Descrição do documento, tipo, série, emissão, categoria e quem conciliou NÃO aparecem (correção da P.O.).
- **FR-005**: A linha "Diferença" NÃO DEVE existir, e o painel de tratamento da diferença sai de "Buscar / Criar vários" (decisão da P.O.): Conciliar só habilita com os totais batendo. O lote traz a linha "Total dos títulos", e uma nota informa que os títulos compõem uma única saída bancária e não são somados novamente ao total.
- **FR-006**: Os valores dos títulos DEVEM somar o valor da transação. Quem conciliou fica só no modal.
- **FR-007**: O lote DEVE ser identificado pela quantidade de títulos (mais de um), nunca pelo tipo gravado.
- **FR-009**: O PDF DEVE continuar sendo gerado pelo navegador, mantendo o rodapé de impressão do Chrome (decisão da P.O.).
- **FR-010**: A tela Extrato DEVE seguir a imagem de referência da P.O.: seta, tag "Baixa em lote · N títulos", títulos expansíveis, modal do lote e modal individual do título.
- **FR-011**: O CSV DEVE trazer um título por linha, com as linhas de cada transação fechando com o extrato, sem mudar as colunas do Nibo.
- **FR-012**: Tela e relatório DEVEM usar a mesma leitura de dados.
- **FR-013**: O relatório DEVE ter a logo nova da Bem Comum no canto superior direito, sem barra no topo, e o visual da referência: cartões de saldo, cabeçalho de tabela escuro, linhas alternadas, lote destacado e faixa de totais. Os códigos `L-001`, `T-001`, `CB-2026-001` e o rótulo "simulado" da referência NÃO entram, porque não existem no sistema.

### Fora de escopo

- Regra de só conciliar quando os totais baterem e fluxo "Criar e conferir": core-api#1109.
- Numeração de remessa, código próprio de lote, confronto extrato × sistema, seções separadas, conciliações desfeitas, assinaturas e tratamento de registros antigos (retirados pela P.O. ou fora do modelo dela).
- Geração do PDF no servidor.

### Key Entities

- **Transação do extrato**: data, descrição, valor, saldo, status.
- **Conciliação da transação**: quem conciliou, quando, títulos e lançamentos.
- **Título conciliado**: número do documento, favorecido, vencimento e valor pago.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Em todo lote do relatório, os valores dos títulos somam o valor da transação.
- **SC-002**: Um auditor identifica os títulos de uma saída em lote lendo só o PDF.
- **SC-003**: Valor e saldo de cada transação são iguais na tela e no PDF.
- **SC-004**: Gerar o relatório de um período não faz uma chamada por transação.
- **SC-005**: As colunas do CSV do Nibo permanecem iguais.
