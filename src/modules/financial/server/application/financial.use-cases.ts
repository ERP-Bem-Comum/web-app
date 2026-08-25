/**
 * Use-cases do Financeiro / Contas a Pagar (application) — thin sobre a borda; sem I/O direto (o client
 * é injetado). Result em tudo (§II). `FinancialClient` é a porta — implementada em adapters
 * (`core-api-financial.ts`). Espelha `users.use-cases.ts`.
 */
import type { Result } from '#shared/primitives/result.ts'
import type { FinancialError } from '#modules/financial/server/domain/errors/financial.errors.ts'
import type {
  ListDocumentsInput,
  DocumentListResponse,
  DocumentDetail,
  CreateDocumentInput,
  AdjustDocumentInput,
  ApproveInput,
  UpdatePayableDueDateInput,
  CancelInput,
  ManualPaymentInput,
  ListPayableTitlesInput,
  PayableTitleListResponse,
  PayableCountsInput,
  PayableCounts,
  RecentPayment,
  DocumentTimelineEvent,
  DocumentSourceFile,
} from '#modules/financial/server/domain/document.io.ts'
import type {
  DashboardCostCenters,
  DashboardNoContractSupplier,
} from '#modules/financial/server/domain/dashboard.io.ts'
import type {
  PreviewRemittanceInput,
  RemittancePreview,
  GenerateRemittanceInput,
  GeneratedRemittance,
  RemittanceFile,
} from '#modules/financial/server/domain/remittance.io.ts'

/**
 * Falha com TEXTO — a tag do comportamento + a mensagem PT-BR que o core-api já mandou no corpo.
 *
 * Nasceu na geração da remessa e valia só para ela; o nome mentia. O colapso que a justifica é
 * TRANSVERSAL: o `sendDomainError` do core-api reduz todo slug de 4xx a um balde público (OWASP API8),
 * então causas distintas chegam com o MESMO status e a mesma tag. Na remessa são quatro recusas num
 * 422 só; no approve são as quatro do aprovador (`approver-not-found`, `approver-missing-permission`,
 * `approver-limit-exceeded`, `approver-authority-unavailable`), todas 422 → `validation`. Em ambos os
 * casos **só o texto separa**, e sem ele a tela diz "Verifique os dados informados" para um problema
 * que não está nos dados.
 *
 * A tag segue mandando no COMPORTAMENTO (§V); a mensagem só preenche o TEXTO. `null` quando não houver.
 */
export type FinancialFailure = Readonly<{
  error: FinancialError
  message: string | null
}>

export type FinancialClient = Readonly<{
  list: (input: ListDocumentsInput, token: string) => Promise<Result<DocumentListResponse, FinancialError>>
  listPayableTitles: (
    input: ListPayableTitlesInput,
    token: string,
  ) => Promise<Result<PayableTitleListResponse, FinancialError>>
  // specs/101: TODOS os títulos do filtro (o BFF pagina o core-api). Sem `page`/`pageSize` de tela: a
  // paginação passa a ser recorte de exibição, e busca/seleção/remessa enxergam o conjunto inteiro.
  listAllPayableTitles: (
    input: ListPayableTitlesInput,
    token: string,
  ) => Promise<Result<PayableTitleListResponse, FinancialError>>
  getById: (id: string, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  // #568: comprovante-fonte (bytes base64 + mimeType) — o BFF busca COM o token; o browser nunca acessa.
  getSourceFile: (id: string, token: string) => Promise<Result<DocumentSourceFile, FinancialError>>
  // Trilha de auditoria (GET /documents/:id/timeline). Eventos CRUS (actor = UUID; o nome é resolvido na fn).
  getTimeline: (
    id: string,
    token: string,
  ) => Promise<Result<readonly DocumentTimelineEvent[], FinancialError>>
  create: (input: CreateDocumentInput, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  adjust: (input: AdjustDocumentInput, token: string) => Promise<Result<DocumentDetail, FinancialError>>
  // Falha COM TEXTO: as quatro recusas do aprovador chegam como o mesmo 422 → `validation`, e a tela
  // dizia "Verifique os dados informados" para um problema que não está nos dados do documento.
  approve: (input: ApproveInput, token: string) => Promise<Result<DocumentDetail, FinancialFailure>>
  // #270: vencimento de UM título isolado (não propaga pai↔filhos). Devolve o documento atualizado.
  updatePayableDueDate: (
    input: UpdatePayableDueDateInput,
    token: string,
  ) => Promise<Result<DocumentDetail, FinancialError>>
  undoApproval: (input: ApproveInput, token: string) => Promise<Result<DocumentDetail, FinancialFailure>>
  cancel: (input: CancelInput, token: string) => Promise<Result<void, FinancialError>>
  registerManualPayment: (
    input: ManualPaymentInput,
    token: string,
  ) => Promise<Result<DocumentDetail, FinancialError>>
  getRecentPayments: (token: string) => Promise<Result<readonly RecentPayment[], FinancialError>>
  // #241/#237: KPI "Despesas por Centro de Custo" do Dashboard (cost-centers + variação M-1 vs M-2).
  getDashboardCostCenters: (token: string) => Promise<Result<DashboardCostCenters, FinancialError>>
  // #242: widget "Fornecedores sem Contrato" do Dashboard (top-5 por total pago).
  getDashboardNoContractSuppliers: (
    token: string,
  ) => Promise<Result<readonly DashboardNoContractSupplier[], FinancialError>>
  // #536: contagem agregada por status (chips do grid).
  getPayableCounts: (
    input: PayableCountsInput,
    token: string,
  ) => Promise<Result<PayableCounts, FinancialError>>
  // VAN (core-api#728): pré-voo do lote — o que sai e o que não sai, ANTES de gerar. Leitura pura.
  previewRemittance: (
    input: PreviewRemittanceInput,
    token: string,
  ) => Promise<Result<RemittancePreview, FinancialError>>
  // ⚠️ VAN (core-api#728): GERA — grava em `saida/` e ENFILEIRA PAGAMENTO no banco. Consome NSA.
  generateRemittance: (
    input: GenerateRemittanceInput,
    token: string,
  ) => Promise<Result<GeneratedRemittance, FinancialFailure>>
  // VAN (specs/103): baixa o arquivo QUE FOI ao banco — cópia de conferência, **homologação apenas**.
  // Reusa a falha-com-mensagem da geração: os dois motivos novos (`remittance-file-not-found` 404,
  // `remittance-file-corrupted` 503) também chegam colapsados, e só o texto do core-api os separa.
  downloadRemittanceFile: (
    remittanceId: string,
    token: string,
  ) => Promise<Result<RemittanceFile, FinancialFailure>>
}>

type Deps = Readonly<{ client: FinancialClient }>

export const createListDocuments =
  (deps: Deps) =>
  (input: ListDocumentsInput, token: string): Promise<Result<DocumentListResponse, FinancialError>> =>
    deps.client.list(input, token)

export const createListPayableTitles =
  (deps: Deps) =>
  (input: ListPayableTitlesInput, token: string): Promise<Result<PayableTitleListResponse, FinancialError>> =>
    deps.client.listPayableTitles(input, token)

export const createListAllPayableTitles =
  (deps: Deps) =>
  (input: ListPayableTitlesInput, token: string): Promise<Result<PayableTitleListResponse, FinancialError>> =>
    deps.client.listAllPayableTitles(input, token)

export const createGetPayableCounts =
  (deps: Deps) =>
  (input: PayableCountsInput, token: string): Promise<Result<PayableCounts, FinancialError>> =>
    deps.client.getPayableCounts(input, token)

// VAN (core-api#728): pré-voo do lote. Thin — a régua de aptidão é do core-api (`checkPayoutReadiness`),
// a MESMA que a geração usa. Uma segunda régua "de tela" divergiria, e a divergência apareceria como
// título que o pré-voo aprova e o arquivo recusa.
export const createPreviewRemittance =
  (deps: Deps) =>
  (input: PreviewRemittanceInput, token: string): Promise<Result<RemittancePreview, FinancialError>> =>
    deps.client.previewRemittance(input, token)

// ⚠️ Gerar remessa MOVE DINHEIRO. Thin de propósito: nenhuma regra nossa se interpõe entre o comando do
// operador e o core-api — quem decide o que entra no arquivo é o domínio de lá, e uma checagem a mais
// aqui só criaria uma segunda verdade sobre um pagamento já enfileirado.
export const createGenerateRemittance =
  (deps: Deps) =>
  (input: GenerateRemittanceInput, token: string): Promise<Result<GeneratedRemittance, FinancialFailure>> =>
    deps.client.generateRemittance(input, token)

// Download do arquivo (specs/103). Thin pelo mesmo motivo da geração: quem decide se aquele objeto É a
// remessa emitida é o core-api, que confere o `contentHash`. Uma segunda opinião nossa sobre identidade
// de arquivo de pagamento seria uma verdade concorrente sobre dinheiro que já saiu.
export const createDownloadRemittanceFile =
  (deps: Deps) =>
  (remittanceId: string, token: string): Promise<Result<RemittanceFile, FinancialFailure>> =>
    deps.client.downloadRemittanceFile(remittanceId, token)

export const createGetDocument =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.getById(id, token)

export const createGetDocumentSourceFile =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<DocumentSourceFile, FinancialError>> =>
    deps.client.getSourceFile(id, token)

export const createGetDocumentTimeline =
  (deps: Deps) =>
  (id: string, token: string): Promise<Result<readonly DocumentTimelineEvent[], FinancialError>> =>
    deps.client.getTimeline(id, token)

export const createCreateDocument =
  (deps: Deps) =>
  (input: CreateDocumentInput, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.create(input, token)

export const createAdjustDocument =
  (deps: Deps) =>
  (input: AdjustDocumentInput, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.adjust(input, token)

export const createApproveDocument =
  (deps: Deps) =>
  (input: ApproveInput, token: string): Promise<Result<DocumentDetail, FinancialFailure>> =>
    deps.client.approve(input, token)

export const createUpdatePayableDueDate =
  (deps: Deps) =>
  (input: UpdatePayableDueDateInput, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.updatePayableDueDate(input, token)

export const createUndoApproval =
  (deps: Deps) =>
  (input: ApproveInput, token: string): Promise<Result<DocumentDetail, FinancialFailure>> =>
    deps.client.undoApproval(input, token)

export const createCancelDocument =
  (deps: Deps) =>
  (input: CancelInput, token: string): Promise<Result<void, FinancialError>> =>
    deps.client.cancel(input, token)

export const createRegisterManualPayment =
  (deps: Deps) =>
  (input: ManualPaymentInput, token: string): Promise<Result<DocumentDetail, FinancialError>> =>
    deps.client.registerManualPayment(input, token)

export const createGetRecentPayments =
  (deps: Deps) =>
  (token: string): Promise<Result<readonly RecentPayment[], FinancialError>> =>
    deps.client.getRecentPayments(token)
