'use client'
import { ContractClassification, ContractStatus, ContractType } from '@/enums/contracts'
import { useContractContext } from '@/hooks/useContractsContext'
import { useOptions } from '@/hooks/useOptions'
import { Contract, IContract, otherContractSchema } from '@/types/contracts'
import { ISupplier } from '@/types/supplier'
import { ICollaborator } from '@/services/collaborator'
import { IFinancier } from '@/services/financier'
import { switchContractedComponent } from '@/utils/UI/contracts'
import { contractSchema } from '@/validators/contracts'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DeepPartial, useForm, Controller } from 'react-hook-form'
import { ModalAlert } from '../modals/ModalAlert'
import { ModalConfirm } from '../modals/ModalConfirm'
import { ModalQuestion } from '../modals/ModalQuestion'
import { Card, CardContent, CardFooter } from '../ui/card'
import { Contracts } from './FormComponents'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Plus, Search, Check, Upload, UserPlus } from 'lucide-react'
import { formatDate, handleDates } from '@/utils/dates'
import { maskCNPJ, maskCPF, maskMonetaryValue, maskPhone } from '@/utils/masks'
import { queryClient } from 'lib/react-query'
import { localDbGetProgramOptions, localDbGetBudgetPlanOptions, localDbGetContractById, localDbGetContracts, localDbSaveContract, localDbUpdateContract, localDbDeleteContract } from '@/mocks/localDb'
import styles from './contractLaunchForm.module.css'
import { AutoComplete } from '@/components/layout/AutoComplete'
import { CustomTextField } from '@/components/layout/TextField'
import { AgencyComponent } from '@/components/layout/AgencyComponent'
import { PixKeyComponent } from '@/components/layout/PixKeyComponent'
import { StringMultiSelect } from '@/components/layout/StringMultiSelect'

interface Props {
  contract?: IContract
  edit: boolean
  parentId?: number
  layout?: 'default' | 'launch'
  onSaveSuccess?: () => void
}

export const getMostRecentInfo = (contract?: IContract, parentId?: number) => {
  let mostRecentInfo = contract
  if (contract && contract.children) {
    if (contract.children.length > 0) {
      mostRecentInfo = contract.children.sort((a, b) => b.id - a.id)[0]
    }
  }
  if (parentId) {
    return {
      ...mostRecentInfo,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      contractStatus: undefined,
      parentId,
    }
  }
  return mostRecentInfo
}

export default function FormContract({ contract, edit, parentId, layout = 'default', onSaveSuccess }: Props) {
  const router = useRouter()
  const mostRecentInfo = getMostRecentInfo(contract, parentId)
  const { data: session } = useSession()
  const {
    onSubmit,
    onDelete,
    handleChangeFile,
    isDisabled,
    errorMessage,
    showModalConfirm,
    showModalAlert,
    showModalQuestion,
    setShowModalAlert,
    setShowModalQuestion,
    setShowModalConfirm,
    isDeleting,
    setIsDeleting,
    operationType,
  } = useContractContext()

  const { options, contractsOp } = useOptions()

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<Contract>({
    resolver: zodResolver(contractSchema),
    defaultValues: mostRecentInfo
      ? {
          ...mostRecentInfo,
          contractPeriod: mostRecentInfo.contractPeriod
            ? {
                ...mostRecentInfo.contractPeriod,
                isIndefinite:
                  mostRecentInfo.contractPeriod.isIndefinite ??
                  (mostRecentInfo.contractPeriod.end === null ? true : false),
              }
            : undefined,
          updatedBy: session?.user.id,
          createdById: session?.user.id,
        }
      : {
          contractType: ContractType.SUPPLIER,
          classification: ContractClassification.CONTRACT,
        },
  })

  const values = watch()
  const [showHomologModal, setShowHomologModal] = useState(false)
  const [contactEmail, setContactEmail] = useState('')
  const [contactTelephone, setContactTelephone] = useState('')
  const [hasFiles, setHasFiles] = useState(!!contract?.files?.length)
  const [contractorData, setContractorData] = useState<ISupplier | ICollaborator | IFinancier | null>(null)

  // Validação de teto para Ordem de Serviço
  const isServiceOrder = values.classification === ContractClassification.SERVICE_ORDER
  const serviceOrderValueError = useMemo(() => {
    if (isServiceOrder && values.totalValue && values.totalValue > 9999.99) {
      return 'Para Ordem de Serviço, o valor original máximo permitido é R$ 9.999,99.'
    }
    return ''
  }, [isServiceOrder, values.totalValue])
  const isSaveDisabled = isDisabled || !!serviceOrderValueError

  // Inicializa email/telefone ao carregar contrato existente
  useEffect(() => {
    if (contract) {
      const email = contract.supplier?.email || contract.collaborator?.email || contract.financier?.email || ''
      const telephone = contract.supplier?.telephone || contract.collaborator?.telephone || contract.financier?.telephone || ''
      setContactEmail(email)
      setContactTelephone(telephone)
    }
  }, [contract])

  // Atualiza email/telefone quando o contratado é selecionado
  useEffect(() => {
    if (contractorData) {
      setContactEmail(contractorData.email || '')
      setContactTelephone(contractorData.telephone || '')
    }
  }, [contractorData])
  const [showSearchField, setShowSearchField] = useState(false)
  const [actEntityType, setActEntityType] = useState<'PJ' | 'PF'>('PJ')
  const [modalFile, setModalFile] = useState<File | null>(null)
  const [modalFileBase64, setModalFileBase64] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string>('')
  const [startDateInput, setStartDateInput] = useState(formatDate(values.contractPeriod?.start))
  const [endDateInput, setEndDateInput] = useState(formatDate(values.contractPeriod?.end))
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const draftIdRef = useRef<number | null>(null)
  const valuesRef = useRef(values)
  const isNavigatingAwayRef = useRef(false)
  const beforeUnloadDisabledRef = useRef(false)
  const [draftId, setDraftId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const raw = sessionStorage.getItem('contract_draft_id')
    return raw ? Number(raw) : null
  })

  const isMounted = useRef(false)

  // Sincroniza refs para uso síncrono em beforeunload
  useEffect(() => { draftIdRef.current = draftId }, [draftId])
  useEffect(() => { valuesRef.current = values }, [values])

  // Recupera rascunho salvo ao montar a tela de novo contrato
  useEffect(() => {
    if (layout !== 'launch' || contract) return
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem('contract_draft_id') : null
    if (!raw) return
    const savedDraftId = Number(raw)
    const draft = localDbGetContractById(savedDraftId)
    if (!draft) return

    reset({
      ...draft,
      contractPeriod: draft.contractPeriod
        ? {
            start: draft.contractPeriod.start ? handleDates(draft.contractPeriod.start) : undefined,
            end: draft.contractPeriod.end ? handleDates(draft.contractPeriod.end) : undefined,
            isIndefinite: draft.contractPeriod.isIndefinite ?? (draft.contractPeriod.end === null ? true : false),
          }
        : undefined,
      updatedBy: session?.user.id,
    } as unknown as Contract)
    setDraftId(savedDraftId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilesChange = (attachments: Parameters<typeof handleChangeFile>[0]) => {
    setHasFiles(!!attachments?.length)
    handleChangeFile(attachments)
  }

  // Resetar modais ao montar o componente
  useEffect(() => {
    setShowModalConfirm(false)
    setShowModalAlert(false)
    setShowModalQuestion(false)
    setIsDeleting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Concatena agency + dv no formato 0000-0 ao carregar contrato existente
  useEffect(() => {
    const agency = mostRecentInfo?.bancaryInfo?.agency
    const dv = mostRecentInfo?.bancaryInfo?.dv
    if (agency && dv) {
      setValue('bancaryInfo.agency', `${agency}-${dv}`, { shouldValidate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostRecentInfo?.bancaryInfo?.agency, mostRecentInfo?.bancaryInfo?.dv])

  // Autosave com debounce de 3s — salva rascunho em segundo plano toda vez que um campo é alterado
  useEffect(() => {
    if (layout !== 'launch') return
    if (contract) return
    if (isNavigatingAwayRef.current) return

    setIsAutoSaving(true)
    const timer = setTimeout(() => {
      if (isNavigatingAwayRef.current) {
        setIsAutoSaving(false)
        return
      }
      const draftData = {
        ...values,
        contractStatus: ContractStatus.RASCUNHO,
      }
      if (draftIdRef.current) {
        localDbUpdateContract(draftIdRef.current, draftData)
      } else {
        const saved = localDbSaveContract(draftData)
        setDraftId(saved.id)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('contract_draft_id', String(saved.id))
        }
      }
      setLastSavedAt(new Date())
      setIsAutoSaving(false)
    }, 3000)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, draftId, layout, contract])

  // Autosave antes de fechar/sair da página
  useEffect(() => {
    if (layout !== 'launch') return
    if (contract) return
    const handleBeforeUnload = () => {
      if (beforeUnloadDisabledRef.current) return
      const currentValues = valuesRef.current
      const draftData = {
        ...currentValues,
        contractStatus: ContractStatus.RASCUNHO,
      }
      if (draftIdRef.current) {
        localDbUpdateContract(draftIdRef.current, draftData)
      } else {
        const saved = localDbSaveContract(draftData)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('contract_draft_id', String(saved.id))
        }
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [layout, contract])

  // Atualiza contractCode do rascunho quando a classificação muda
  useEffect(() => {
    if (layout !== 'launch' || !draftId) return
    const draft = localDbGetContractById(draftId)
    if (!draft?.contractCode) return
    const expectedPrefix = values.classification === ContractClassification.SERVICE_ORDER ? 'OS' : 'CT'
    if (!draft.contractCode.startsWith(expectedPrefix)) {
      const year = values.contractPeriod?.start
        ? new Date(values.contractPeriod.start).getFullYear()
        : new Date().getFullYear()
      const allContracts = localDbGetContracts()
      const sameType = allContracts.filter((c) =>
        c.contractCode?.startsWith(expectedPrefix) && c.contractCode?.includes(`-${year}-`)
      )
      const maxSeq = sameType.reduce((max, c) => {
        const match = c.contractCode?.match(new RegExp(`${expectedPrefix}-${year}-(\\d{4})`))
        return match ? Math.max(max, parseInt(match[1], 10)) : max
      }, 0)
      const newCode = `${expectedPrefix}-${year}-${String(maxSeq + 1).padStart(4, '0')}`
      localDbUpdateContract(draftId, { contractCode: newCode })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.classification, draftId, layout])

  // Limpa o rascunho temporário quando o contrato é salvo com sucesso
  useEffect(() => {
    if (layout === 'launch' && showModalConfirm && draftId && errorMessage === '') {
      localDbDeleteContract(draftId)
      setDraftId(null)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('contract_draft_id')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModalConfirm, errorMessage])

  // Redireciona para o grid após salvar com sucesso no layout launch
  useEffect(() => {
    if (layout === 'launch' && showModalConfirm && errorMessage === '') {
      if (onSaveSuccess) onSaveSuccess()
      else router.push('/contratos')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModalConfirm, errorMessage])

  useEffect(() => {
    if (isMounted.current) {
      reset({
        pixInfo: null,
        bancaryInfo: null,
        totalValue: null,
        supplierId: null,
        collaboratorId: null,
        financierId: null,
        contractPeriod: null,
        contractModel: null,
        object: null,
        programId: null,
        budgetPlanId: null,
        updatedBy: session?.user.id,
        contractType: values.contractType,
      } as unknown as DeepPartial<Contract>)

      setValue('contractType', values.contractType)
      setStartDateInput('')
      setEndDateInput('')
    } else {
      isMounted.current = true
    }
  }, [reset, setValue, values.contractType])

  useEffect(() => {
    setStartDateInput(formatDate(values.contractPeriod?.start))
    setEndDateInput(formatDate(values.contractPeriod?.end))
  }, [values.contractPeriod?.start, values.contractPeriod?.end])

  const contractorSelected = Boolean(values.supplierId || values.collaboratorId || values.financierId)
  const contractDataFilled = Boolean(values.contractType && values.contractModel && values.object)
  const valueFilled = Boolean(values.totalValue && values.totalValue > 0)
  const vigencyFilled = Boolean(
    values.contractPeriod?.start && values.contractPeriod?.end
  )
  const programFilled =
    values.contractType === ContractType.FINANCIER || Boolean(values.programId && values.budgetPlanId)
  const categorizacaoFilled = Boolean(values.categorizacao?.length)
  const centroDeCustoFilled = Boolean(values.centroDeCusto?.length)
  const checklist = [
    { label: 'Contratado selecionado', done: contractorSelected },
    { label: 'Tipo, Modelo e Objeto preenchidos', done: contractDataFilled },
    { label: 'Valor original informado', done: valueFilled },
    { label: 'Início e fim da vigência', done: vigencyFilled },
    { label: 'Programa e plano orçamentário', done: programFilled },
    { label: 'Categorização preenchida', done: categorizacaoFilled },
    { label: 'Centro de Custo preenchido', done: centroDeCustoFilled },
  ]
  const doneCount = checklist.filter((item) => item.done).length
  const amount = values.totalValue ? maskMonetaryValue(values.totalValue).replace('R$', '').trim() : '0,00'
  const [amountMain, amountCents = '00'] = amount.split(',')
  const startDate = formatDate(values.contractPeriod?.start)
  const endDate = formatDate(values.contractPeriod?.end)
  const submitContract = handleSubmit(
    (data, e) => {
      const payload = { ...data } as Record<string, unknown>
      // Garante que signedContractUrl está no payload antes de enviar
      if (modalFileBase64 && !payload.signedContractUrl) {
        payload.signedContractUrl = modalFileBase64
      }
      // Define o status conforme regra: com arquivo = Em Andamento, sem arquivo = Pendente
      const hasFile = !!modalFileBase64 || !!modalFile
      payload.contractStatus = hasFile ? ContractStatus.ONGOING : ContractStatus.PENDING
      // Adiciona email e telefone ao contratado no payload
      if (payload.contractType === ContractType.SUPPLIER || payload.contractType === ContractType.ACT) {
        if (payload.supplier) {
          payload.supplier = { ...(payload.supplier as object), email: contactEmail, telephone: contactTelephone }
        }
      } else if (payload.contractType === ContractType.COLLABORATOR) {
        if (payload.collaborator) {
          payload.collaborator = { ...(payload.collaborator as object), email: contactEmail, telephone: contactTelephone }
        }
      } else if (payload.contractType === ContractType.FINANCIER) {
        if (payload.financier) {
          payload.financier = { ...(payload.financier as object), email: contactEmail, telephone: contactTelephone }
        }
      }
      onSubmit({ data: payload as unknown as Contract, e, defaultContract: contract })
    },
    (error) => console.error(error),
  )

  const submitPreviewStatus = useMemo(() => {
    const hasFile = !!modalFileBase64 || !!modalFile
    const status = hasFile ? ContractStatus.ONGOING : ContractStatus.PENDING
    switch (status) {
      case ContractStatus.PENDING:
        return { label: 'Pendente', className: styles.statusPendente }
      case ContractStatus.ONGOING:
        return { label: 'Em Andamento', className: styles.statusOngoing }
      default:
        return { label: 'Pendente', className: styles.statusPendente }
    }
  }, [modalFile, modalFileBase64])

  const disableWhenIsFinancier = values.contractType === ContractType.FINANCIER

  const homologStatus = useMemo(() => {
    const status = values.contractStatus ?? contract?.contractStatus
    switch (status) {
      case ContractStatus.RASCUNHO:
        return { label: 'Rascunho', className: styles.statusRascunho }
      case ContractStatus.PENDING:
        return { label: 'Pendente', className: styles.statusPendente }
      case ContractStatus.SIGNED:
        return { label: 'Assinado', className: styles.statusAssinado }
      case ContractStatus.ONGOING:
        return { label: 'Em Andamento', className: styles.statusOngoing }
      case ContractStatus.FINISHED:
        return { label: 'Finalizado', className: styles.statusFinalizado }
      case ContractStatus.DISTRATO:
        return { label: 'Distrato', className: styles.statusDistrato }
      default:
        return { label: 'Rascunho', className: styles.statusRascunho }
    }
  }, [values.contractStatus, contract?.contractStatus])

  const contractedTypeLabel =
    values.contractType === ContractType.FINANCIER
      ? 'Financiador'
      : values.contractType === ContractType.COLLABORATOR
        ? 'Colaborador'
        : values.contractType === ContractType.ACT
          ? `ACT · ${actEntityType}`
          : 'Fornecedor'

  const contractedName =
    contract?.supplier?.name || contract?.collaborator?.name || contract?.financier?.name || 'Selecione o contratado'

  const documentLabel =
    values.contractType === ContractType.COLLABORATOR || (values.contractType === ContractType.ACT && actEntityType === 'PF')
      ? contract?.collaborator?.cpf || 'CPF não informado'
      : contract?.supplier?.cnpj || contract?.financier?.cnpj || 'CNPJ não informado'

  const [isContractorOpen, setIsContractorOpen] = useState(!contractorSelected)

  const selectedContractor = useMemo(() => {
    switch (values.contractType) {
      case ContractType.FINANCIER:
        return contract?.financier
      case ContractType.COLLABORATOR:
        return contract?.collaborator
      case ContractType.ACT:
        return actEntityType === 'PF'
          ? contract?.collaborator
          : contract?.supplier
      default:
        return contract?.supplier
    }
  }, [values.contractType, contract, actEntityType])

  const contractorInitials = useMemo(() => {
    const name = selectedContractor?.name || contractedName || ''
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [selectedContractor, contractedName])

  const contractorCategory = useMemo(() => {
    if (values.contractType === ContractType.SUPPLIER || (values.contractType === ContractType.ACT && actEntityType === 'PJ')) {
      return contract?.supplier?.serviceCategory || undefined
    }
    if (values.contractType === ContractType.COLLABORATOR || (values.contractType === ContractType.ACT && actEntityType === 'PF')) {
      return contract?.collaborator?.role || undefined
    }
    return undefined
  }, [values.contractType, contract, actEntityType])

  // Próximo número sequencial de preview (CT ou OS)
  const nextSequentialNumber = useMemo(() => {
    if (typeof window === 'undefined') return '0001'
    const year = values.contractPeriod?.start
      ? new Date(values.contractPeriod.start).getFullYear()
      : new Date().getFullYear()
    const isOS = values.classification === ContractClassification.SERVICE_ORDER
    const prefix = isOS ? 'OS' : 'CT'
    // Para CT, também considera contratos antigos no formato CNT-YYYY-NNNN
    const oldPrefix = isOS ? null : 'CNT'
    const allContracts = localDbGetContracts()
    const sameType = allContracts.filter((c) => {
      if (!c.contractCode) return false
      const hasPrefix = c.contractCode.startsWith(prefix)
      const hasOldPrefix = oldPrefix ? c.contractCode.startsWith(oldPrefix) : false
      return (hasPrefix || hasOldPrefix) && c.contractCode.includes(`-${year}-`)
    })
    const maxSeq = sameType.reduce((max, c) => {
      const regex = isOS
        ? new RegExp(`OS-${year}-(\\d{4})`)
        : new RegExp(`(?:CT|CNT)-${year}-(\\d{4})`)
      const match = c.contractCode?.match(regex)
      return match ? Math.max(max, parseInt(match[1], 10)) : max
    }, 0)
    return String(maxSeq + 1).padStart(4, '0')
  }, [values.classification, values.contractPeriod?.start])

  const partnerAddRoute = useMemo(() => {
    switch (values.contractType) {
      case ContractType.SUPPLIER:
        return '/fornecedores/adicionar'
      case ContractType.COLLABORATOR:
        return '/colaboradores/adicionar'
      case ContractType.FINANCIER:
        return '/financiadores/adicionar'
      case ContractType.ACT:
        return actEntityType === 'PF' ? '/colaboradores/adicionar' : '/fornecedores/adicionar'
      default:
        return '/fornecedores/adicionar'
    }
  }, [values.contractType, actEntityType])

  const autoSaveStatus = useMemo(() => {
    if (isAutoSaving) {
      return { label: 'Salvando', sublabel: '...', variant: 'saving' as const }
    }
    if (lastSavedAt) {
      const seconds = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000)
      if (seconds < 10) {
        return { label: 'Salvo', sublabel: 'agora', variant: 'saved' as const }
      }
      const timeStr = lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      return { label: 'Salvo', sublabel: `às ${timeStr}`, variant: 'saved' as const }
    }
    if (draftId) {
      return { label: 'Rascunho', sublabel: 'recuperado', variant: 'rascunho' as const }
    }
    return { label: 'Rascunho', sublabel: 'não salvo', variant: 'rascunho' as const }
  }, [isAutoSaving, lastSavedAt, draftId])

  const launchFormContent = (
    <Fragment>
      {/* Contratado — CTA vazio ou Hero preenchido */}
      {!contractorSelected ? (
        <Fragment>
          <button
            type="button"
            className={styles.contratadoCta}
            onClick={() => setShowSearchField(true)}
          >
            <span className={styles.contratadoCtaIcon}>
              <Search size={18} />
            </span>
            <span className={styles.contratadoCtaText}>
              <span className={styles.contratadoCtaTop}>Buscar contratado</span>
              <span className={styles.contratadoCtaBot}>Selecione um fornecedor, colaborador ou financiador</span>
            </span>
            <span className={styles.contratadoCtaAction}>Buscar <span>→</span></span>
          </button>
          {showSearchField && (
            <div className={styles.field}>
              {values.contractType === ContractType.ACT && (
                <div
                  style={{
                    display: 'flex',
                    border: '1px solid #e5ded4',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginBottom: 12,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActEntityType('PJ')}
                    style={{
                      flex: 1,
                      padding: '7px',
                      fontSize: '11.5px',
                      fontWeight: actEntityType === 'PJ' ? 600 : 400,
                      background: actEntityType === 'PJ' ? '#fff0db' : '#fff',
                      color: actEntityType === 'PJ' ? '#c25e00' : '#736b61',
                      border: 'none',
                      cursor: 'pointer',
                      borderRight: '1px solid #e5ded4',
                    }}
                  >
                    PJ · CNPJ
                  </button>
                  <button
                    type="button"
                    onClick={() => setActEntityType('PF')}
                    style={{
                      flex: 1,
                      padding: '7px',
                      fontSize: '11.5px',
                      fontWeight: actEntityType === 'PF' ? 600 : 400,
                      background: actEntityType === 'PF' ? '#fff0db' : '#fff',
                      color: actEntityType === 'PF' ? '#c25e00' : '#736b61',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    PF · CPF
                  </button>
                </div>
              )}
              {switchContractedComponent(
                values.contractType === ContractType.ACT
                  ? actEntityType === 'PF'
                    ? ContractType.COLLABORATOR
                    : ContractType.SUPPLIER
                  : values.contractType,
                edit,
                (id) => {
                  setValue(
                    values.contractType === ContractType.FINANCIER
                      ? 'financierId'
                      : values.contractType === ContractType.COLLABORATOR
                        ? 'collaboratorId'
                        : values.contractType === ContractType.ACT && actEntityType === 'PF'
                          ? 'collaboratorId'
                          : 'supplierId',
                    id,
                  )
                  setShowSearchField(false)
                },
                (pix, account) => {
                  setValue('pixInfo', pix, { shouldDirty: true, shouldValidate: true })
                  setValue('bancaryInfo', account, { shouldDirty: true, shouldValidate: true })
                },
                contract,
                true,
                setContractorData,
              )}
            </div>
          )}
          <div className={styles.contratadoCadastrarLink}>
            <span>Não encontrou?</span>
            <button type="button" onClick={() => router.push(partnerAddRoute)}>
              Cadastrar novo contratado →
            </button>
          </div>
        </Fragment>
      ) : (
        <div className={styles.hero}>
          <div className={styles.heroInfo}>
            <div className={styles.overline}>
              Contratado
              <span className={styles.pill}>{contractedTypeLabel}</span>
            </div>
            <h2 className={styles.name}>
              {contractorData?.name || selectedContractor?.name || contractedName}
              {contractorData?.fantasyName || selectedContractor?.fantasyName ? (
                <span className={styles.fantasia}>
                  {contractorData?.fantasyName || selectedContractor?.fantasyName}
                </span>
              ) : null}
            </h2>
            <div className={styles.meta}>
              <span>
                {values.contractType === ContractType.COLLABORATOR
                  ? maskCPF(contractorData?.cpf || selectedContractor?.cpf || documentLabel)
                  : maskCNPJ(contractorData?.cnpj || selectedContractor?.cnpj || documentLabel)}
              </span>
              {contractorData?.serviceCategory || selectedContractor?.serviceCategory || contractorData?.role || selectedContractor?.role ? (
                <span> · {contractorData?.serviceCategory || selectedContractor?.serviceCategory || contractorData?.role || selectedContractor?.role}</span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => {
              setValue('supplierId', null)
              setValue('collaboratorId', null)
              setValue('financierId', null)
              setContractorData(null)
              setShowSearchField(false)
            }}
          >
            Trocar
          </button>
        </div>
      )}

      {/* 1. Dados do Contrato */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Dados do Contrato</h3>
        </div>

        <div className={`${styles.fieldRow} ${styles.cols4}`}>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Classificação da Contratação</label>
            </div>
            <AutoComplete
              error={errors.classification?.message}
              control={control}
              editable={edit}
              options={[
                { id: ContractClassification.CONTRACT, name: ContractClassification.CONTRACT },
                { id: ContractClassification.SERVICE_ORDER, name: ContractClassification.SERVICE_ORDER },
              ]}
              name="classification"
              label="Classificação"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Tipo</label>
            </div>
            <AutoComplete
              error={errors.contractType?.message}
              control={control}
              editable={edit && !parentId}
              options={contractsOp.contractType}
              name="contractType"
              label="Tipo"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Modelo</label>
            </div>
            <AutoComplete
              error={errors.contractModel?.message as string}
              control={control}
              editable={edit}
              options={contractsOp.contractModel}
              name="contractModel"
              label="Modelo"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Origem</label>
            </div>
            <div className={styles.input}>
              <span className={styles.inputValue}>Manual</span>
            </div>
          </div>
        </div>

        <div className={`${styles.fieldRow} ${styles.wide}`}>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Objeto</label>
            </div>
            <CustomTextField
              error={errors.object?.message}
              control={control}
              editable={edit}
              name="object"
              label="Objeto"
            />
          </div>
        </div>

        <div className={`${styles.fieldRow} ${styles.contratoBase}`}>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Valor Original</label>
            </div>
            <CustomTextField
              error={errors.totalValue?.message || serviceOrderValueError}
              control={control}
              editable={edit}
              name="totalValue"
              label="R$ Valor"
              currency
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Início da Vigência</label>
            </div>
            <Controller
              name="contractPeriod.start"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  value={startDateInput}
                  placeholder="dd/mm/aaaa"
                  className={styles.input}
                  disabled={!edit}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
                    let masked = raw
                    if (raw.length > 2) masked = `${raw.slice(0, 2)}/${raw.slice(2)}`
                    if (raw.length > 4) masked = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`
                    setStartDateInput(masked)
                    const parts = masked.split('/')
                    if (parts.length === 3 && parts[2].length === 4) {
                      const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
                      field.onChange(isNaN(date.getTime()) ? null : date)
                    } else {
                      field.onChange(null)
                    }
                  }}
                />
              )}
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Fim da Vigência</label>
            </div>
            <Controller
              name="contractPeriod.end"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  value={endDateInput}
                  placeholder="dd/mm/aaaa"
                  className={styles.input}
                  disabled={!edit}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
                    let masked = raw
                    if (raw.length > 2) masked = `${raw.slice(0, 2)}/${raw.slice(2)}`
                    if (raw.length > 4) masked = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`
                    setEndDateInput(masked)
                    const parts = masked.split('/')
                    if (parts.length === 3 && parts[2].length === 4) {
                      const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]))
                      field.onChange(isNaN(date.getTime()) ? null : date)
                    } else {
                      field.onChange(null)
                    }
                  }}
                />
              )}
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Status Base</label>
            </div>
            <div className={`${styles.input} ${styles.inputCalc}`}>
              <span className={styles.inputValue}>{homologStatus.label}</span>
            </div>
          </div>
        </div>

        <div className={`${styles.fieldRow} ${styles.cols2}`}>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Programa</label>
            </div>
            <AutoComplete
              error={errors.programId?.message as string}
              control={control}
              editable={!disableWhenIsFinancier && edit}
              options={options.Program()?.length ? options.Program() : localDbGetProgramOptions()}
              name="programId"
              label="Programa"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Plano Orçamentário</label>
            </div>
            <AutoComplete
              error={errors.budgetPlanId?.message}
              control={control}
              editable={!disableWhenIsFinancier && edit}
              options={
                options.BudgetPlan()?.length
                  ? options.BudgetPlan()?.filter((op) => op.parentId === values.programId)
                  : localDbGetBudgetPlanOptions().filter((op) => op.parentId === values.programId)
              }
              name="budgetPlanId"
              label="Plano Orçamentário"
            />
          </div>
        </div>

        <div className={`${styles.fieldRow} ${styles.cols2}`}>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Categorização</label>
            </div>
            <StringMultiSelect
              control={control}
              name="categorizacao"
              label="Categorização"
              options={['Avaliação', 'Processo', 'Operacional']}
              editable={edit}
              error={errors.categorizacao?.message}
              placeholder="Selecione uma ou mais"
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Centro de Custo</label>
            </div>
            <StringMultiSelect
              control={control}
              name="centroDeCusto"
              label="Centro de Custo"
              options={['RH', 'Serviços Gerais', 'Eventos']}
              editable={edit}
              error={errors.centroDeCusto?.message}
              placeholder="Selecione um ou mais"
            />
          </div>
        </div>
      </section>

      {/* 3. Dados Bancários */}
      {values.contractType !== ContractType.FINANCIER && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h3>Dados Bancários</h3>
          </div>
          <div className={`${styles.fieldRow} ${styles.bank}`}>
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Banco</label>
              </div>
              <AutoComplete
                control={control}
                editable={edit}
                label="Banco"
                name="bancaryInfo.bank"
                options={options.bankOptions}
                error={errors.bancaryInfo?.bank?.message || errors.bancaryInfo?.root?.message}
              />
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Agência · DV</label>
              </div>
              <AgencyComponent
                control={control}
                editable={edit}
                error={errors.bancaryInfo?.agency?.message || errors.bancaryInfo?.root?.message}
                name="bancaryInfo.agency"
                onChange={(value) => {
                  const parts = value?.replace(/\D/g, '') || ''
                  setValue('bancaryInfo.dv', parts.slice(4, 5), { shouldDirty: true })
                }}
              />
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Conta</label>
              </div>
              <CustomTextField
                error={errors.bancaryInfo?.accountNumber?.message || errors.bancaryInfo?.root?.message}
                control={control}
                editable={edit}
                name="bancaryInfo.accountNumber"
                label="Conta"
              />
            </div>
          </div>
          <div className={`${styles.fieldRow} ${styles.cols2}`}>
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Tipo de chave PIX</label>
              </div>
              <AutoComplete
                error={errors?.pixInfo?.key_type?.message || errors?.pixInfo?.root?.message}
                control={control}
                editable={edit}
                options={options.pixTypes}
                name="pixInfo.key_type"
                label="Tipo"
                aditionalOnChangeBehavior={() => setValue('pixInfo.key', null)}
              />
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Chave PIX</label>
              </div>
              <PixKeyComponent
                control={control}
                editable={edit}
                keyType={values.pixInfo?.key_type ?? ''}
                error={errors?.pixInfo?.key?.message || errors?.pixInfo?.root?.message}
              />
            </div>
          </div>
        </section>
      )}

      {/* 3. Contatos Operacionais */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Contatos Operacionais</h3>
        </div>
        <div className={`${styles.fieldRow} ${styles.cols2}`}>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Email</label>
            </div>
            <input
              type="email"
              className={styles.input}
              placeholder="email@exemplo.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              disabled={!edit}
            />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldLabelRow}>
              <label className={styles.fieldLabel}>Telefone</label>
            </div>
            <input
              type="text"
              className={styles.input}
              placeholder="(00) 00000-0000"
              value={contactTelephone}
              onChange={(e) => setContactTelephone(maskPhone(e.target.value))}
              disabled={!edit}
            />
          </div>
        </div>
      </section>

      {/* 4. Observações Gerais / Notas Internas */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Observações Gerais / Notas Internas</h3>
        </div>
        <Controller
          name="observations"
          control={control}
          render={({ field }) => (
            <textarea
              className={styles.textarea}
              placeholder="Digite observações ou notas internas sobre o contrato..."
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={!edit}
              rows={4}
            />
          )}
        />
      </section>

    </Fragment>
  )

  if (layout === 'launch') {
    return (
      <div className={styles.app}>
        <header className={styles.topbar}>
          <button className={styles.back} title="Voltar" type="button" onClick={() => router.push('/contratos')}>
            <ArrowLeft size={18} />
          </button>
          <h1 className={styles.title}>
            {contract ? 'Continuar Cadastro' : (values.classification === ContractClassification.SERVICE_ORDER ? 'Nova Ordem de Serviço' : 'Novo Contrato')}
            <span className={styles.num}>
              {contract?.contractCode || `${values.classification === ContractClassification.SERVICE_ORDER ? 'OS' : 'CT'} ${nextSequentialNumber}/${values.contractPeriod?.start ? new Date(values.contractPeriod.start).getFullYear() : new Date().getFullYear()}`}
            </span>
          </h1>
          <span className={`${styles.statusPill} ${styles.statusPillPendente}`}>
            <span className={styles.dot} />
            Rascunho
          </span>
        </header>

        <div className={styles.body}>
          <main className={styles.form}>
            {launchFormContent}
          </main>
          <aside className={styles.sidebar}>
            <div className={`${styles.sbHero}`}>
              <div className={styles.sbHeroOverline}>Valor do Contrato</div>
              <div className={`${styles.number} ${!valueFilled ? styles.currency : ''}`}>
                <span className={styles.currency}>R$</span>
                <span className={styles.numberMain}>{amountMain}</span>
                <span className={styles.cents}>,{amountCents}</span>
              </div>
            </div>

            <div>
              <h4>Vigência</h4>
              <div className={styles.datePreview}>
                <div className={styles.dateCol}>
                  <span className={styles.dateKey}>Início</span>
                  <span className={`${styles.dateValue} ${!startDate ? styles.dateEmpty : ''}`}>
                    {startDate || '-'}
                  </span>
                </div>
                <span className={styles.arrow}>→</span>
                <div className={styles.dateCol}>
                  <span className={styles.dateKey}>Fim</span>
                  <span className={`${styles.dateValue} ${!endDate ? styles.dateEmpty : ''}`}>
                    {endDate || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4>Pendências</h4>
              <div className={styles.checklist}>
                {checklist.map((item) => (
                  <div
                    key={item.label}
                    className={`${styles.checkItem} ${item.done ? styles.checkDone : ''}`}
                  >
                    <span className={styles.mark}>{item.done && <Check size={10} />}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className={styles.progress}>
                <span>Concluído</span>
                <span className={styles.progressCount}>{doneCount} / {checklist.length}</span>
              </div>
            </div>
          </aside>
        </div>

        {edit && (
          <footer className={styles.bottombar}>
            <div className={styles.bottomStatus}>
              <span className={styles.saveDot} />
              <span>
                {autoSaveStatus.variant === 'saving'
                  ? 'Salvando rascunho...'
                  : autoSaveStatus.variant === 'saved'
                    ? `Sincronizado · ${autoSaveStatus.sublabel}`
                    : `Rascunho · ${autoSaveStatus.sublabel}`}
              </span>
              <span className={`${styles.statusBadge} ${
                autoSaveStatus.variant === 'saved' ? styles.statusSaved :
                autoSaveStatus.variant === 'saving' ? styles.statusSaving :
                styles.statusRascunho
              }`}>
                {autoSaveStatus.variant === 'saved' ? 'Salvo' : autoSaveStatus.label}
              </span>
            </div>
            <div className={styles.bottomActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                disabled={isDisabled}
                onClick={() => {
                  isNavigatingAwayRef.current = true
                  router.push('/contratos')
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                disabled={isDisabled}
                onClick={() => {
                  isNavigatingAwayRef.current = true
                  beforeUnloadDisabledRef.current = true
                  const draftData = {
                    ...values,
                    contractStatus: ContractStatus.RASCUNHO,
                  }
                  if (draftId) {
                    localDbUpdateContract(draftId, draftData)
                  } else {
                    const saved = localDbSaveContract(draftData)
                    setDraftId(saved.id)
                  }
                  setLastSavedAt(new Date())
                  setDraftId(null)
                  if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('contract_draft_id')
                  }
                  queryClient.invalidateQueries({ queryKey: ['contracts'] })
                  router.push('/contratos')
                }}
              >
                Salvar rascunho
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={isSaveDisabled}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowHomologModal(true)
                }}
              >
                <Plus size={13} />
                {values.classification === ContractClassification.SERVICE_ORDER ? 'Salvar ordem de serviço' : 'Salvar contrato'}
              </button>
            </div>
          </footer>
        )}

        {showHomologModal && (
          <div className={styles.modalOverlay} onClick={() => setShowHomologModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Anexar Contrato Assinado</h3>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    Data de assinatura
                    {modalFile && (
                      <span style={{ color: '#e54d40', fontSize: '9px', marginLeft: 4 }}>*</span>
                    )}
                  </label>
                  <Controller
                    name="dataAssinatura"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="text"
                        {...field}
                        value={field.value || ''}
                        placeholder="dd/mm/aaaa"
                        className={styles.input}
                        disabled={!edit}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
                          let masked = raw
                          if (raw.length > 2) masked = `${raw.slice(0, 2)}/${raw.slice(2)}`
                          if (raw.length > 4) masked = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`
                          field.onChange(masked)
                        }}
                      />
                    )}
                  />
                </div>

                {/* Dropzone de upload */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Documento Principal</label>
                  <label className={styles.uploadDropzone}>
                    <Upload size={18} color="#736b61" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#332e29' }}>
                        {modalFile ? modalFile.name : 'Arraste o arquivo aqui ou clique para buscar'}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#999187', marginTop: '2px' }}>
                        PDF assinado · até 20MB
                      </div>
                    </div>
                    <span className={styles.uploadDropzoneAction}>
                      {modalFile ? 'Trocar' : 'Escolher'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      hidden
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0]
                          setModalFile(file)
                          handleFilesChange([{ id: 1, file }])
                          // Converte para base64 imediatamente para garantir persistência
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            const base64 = reader.result as string
                            setModalFileBase64(base64)
                            setValue('signedContractUrl', base64, { shouldDirty: true })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                  {modalError && (
                    <div className={styles.modalError}>{modalError}</div>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Status que será aplicado</label>
                  <div className={`${styles.statusBadge} ${submitPreviewStatus.className}`}>
                    {submitPreviewStatus.label}
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  className={`${styles.btn} ${styles.btnGhost}`}
                  onClick={() => {
                    setShowHomologModal(false)
                    setModalError('')
                  }}
                >
                  Voltar
                </button>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={async () => {
                    const dataAssinatura = values.dataAssinatura
                    if (modalFile && !dataAssinatura?.trim()) {
                      setModalError('Data de assinatura obrigatória quando há arquivo anexado')
                      return
                    }
                    setModalError('')

                    // Garante que signedContractUrl está no form state antes do submit
                    if (modalFileBase64) {
                      setValue('signedContractUrl', modalFileBase64, { shouldDirty: true })
                    } else if (modalFile) {
                      // Fallback: converte na hora se a conversão anterior falhou ou ainda não terminou
                      try {
                        const base64 = await new Promise<string>((resolve, reject) => {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            if (reader.result) resolve(reader.result as string)
                            else reject(new Error('Falha ao converter arquivo'))
                          }
                          reader.onerror = reject
                          reader.readAsDataURL(modalFile)
                        })
                        setModalFileBase64(base64)
                        setValue('signedContractUrl', base64, { shouldDirty: true })
                      } catch {
                        setModalError('Erro ao processar o PDF. Tente anexar novamente.')
                        return
                      }
                    }

                    submitContract()
                  }}
                >
                  Confirmar e Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="">
      <Card>
        <CardContent className="pt-8">
          <Contracts.Root>
            <Contracts.Info
              control={control}
              editable={edit}
              errors={errors}
              isAditive={!!parentId}
            />
            <Contracts.Vigency
              contractType={values.contractType}
              control={control}
              editable={edit}
              errors={errors}
              values={values as otherContractSchema}
              setValue={setValue}
            />
            {switchContractedComponent(
              values.contractType === ContractType.ACT
                ? actEntityType === 'PF'
                  ? ContractType.COLLABORATOR
                  : ContractType.SUPPLIER
                : values.contractType,
              edit,
              (id) =>
                setValue(
                  values.contractType === ContractType.FINANCIER
                    ? 'financierId'
                    : values.contractType === ContractType.COLLABORATOR
                      ? 'collaboratorId'
                      : values.contractType === ContractType.ACT && actEntityType === 'PF'
                        ? 'collaboratorId'
                        : 'supplierId',
                  id,
                ),
              (pix, account) => {
                setValue('pixInfo', pix)
                setValue('bancaryInfo', account)
              },
              contract,
            )}

            {values.contractType !== ContractType.FINANCIER && (
              <Fragment>
                <Contracts.BancaryData control={control} editable={edit} errors={errors} />
                <Contracts.PixData
                  setValue={setValue}
                  control={control}
                  editable={edit}
                  errors={errors}
                  values={values.pixInfo}
                />
              </Fragment>
            )}

            <Contracts.Files onChange={handleChangeFile} initialValue={contract?.files} />
            <Contracts.ChildsList contract={contract} />
          </Contracts.Root>
        </CardContent>
      </Card>
      {edit && (
        <CardFooter className="border-t border-[#C4DADF] mx-4 flex justify-between py-8 px-0">
          <Contracts.Footer
            create={!mostRecentInfo?.id}
            isDisabled={isDisabled}
            isAditive={!!mostRecentInfo?.parentId}
            contractStatus={mostRecentInfo?.contractStatus}
            setShowModalAlert={setShowModalAlert}
            setShowModalQuestion={setShowModalQuestion}
            onSubmit={handleSubmit(
              (data, e) => onSubmit({ data, e, defaultContract: contract }),
              (error) => console.error(error),
            )}
          />
        </CardFooter>
      )}
      <ModalConfirm
        open={showModalConfirm}
        onClose={() => {
          setShowModalConfirm(false)
          if (errorMessage === '') {
            if (onSaveSuccess) onSaveSuccess()
            else router.push('/contratos')
          }
        }}
        text={
          errorMessage === ''
            ? `${mostRecentInfo?.parentId ? 'Aditivo' : 'Contrato'} ${
                operationType === 'delete' 
                  ? 'deletado' 
                  : operationType === 'edit' 
                  ? 'editado' 
                  : operationType === 'create-aditive'
                  ? 'criado'
                  : 'criado'
              } com sucesso!`
            : errorMessage
        }
        success={errorMessage === ''}
      />
      <ModalQuestion
        open={showModalQuestion}
        onConfirm={() => {
          setShowModalQuestion(false)
          setIsDeleting(false)
          if (onSaveSuccess) onSaveSuccess()
          else router.push('/contratos')
        }}
        onClose={() => {
          setShowModalQuestion(false)
        }}
        text={'Ao confirmar essa opção todas as suas alterações serão perdidas.'}
        textConfirm="Sim, Descartar alterações"
        textCancel="Não Descartar alterações"
      />
      <ModalAlert
        open={showModalAlert}
        onConfirm={() => {
          setIsDeleting(true)
          onDelete(contract?.id, contract?.contractStatus)
        }}
        onClose={() => {
          setShowModalAlert(false)
        }}
        text={`Você está prestes a deletar o contrato de número ${contract?.contractCode}. Tem certeza que deseja continuar?`}
        textConfirm="Sim, tenho certeza"
        textCancel={'Cancelar'}
      />
    </div>
  )
}
