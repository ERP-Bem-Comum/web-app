/**
 * Lançar Documento — PAGE (view burra §XI). Compõe controller (form-state), binding (create) e o binding
 * de opções de fornecedor; deriva via funções PURAS (`document-form.view`); renderiza form + sidebar +
 * ações. No sucesso, mostra os **títulos gerados** (FR-007). Não usa data-hooks/useReducer direto — só os
 * hooks de binding/controller.
 */
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { useDocumentFormController } from '../document-form.controller.ts'
import { useDocumentReader } from '../reader/document-reader.binding.ts'
import { mapReadingToPatch, matchPartnerByTaxId } from '../document-reading.view.ts'
import { useOcrExtraction } from '../ocr.binding.ts'
import { useDocumentPreview } from '../document-preview.binding.ts'
import { useOcrPanelResize } from '../ocr-panel-resize.binding.ts'
import { useSupplierPickerController } from '../supplier-picker.controller.ts'
import { useLancarDocumentoBinding } from '../create-document.binding.ts'
import { useDocumentEditing } from '../edit-document.binding.ts'
import { usePartnersOptions } from '../partners-options.binding.ts'
import { usePartnerHydration } from '../partner-hydration.binding.ts'
import { useProgramOptions } from '../program-options.binding.ts'
import { useCategoryOptions, useCostCenterOptions } from '../category-options.binding.ts'
import { usePlanoOrcamentarioOptions } from '../plano-options.binding.ts'
import { useApproverOptions } from '../approver-options.binding.ts'
import { useAccountOptions } from '../account-options.binding.ts'
import {
  buildCreateInput,
  buildDraftInput,
  buildAdjustInput,
  canSubmit,
  canSaveDraft,
  canSaveEdit,
  ocrReadFields,
  type DocumentReadingPatch,
  type OcrFieldKey,
} from '../document-form.view.ts'
import { DocumentForm } from '../components/document-form.component.tsx'
import { SupplierPicker } from '../components/supplier-picker.component.tsx'
import { ComposicaoSidebar } from '../components/composicao-sidebar.component.tsx'
import { DocumentPreview } from '../components/document-preview.component.tsx'
import { DocumentBottombar } from '../components/document-bottombar.component.tsx'
import {
  body,
  crumb,
  errorBanner,
  formCol,
  resizeHandle,
  resizeHandleActive,
  scrollArea,
  screen,
  sidebarCol,
  topTitle,
  topbar,
  topbarBack,
  topbarClose,
} from './lancar-documento.css.ts'

const t = createTranslator(ptBR)

export type LancarDocumentoPageProps = Readonly<{ documentId?: string }>

export function LancarDocumentoPage({ documentId }: LancarDocumentoPageProps = {}): ReactNode {
  const navigate = useNavigate()
  const edit = useDocumentEditing(documentId)
  // Largura redimensionável da coluna OCR (arraste/teclado, persistida) — UI-state via binding.
  const ocrResize = useOcrPanelResize()
  // Arquivo subido mantido no estado da page (a navegação create→edit é MESMA rota → o componente não
  // desmonta → o File sobrevive p/ o web view). Um reload direto do `?id` perde o arquivo → sem preview.
  const [ocrFile, setOcrFile] = useState<File | null>(null)
  const partners = usePartnersOptions()
  // LEITOR CLIENT-SIDE por gabarito (ADR-0021): lê o arquivo LOCAL (XML por leiaute / PDF por camada de texto)
  // e mapeia p/ o patch dos campos. Aditivo à ingestão do backend; onde ambos têm o campo, o cliente vence.
  const clientReader = useDocumentReader(ocrFile)
  const readingMap = useMemo(
    () => (clientReader.reading !== null ? mapReadingToPatch(clientReader.reading) : null),
    [clientReader.reading],
  )
  // Patch final = campos mapeados + fornecedor casado por CNPJ contra os parceiros já carregados no client.
  const readingPatch = useMemo<DocumentReadingPatch | null>(() => {
    if (readingMap === null || clientReader.reading === null) return null
    const supplierRef = matchPartnerByTaxId(partners, clientReader.reading.supplier.taxId)
    return supplierRef !== null ? { ...readingMap.patch, supplierRef } : readingMap.patch
  }, [readingMap, partners, clientReader.reading])
  const controller = useDocumentFormController(edit.initialFields, readingPatch)
  // Ingestão por OCR (core-api#62): no sucesso CRIA UM RASCUNHO e navega p/ o modo edição dele (revisão do
  // operador). O binding só ingere+navega — nunca cria um 2º documento. PRESERVADO (aditivo ao leitor client).
  const ocr = useOcrExtraction()
  const preview = useDocumentPreview(ocrFile)
  const handleSelectFile = (file: File): void => {
    setOcrFile(file)
    ocr.extract(file)
  }
  // Destaque âmbar + tag "OCR": une o que o LEITOR client preencheu (precedência) ao derivado do rascunho
  // backend (fallback quando o leitor não reconhece o documento). Baseado na extração, não nos edits.
  const backendOcrFields = ocrReadFields(edit.initialFields ?? null, ocrFile !== null)
  const ocrFields = useMemo<ReadonlySet<OcrFieldKey>>(
    () => new Set<OcrFieldKey>([...backendOcrFields, ...(readingMap?.ocrKeys ?? [])]),
    [backendOcrFields, readingMap],
  )
  const picker = useSupplierPickerController()
  const command = useLancarDocumentoBinding()

  // Sucesso → o binding invalida a lista e redireciona pro grid (sem card de sucesso inline).
  const selectedPartner = partners.find((p) => p.id === controller.fields.supplierRef) ?? null
  const supplierName = selectedPartner?.name ?? ''
  // Hidrata banco + contratos "Em Andamento" do parceiro (auto-preenchimento do Pagamento/Categorização).
  const hydration = usePartnerHydration(controller.fields.supplierRef, selectedPartner?.kind ?? null)
  // Contrato vinculado: o escolhido em "Alterar" tem prioridade; senão o 1º "Em Andamento" do parceiro.
  const selectedContract =
    hydration.contracts.find((c) => c.ref === controller.fields.contractRef) ?? hydration.contracts[0] ?? null
  // Programa (Categorização) — opções reais + valor efetivo: o escolhido pelo usuário tem prioridade;
  // senão herda o programa do contrato selecionado (quando houver).
  const programOptions = useProgramOptions()
  const categoryOptions = useCategoryOptions()
  const costCenterOptions = useCostCenterOptions()
  const planoOptions = usePlanoOrcamentarioOptions()
  const approverOptions = useApproverOptions()
  const accountOptions = useAccountOptions()
  const programValue =
    controller.fields.programRef !== '' ? controller.fields.programRef : (selectedContract?.programRef ?? '')

  // Modo da tela:
  //  · create  — novo documento
  //  · edit    — Aberto: ajuste (PATCH) do subconjunto editável; demais campos travados
  //  · draft   — Rascunho: reabre com TUDO preenchido e EDITÁVEL p/ concluir e salvar (via create)
  //  · view    — demais status: somente consulta (tudo travado)
  const mode = !edit.isEdit
    ? 'create'
    : edit.status === 'Aberto'
      ? 'edit'
      : edit.status === 'Rascunho'
        ? 'draft'
        : 'view'
  // Rascunho/criação salvam pelo command (create); edição usa o binding de ajuste.
  const errorTag = mode === 'edit' ? edit.errorTag : command.errorTag
  const running = mode === 'edit' ? edit.running : command.running
  // Travas: edição/consulta usam as travas por status; criação/rascunho ficam 100% abertos.
  const formLocks = mode === 'edit' || mode === 'view' ? (edit.locks ?? undefined) : undefined
  // Bottombar: rascunho reaproveita as ações de criação (Salvar Documento / Salvar rascunho).
  const bottombarMode = mode === 'draft' ? 'create' : mode
  const goToGrid = (): void => {
    void navigate({ to: '/financeiro/contas-a-pagar' })
  }

  // Anexa os refs do contrato "Em Andamento" e dispara o create (backend deriva a categorização — #48).
  const submit = (base: ReturnType<typeof buildCreateInput>): void => {
    if (base === null) return
    // payeeKind (#90) derivado do parceiro selecionado (mesmos valores do enum do backend); default server 'supplier'.
    const withPayee = { ...base, payeeKind: selectedPartner?.kind ?? undefined }
    const c = selectedContract
    command.execute(
      c !== null
        ? {
            ...withPayee,
            contractRef: c.ref,
            // Programa escolhido pelo usuário tem prioridade; senão herda o do contrato.
            programRef: base.programRef ?? c.programRef ?? undefined,
            budgetPlanRef: c.budgetPlanRef ?? undefined,
          }
        : withPayee,
    )
  }

  // Ajuste (modo edição): só os campos editáveis + version; o binding invalida e volta ao grid.
  const submitEdit = (): void => {
    if (edit.detail === null) return
    const input = buildAdjustInput(controller.fields, edit.detail)
    if (input !== null) edit.execute(input)
  }

  return (
    <div className={screen}>
      <header className={topbar}>
        <Link
          to="/financeiro/contas-a-pagar"
          className={topbarBack}
          aria-label={t('financial.create.backLabel')}
        >
          {t('financial.create.back')}
        </Link>
        <h1 className={topTitle}>
          {mode === 'edit' || mode === 'view' ? t('financial.edit.title') : t('financial.create.title')}
        </h1>
        <span className={crumb}>{t('financial.create.crumb')}</span>
        <Link
          to="/financeiro/contas-a-pagar"
          className={topbarClose}
          aria-label={t('financial.create.closeLabel')}
        >
          {t('financial.create.close')}
        </Link>
      </header>

      {errorTag !== null ? (
        <div className={errorBanner} role="alert">
          {t(errorTag)}
        </div>
      ) : null}

      <div
        className={body}
        style={{ ['--ocr-col-width']: `${String(ocrResize.widthPx)}px` } as CSSProperties}
      >
        <DocumentPreview
          status={ocr.status}
          fileName={ocr.fileName}
          errorTag={ocr.errorTag}
          preview={preview}
          allowReplace={mode === 'create'}
          onSelectFile={handleSelectFile}
        />

        {/* Alça de redimensionamento da coluna OCR (arraste horizontal + setas do teclado). */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t('financial.create.ocrResizeLabel')}
          aria-valuenow={ocrResize.widthPx}
          aria-valuemin={ocrResize.minPx}
          aria-valuemax={ocrResize.maxPx}
          tabIndex={0}
          className={`${resizeHandle} ${ocrResize.resizing ? resizeHandleActive : ''}`}
          onPointerDown={ocrResize.onHandlePointerDown}
          onKeyDown={ocrResize.onHandleKeyDown}
        />

        <div className={`${formCol} ${scrollArea}`}>
          {/* Hero do fornecedor com picker buscável (todos os parceiros) — via MANUAL do fornecedor. */}
          <SupplierPicker
            selected={selectedPartner}
            options={partners}
            open={picker.open}
            query={picker.query}
            disabled={mode === 'edit' || mode === 'view'}
            onToggle={picker.toggle}
            onClose={picker.close}
            onQueryChange={picker.setQuery}
            onSelect={(id) => {
              controller.setSupplier(id)
              picker.close()
            }}
          />

          <DocumentForm
            fields={controller.fields}
            hydration={hydration}
            ocrFields={ocrFields}
            locks={formLocks}
            onType={controller.setType}
            onPaymentMethod={controller.setPaymentMethod}
            onText={controller.setText}
            onRetention={controller.setRetention}
            onReformaTributaria={controller.setReformaTributaria}
            programOptions={programOptions}
            programValue={programValue}
            onProgram={controller.setProgramRef}
            categoryValue={controller.fields.categoryRef}
            onCategory={controller.setCategoryRef}
            costCenterValue={controller.fields.costCenterRef}
            onCostCenter={controller.setCostCenterRef}
            approverValue={controller.fields.approverRef}
            onApprover={controller.setApproverRef}
            approverOptions={approverOptions}
            contaDebitoValue={controller.fields.contaDebitoRef}
            onContaDebito={controller.setContaDebitoRef}
            contaDebitoOptions={accountOptions}
            centroCustoOptions={costCenterOptions}
            categoriaOptions={categoryOptions}
            subcategoriaOptions={[]}
            planoOptions={planoOptions}
            contract={selectedContract}
            contracts={hydration.contracts}
            contractPickerOpen={controller.contractPickerOpen}
            onToggleContractPicker={controller.toggleContractPicker}
            onCloseContractPicker={controller.closeContractPicker}
            onSelectContract={(ref) => {
              controller.setContractRef(ref)
              controller.closeContractPicker()
            }}
            typeModalOpen={controller.typeModalOpen}
            onOpenTypeModal={controller.openTypeModal}
            onSelectType={(type) => {
              controller.setType(type)
              controller.closeTypeModal()
            }}
            onCloseTypeModal={controller.closeTypeModal}
            payModalOpen={controller.payModalOpen}
            onOpenPayModal={controller.openPayModal}
            onSelectPayment={(method) => {
              controller.setPaymentMethod(method)
              controller.closePayModal()
            }}
            onClosePayModal={controller.closePayModal}
          />
        </div>

        <aside className={`${sidebarCol} ${scrollArea}`}>
          <ComposicaoSidebar
            fields={controller.fields}
            supplierName={supplierName}
            editable={mode === 'create' || mode === 'draft'}
            onText={controller.setText}
          />
        </aside>
      </div>

      <DocumentBottombar
        mode={bottombarMode}
        onAddSupplier={() => {
          // Mesma rota do "novo fornecedor" do incluir contrato; volta pra cá após cadastrar.
          void navigate({
            to: '/parceiros/fornecedores/criar',
            search: { returnTo: '/financeiro/contas-a-pagar/lancar' },
          })
        }}
        onDiscard={edit.isEdit ? goToGrid : controller.reset}
        onSaveDraft={() => {
          submit(buildDraftInput(controller.fields))
        }}
        onSubmit={
          mode === 'edit'
            ? submitEdit
            : () => {
                submit(buildCreateInput(controller.fields))
              }
        }
        canSaveDraft={canSaveDraft(controller.fields)}
        canSubmit={
          mode === 'edit'
            ? edit.detail !== null && canSaveEdit(controller.fields, edit.detail)
            : canSubmit(controller.fields)
        }
        running={running}
      />
    </div>
  )
}
