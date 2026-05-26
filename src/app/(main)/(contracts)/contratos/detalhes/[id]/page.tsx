'use client'

import { LoadingScreen } from '@/components/layout/LoadingScreen'
import { ContractModel, ContractStatus, ContractType } from '@/enums/contracts'
import { useGetContractById } from '@/services/contracts'
import { IContract } from '@/types/contracts'
import { formatDate } from '@/utils/dates'
import { maskMonetaryValue } from '@/utils/masks'
import { formatContractNumber } from '@/utils/UI/contracts'
import { deriveStatus, getMostRecentChild } from '@/utils/contracts/status'
import { localDbUpdateContract } from '@/mocks/localDb'
import { ArrowLeft, Download, Eye, Lock, Pencil, Plus } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ModalNovoAditivo, AditivoFormData } from '@/components/modals/contracts/ModalNovoAditivo'
import { ModalPreviewPDF } from '@/components/modals/contracts/ModalPreviewPDF'
import { ModalViewRegistro } from '@/components/modals/contracts/ModalViewRegistro'
import styles from './page.module.css'

export default function ContractDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data, isLoading } = useGetContractById(Number(id))
  const [modalAditivoOpen, setModalAditivoOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [viewRegistroOpen, setViewRegistroOpen] = useState(false)
  const [viewRegistroData, setViewRegistroData] = useState<IContract | null>(null)
  const [viewRegistroIsBase, setViewRegistroIsBase] = useState(false)
  const [viewRegistroSeq, setViewRegistroSeq] = useState<number | undefined>(undefined)
  const [localContract, setLocalContract] = useState<IContract | undefined>(data?.data)
  const [isEditing, setIsEditing] = useState(false)
  const [editEmail, setEditEmail] = useState('')
  const [editTelefone, setEditTelefone] = useState('')
  const [editObservations, setEditObservations] = useState('')

  useEffect(() => {
    if (data?.data) {
      setLocalContract(data.data)
    }
  }, [data?.data])

  const contract = localContract

  useEffect(() => {
    if (contract) {
      setEditEmail((contract.supplier as any)?.email || contract.collaborator?.email || (contract.financier as any)?.email || '')
      setEditTelefone((contract.supplier as any)?.telephone || (contract.financier as any)?.telephone || (contract.collaborator as any)?.telephone || '')
      setEditObservations(contract.observations || '')
    }
  }, [contract])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingScreen />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        Contrato não encontrado
      </div>
    )
  }

  const isSupplier = !!contract.supplier?.id
  const isCollaborator = !!contract.collaborator?.id
  const isFinancier = !!contract.financier?.id

  const contractedName = isSupplier
    ? contract.supplier?.name || 'Não informado'
    : isCollaborator
      ? contract.collaborator?.name || 'Não informado'
      : contract.financier?.name || 'Não informado'

  const contractedTypeLabel =
    contract.contractType === ContractType.FINANCIER
      ? 'PJ · Financiador'
      : contract.contractType === ContractType.COLLABORATOR
        ? 'PF · Colaborador'
        : contract.contractType === ContractType.ACT
          ? isCollaborator
            ? 'ACT · PF'
            : 'ACT · PJ'
          : 'PJ · Fornecedor'

  const documentLabel = isSupplier
    ? contract.supplier?.cnpj || '-'
    : isCollaborator
      ? contract.collaborator?.cpf || '-'
      : contract.financier?.cnpj || '-'

  const children = contract.children ?? []

  // Status derivado unificado com o grid: usa getMostRecentChild + deriveStatus
  const mostRecentInfo = getMostRecentChild(contract)
  const derived = deriveStatus(mostRecentInfo, !!children.length)
  const derivedStatusLabel = derived.label

  const statusClassMap: Record<string, string> = {
    'em-andamento': styles.statusPillVigente,
    'pendente': styles.statusPillPendente,
    'finalizado': styles.statusPillFinalizado,
    'distrato': styles.statusPillDistrato,
  }
  const derivedStatusPillClass = statusClassMap[derived.key] || styles.statusPillVigente

  const docBadgeClassMap: Record<string, string> = {
    'em-andamento': styles.statusVigente,
    'pendente': styles.statusPendente,
    'finalizado': styles.statusFinalizado,
    'distrato': styles.statusDistrato,
  }

  const hasDistratoHomologado = children.some(
    (c) => c.aditivoType === 'distrato' && c.aditivoStatus === 'Homologado'
  )

  // ── Valor Atual: só aditivos HOMOLOGADOS de tipo valor ──
  const aditivosValorHomologados = children.filter(
    (child) =>
      child.aditivoStatus === 'Homologado' &&
      (!child.aditivoType || child.aditivoType === 'valor')
  )
  const totalAditivosValue = aditivosValorHomologados.reduce(
    (acc, child) => acc + (child.totalValue ?? 0),
    0
  )
  const currentValueNumeric = (contract.totalValue ?? 0) + totalAditivosValue
  const currentValue = maskMonetaryValue(currentValueNumeric)

  // ── Vigência: aditivos HOMOLOGADOS de prazo OU distrato ──
  const aditivosPrazoHomologados = children.filter(
    (child) => child.aditivoStatus === 'Homologado' && child.aditivoType === 'prazo'
  )
  const ultimoAditivoPrazo = aditivosPrazoHomologados.sort((a, b) => b.id - a.id)[0]

  // Distrato homologado interrompe a vigência na data de rescisão
  const distratoHomologado = children.find(
    (child) => child.aditivoStatus === 'Homologado' && child.aditivoType === 'distrato'
  )

  let vigenciaAtual = ultimoAditivoPrazo?.contractPeriod ?? contract.contractPeriod
  if (distratoHomologado) {
    vigenciaAtual = {
      start: contract.contractPeriod?.start,
      end: distratoHomologado.contractPeriod?.end ?? contract.contractPeriod?.end,
    }
  }

  const originalValue = maskMonetaryValue(contract.totalValue)
  const nextAditivoNum = `AD ${String(children.length + 1).padStart(2, '0')}`

  const startDate = formatDate(vigenciaAtual?.start)
  const endDate = formatDate(vigenciaAtual?.end)

  const originalStartDate = formatDate(contract.contractPeriod?.start)
  const originalEndDate = formatDate(contract.contractPeriod?.end)

  // ── Cálculo da barra de vigência ──
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const vigStart = vigenciaAtual?.start ? new Date(vigenciaAtual.start) : null
  const vigEnd = vigenciaAtual?.end ? new Date(vigenciaAtual.end) : null
  const isVigenciaEncerrada =
    contract.contractStatus === ContractStatus.FINISHED ||
    contract.contractStatus === ContractStatus.DISTRATO ||
    (vigEnd !== null && today > vigEnd)
  let vigenciaPercent = 0
  if (isVigenciaEncerrada) {
    vigenciaPercent = 100
  } else if (vigStart && vigEnd) {
    const total = vigEnd.getTime() - vigStart.getTime()
    const elapsed = today.getTime() - vigStart.getTime()
    vigenciaPercent = total > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) : 0
  }

  const contractTypeLabel =
    contract.contractType === ContractType.FINANCIER
      ? 'Financiador'
      : contract.contractType === ContractType.COLLABORATOR
        ? 'Colaborador'
        : contract.contractType === ContractType.ACT
          ? isCollaborator
            ? 'ACT · PF'
            : 'ACT · PJ'
          : 'Fornecedor'

  const contractModelLabel =
    contract.contractModel === ContractModel.SERVICE ? 'Serviço' : 'Doação'

  const buildTimeline = () => {
    const events: { dateStr: string; text: string; state: 'current' | 'ok' | 'past'; sortTs: number; tipo?: string }[] = []

    const parseTs = (d: Date | string | undefined): number => {
      if (!d) return 0
      const dt = typeof d === 'string' ? new Date(d) : d
      return isNaN(dt.getTime()) ? 0 : dt.getTime()
    }

    const parseBrDate = (str: string): number => {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return 0
      const [d, m, y] = str.split('/').map(Number)
      return new Date(y, m - 1, d).getTime()
    }

    // Eventos de aditivos
    children.forEach((child, idx) => {
      const num = idx + 1
      const tipo =
        child.aditivoType === 'prazo'
          ? 'Prazo'
          : child.aditivoType === 'valor'
            ? 'Valor'
            : child.aditivoType === 'escopo'
              ? 'Escopo'
              : child.aditivoType === 'outro'
                ? 'Outro'
                : child.aditivoType === 'distrato'
                  ? 'Distrato'
                  : 'Aditivo'

      // Evento 1: Criação em Rascunho
      events.push({
        dateStr: formatDate(child.createdAt) || '-',
        text: `Aditivo ${num} criado em rascunho (${tipo}).`,
        state: 'past',
        sortTs: parseTs(child.createdAt),
        tipo: child.aditivoType || undefined,
      })

      // Evento 2: Movido para Pendente (se aplicável)
      if (child.aditivoStatus === 'Pendente' || child.aditivoStatus === 'Homologado') {
        events.push({
          dateStr: formatDate(child.updatedAt) || formatDate(child.createdAt) || '-',
          text: `Aditivo ${num} movido para Pendente. Aguarda documentação.`,
          state: 'past',
          sortTs: parseTs(child.updatedAt) || parseTs(child.createdAt),
        })
      }

      // Evento 3: Homologado (se aplicável)
      if (child.aditivoStatus === 'Homologado') {
        let desc = ''
        if (child.aditivoType === 'valor') {
          const sinal = (child.totalValue ?? 0) >= 0 ? '+' : ''
          desc = `${sinal}${maskMonetaryValue(child.totalValue ?? 0)}`
        } else if (child.aditivoType === 'prazo') {
          const fim = child.contractPeriod?.end
            ? formatDate(child.contractPeriod.end)
            : '-'
          desc = `vigência estendida até ${fim}`
        } else if (child.aditivoType === 'distrato') {
          desc = 'distrato / rescisão contratual'
        } else if (child.aditivoType === 'escopo' || child.aditivoType === 'outro') {
          desc = 'ajuste de escopo'
        }
        events.push({
          dateStr: child.dataAssinatura || formatDate(child.updatedAt) || '-',
          text: `Aditivo ${num} homologado. ${desc}.`,
          state: 'ok',
          sortTs: parseBrDate(child.dataAssinatura || '') || parseTs(child.updatedAt),
          tipo: child.aditivoType || undefined,
        })
      }
    })

    // Contrato base
    events.push({
      dateStr: formatDate(contract.createdAt) || '-',
      text: 'Contrato criado no sistema.',
      state: 'ok',
      sortTs: parseTs(contract.createdAt),
      tipo: 'base',
    })

    // Vigência encerrada (se contrato finalizado, distrato ou prazo expirado)
    const vigEnd = vigenciaAtual?.end ? new Date(vigenciaAtual.end) : null
    const isEncerrado =
      contract.contractStatus === ContractStatus.FINISHED ||
      contract.contractStatus === ContractStatus.DISTRATO ||
      (vigEnd && new Date() > vigEnd)
    if (isEncerrado && vigEnd) {
      events.push({
        dateStr: formatDate(vigenciaAtual.end) || '-',
        text: `Vigência encerrada em ${formatDate(vigenciaAtual.end)}.`,
        state: 'past',
        sortTs: vigEnd.getTime(),
      })
    }

    // Ordena do mais recente para o mais antigo
    events.sort((a, b) => b.sortTs - a.sortTs)

    // O evento mais recente fica como 'current'
    if (events.length > 0) {
      events[0].state = 'current'
    }

    return events.map((e) => ({ date: e.dateStr, text: e.text, state: e.state, tipo: e.tipo }))
  }

  const timelineItems = buildTimeline()

  const formatDocNumBase = (code: string): string => {
    const match = code.match(/(\d{4})-(\d{4})/)
    if (match) return `CT ${match[2]}/${match[1]}`
    return code
  }

  const formatDocNumAditivo = (code: string, seq: number): string => {
    const match = code.match(/(\d{4})-(\d{4})/)
    if (match) return `AD ${String(seq).padStart(2, '0')}-${match[2]}/${match[1]}`
    return `${code}-A${seq}`
  }

  const openPreview = (url: string, title: string) => {
    setPreviewUrl(url)
    setPreviewTitle(title)
    setPreviewOpen(true)
  }

  const openViewRegistro = (
    data: IContract,
    isBase: boolean,
    seq?: number
  ) => {
    setViewRegistroData(data)
    setViewRegistroIsBase(isBase)
    setViewRegistroSeq(seq)
    setViewRegistroOpen(true)
  }

  const handleUpdateAditivo = (
    aditivoId: number,
    updates: Partial<IContract>
  ) => {
    if (!localContract) return

    setLocalContract((prev) => {
      if (!prev || !prev.children) return prev
      return {
        ...prev,
        children: prev.children.map((child) => {
          if (child.id !== aditivoId) return child
          return {
            ...child,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        }),
      }
    })
  }

  const handleDeleteAditivo = (aditivoId: number) => {
    if (!localContract) return
    setLocalContract((prev) => {
      if (!prev || !prev.children) return prev
      return {
        ...prev,
        children: prev.children.filter((child) => child.id !== aditivoId),
      }
    })
  }

  const handleSaveEdit = () => {
    if (!localContract) return
    const next = { ...localContract }
    if (next.supplier) (next.supplier as any) = { ...next.supplier, email: editEmail }
    if (next.collaborator) (next.collaborator as any) = { ...next.collaborator, email: editEmail }
    if (next.financier) (next.financier as any) = { ...next.financier, email: editEmail }
    if (next.supplier) (next.supplier as any) = { ...next.supplier, telephone: editTelefone }
    if (next.financier) (next.financier as any) = { ...next.financier, telephone: editTelefone }
    next.observations = editObservations
    next.updatedAt = new Date().toISOString()
    setLocalContract(next)
    localDbUpdateContract(next.id, next as any)
    setIsEditing(false)
  }

  const isEditDisabled =
    contract.contractStatus === ContractStatus.FINISHED || hasDistratoHomologado

  const fileToDataUrl = (file: File | null): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!file) return resolve(null)
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }

  const handleCreateAditivo = async (formData: AditivoFormData) => {
    if (!localContract) return

    const novoId =
      (localContract.children?.reduce((max, c) => Math.max(max, c.id), localContract.id) ??
        localContract.id) + 1

    // Converte valor string (R$ 0,00) para número em centavos
    const parseValor = (val: string | undefined): number => {
      if (!val) return 0
      const clean = val.replace(/[^\d]/g, '')
      return clean ? parseInt(clean, 10) : 0
    }

    const valorNumerico =
      formData.tipo === 'valor' && formData.impactoValor
        ? formData.impacto === 'supressao'
          ? -parseValor(formData.impactoValor)
          : parseValor(formData.impactoValor)
        : 0

    const parseDate = (str: string | undefined): Date | undefined => {
      if (!str) return undefined
      const [d, m, y] = str.split('/')
      if (!d || !m || !y) return undefined
      return new Date(`${y}-${m}-${d}T00:00:00.000Z`)
    }

    const dataAssinatura = parseDate(formData.assinatura)
    const dataInicio = parseDate(formData.inicio)
    const dataFim = parseDate(formData.novaDataFim)

    // Converte arquivo para Data URL (base64) para persistir no localStorage
    const fileDataUrl = formData.file ? await fileToDataUrl(formData.file) : ''

    const novoAditivo: any = {
      id: novoId,
      parentId: localContract.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contractType: localContract.contractType,
      object: formData.resumo || `Aditivo ${String(children.length + 1).padStart(2, '0')}`,
      contractPeriod: dataFim
        ? {
            start: dataInicio ?? localContract.contractPeriod?.start ?? new Date(),
            end: dataFim,
          }
        : {
            start: dataInicio ?? localContract.contractPeriod?.start ?? new Date(),
            end: localContract.contractPeriod?.end ?? new Date(),
          },
      totalValue: valorNumerico,
      contractModel: localContract.contractModel,
      supplier: localContract.supplier
        ? {
            id: localContract.supplier.id,
            name: localContract.supplier.name,
            cnpj: localContract.supplier.cnpj,
          }
        : null,
      financier: localContract.financier
        ? {
            id: localContract.financier.id,
            name: localContract.financier.name,
            cnpj: localContract.financier.cnpj,
          }
        : null,
      program: localContract.program
        ? { id: localContract.program.id, name: localContract.program.name }
        : { id: 0, name: '' },
      collaborator: localContract.collaborator
        ? {
            id: localContract.collaborator.id,
            name: localContract.collaborator.name,
            cpf: localContract.collaborator.cpf,
          }
        : null,
      budgetPlan: localContract.budgetPlan
        ? {
            id: localContract.budgetPlan.id,
            scenarioName: localContract.budgetPlan.scenarioName,
            year: localContract.budgetPlan.year,
            version: localContract.budgetPlan.version,
          }
        : { id: 0, scenarioName: '', year: 0, version: 0 },
      contractCode: `${localContract.contractCode}-A${children.length + 1}`,
      contractStatus: ContractStatus.SIGNED,
      withdrawalUrl: formData.tipo === 'distrato' ? fileDataUrl : '',
      settleTermUrl: '',
      signedContractUrl: formData.tipo !== 'distrato' ? fileDataUrl : '',
      pending: 0,
      aditivoType: formData.tipo,
      aditivoStatus: formData.status,
      dataAssinatura: formData.dataRescisao || formData.assinatura || undefined,
      files: [],
      payable: { id: 0 },
      receivable: { id: 0 },
      currentFiles: [],
      pixInfo: undefined,
      bancaryInfo: undefined,
    }

    const updatedContract: any = {
      ...localContract,
      children: [...(localContract.children ?? []), novoAditivo],
    }

    // Se distrato homologado, encerra o contrato base com status Distrato
    if (formData.tipo === 'distrato' && formData.status === 'Homologado') {
      updatedContract.contractStatus = ContractStatus.DISTRATO
      if (formData.dataRescisao) {
        const [d, m, y] = formData.dataRescisao.split('/')
        if (d && m && y) {
          updatedContract.contractPeriod = {
            ...updatedContract.contractPeriod,
            end: new Date(`${y}-${m}-${d}T00:00:00.000Z`),
          }
        }
      }
      updatedContract.withdrawalUrl = novoAditivo.withdrawalUrl
    }

    setLocalContract(updatedContract)
    localDbUpdateContract(localContract.id, updatedContract as any)
  }

  return (
    <div className={styles.page}>
      {/* ═════════ TOPBAR ═════════ */}
      <header className={styles.topbar}>
        <button
          className={styles.back}
          title="Voltar"
          onClick={() => router.push('/contratos')}
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className={styles.title}>
          Contrato <span className={styles.num}>{formatContractNumber(contract.contractCode)}</span>
        </h1>
        <span className={`${styles.statusPill} ${derivedStatusPillClass}`}>
          <span className={styles.dot} />
          {derivedStatusLabel}
        </span>
      </header>

      {/* ═════════ BODY ═════════ */}
      <div className={styles.body}>
        {/* ─── FORM ─── */}
        <main className={`${styles.form} ${isEditing ? styles.editing : ''}`}>
          {/* HERO Contratado */}
          <div className={styles.hero}>
            <div className={styles.heroInfo}>
              <div className={styles.overline}>
                Contratado
                <span className={styles.pill}>{contractedTypeLabel}</span>
              </div>
              <h2 className={styles.name}>
                {contractedName}
                {isSupplier && contract.supplier?.fantasyName && (
                  <span className={styles.fantasia}>· {contract.supplier.fantasyName}</span>
                )}
              </h2>
              <div className={styles.meta}>
                <span>{documentLabel}</span>
              </div>
            </div>
          </div>

          {/* DADOS VIGENTES */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h3>Dados Vigentes</h3>
            </div>
            <div className={`${styles.fieldRow} ${styles.vigentes}`}>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Valor Atual</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${styles.inputCalc} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={styles.inputValue}>{currentValue}</span>
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Vigência Atual</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${styles.inputCalc} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={`${styles.inputValue} ${styles.inputMono}`}>
                    {startDate} → {endDate}
                  </span>
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Status Vigente</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${styles.inputCalc} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={styles.inputValue}>{derivedStatusLabel}</span>
                </div>
              </div>
            </div>
          </section>

          {/* DADOS DO CONTRATO */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h3>Dados do Contrato</h3>
            </div>

            <div className={`${styles.fieldRow} ${styles.cols4}`}>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Tipo</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={styles.inputValue}>{contractTypeLabel}</span>
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Modelo</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={styles.inputValue}>{contractModelLabel}</span>
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Origem</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={styles.inputValue}>Manual</span>
                </div>
              </div>
            </div>

            <div className={`${styles.fieldRow} ${styles.wide}`}>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Objeto</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={styles.inputValue}>{contract.object}</span>
                </div>
              </div>
            </div>

            <div className={`${styles.fieldRow} ${styles.contratoBase}`}>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Valor Original</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={`${styles.inputValue} ${styles.inputMono}`}>
                    {originalValue}
                  </span>
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Início Original</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={`${styles.inputValue} ${styles.inputMono}`}>
                    {originalStartDate}
                  </span>
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Fim Original</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={`${styles.inputValue} ${styles.inputMono}`}>
                    {originalEndDate}
                  </span>
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Status Base</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={styles.inputValue}>{derivedStatusLabel}</span>
                </div>
              </div>
            </div>

            <div className={`${styles.fieldRow} ${styles.cols2}`}>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Programa</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={styles.inputValue}>{contract.program?.name}</span>
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Plano Orçamentário</label>
                  <span className={styles.lockIcon} title="Este campo só pode ser alterado via Aditivo">
                    <Lock size={10} />
                  </span>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={styles.inputValue}>
                    {contract.budgetPlan?.scenarioName} · {contract.budgetPlan?.year}
                  </span>
                </div>
              </div>
            </div>

            <div className={`${styles.fieldRow} ${styles.cols2}`}>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Categorização</label>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={styles.inputValue}>
                    {contract.categorizacao?.length
                      ? contract.categorizacao.join(', ')
                      : '—'}
                  </span>
                </div>
              </div>
              <div className={styles.field}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Centro de Custo</label>
                </div>
                <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                  <span className={styles.inputValue}>
                    {contract.centroDeCusto?.length
                      ? contract.centroDeCusto.join(', ')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* DOCUMENTOS (contrato base + aditivos) */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h3>Documentos</h3>
              <button
                className={styles.action}
                onClick={() => setModalAditivoOpen(true)}
                title="Adicionar novo aditivo"
              >
                + Novo Aditivo
              </button>
            </div>

            <div className={styles.aditivos}>
              <div className={`${styles.aditRow} ${styles.aditHead}`}>
                <span>Nº</span>
                <span>Tipo</span>
                <span>Assinatura</span>
                <span>Resumo</span>
                <span style={{ textAlign: 'right' }}>Impacto</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Doc</span>
              </div>

              {[...children].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)).map((child, idx) => {
                const tipoLabel =
                  child.aditivoType === 'prazo'
                    ? 'Prazo'
                    : child.aditivoType === 'valor'
                      ? 'Valor'
                      : child.aditivoType === 'escopo'
                        ? 'Escopo'
                        : child.aditivoType === 'outro'
                          ? 'Outro'
                          : child.aditivoType === 'distrato'
                            ? 'Distrato'
                            : 'Aditivo'
                const tipoClass =
                  child.aditivoType === 'prazo'
                    ? styles.tipoPrazo
                    : child.aditivoType === 'valor'
                      ? styles.tipoValor
                      : child.aditivoType === 'escopo'
                        ? styles.tipoEscopo
                        : child.aditivoType === 'distrato'
                          ? styles.tipoDistrato
                          : styles.tipoOutro
                const statusLabel = child.aditivoStatus ?? '—'
                const statusClass =
                  child.aditivoStatus === 'Homologado'
                    ? styles.statusHomologado
                    : child.aditivoStatus === 'Pendente'
                      ? styles.statusPendente
                      : child.aditivoStatus === 'Rascunho'
                        ? styles.statusRascunho
                        : styles.statusPendente

                // Impacto conforme tipo
                let impactoText = ''
                let impactoClass = styles.impactoNeutral
                if (child.aditivoType === 'escopo' || child.aditivoType === 'outro') {
                  impactoText = 'sem impacto'
                } else if (child.aditivoType === 'prazo') {
                  const fim = child.contractPeriod?.end
                    ? formatDate(child.contractPeriod.end)
                    : '-'
                  impactoText = `→ ${fim}`
                } else if (child.aditivoType === 'distrato') {
                  impactoText = 'DISTRATO'
                  impactoClass = styles.impactoNeg
                } else if (child.aditivoType === 'valor') {
                  const sinal = (child.totalValue ?? 0) >= 0 ? '+' : ''
                  impactoText = `${sinal}${maskMonetaryValue(child.totalValue ?? 0)}`
                  impactoClass = (child.totalValue ?? 0) < 0 ? styles.impactoNeg : styles.impactoPos
                } else {
                  impactoText = maskMonetaryValue(child.totalValue ?? 0)
                }

                const docUrl = child.signedContractUrl
                const docName = `${child.contractCode}.pdf`

                const seqReal = children.length - idx

                return (
                  <div
                    key={child.id}
                    className={styles.aditRow}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openViewRegistro(child, false, seqReal)}
                  >
                    <span className={styles.aditNum}>{formatDocNumAditivo(contract.contractCode, children.length - idx)}</span>
                    <span className={`${styles.tipoBadge} ${tipoClass}`}>{tipoLabel}</span>
                    <span className={styles.aditData}>
                      {child.dataAssinatura ?? ''}
                    </span>
                    <span className={styles.aditResumo}>{child.object}</span>
                    <span className={`${styles.aditImpacto} ${impactoClass}`}>
                      {impactoText}
                    </span>
                    <span className={`${styles.statusBadge} ${statusClass}`}>
                      {statusLabel}
                    </span>
                    <span className={styles.aditActions}>
                      {child.aditivoType === 'distrato' && child.withdrawalUrl ? (
                        <>
                          <button
                            className={styles.docAct}
                            title="Visualizar termo de distrato"
                            onClick={(e) => {
                              e.stopPropagation()
                              openPreview(child.withdrawalUrl!, `Termo_Distrato_${child.contractCode}.pdf`)
                            }}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className={styles.docAct}
                            title="Baixar termo de distrato"
                            onClick={(e) => {
                              e.stopPropagation()
                              const a = document.createElement('a')
                              a.href = child.withdrawalUrl!
                              a.download = `Termo_Distrato_${child.contractCode}.pdf`
                              a.click()
                            }}
                          >
                            <Download size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className={styles.docAct}
                            title="Visualizar documento"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (docUrl) openPreview(docUrl, docName)
                            }}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className={styles.docAct}
                            title="Baixar documento"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!docUrl) return
                              const a = document.createElement('a')
                              a.href = docUrl
                              a.download = docName
                              a.click()
                            }}
                          >
                            <Download size={13} />
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                )
              })}

              <div
                className={`${styles.aditRow} ${styles.aditBase}`}
                style={{ cursor: 'pointer' }}
                onClick={() => openViewRegistro(contract, true)}
              >
                <span className={styles.aditNum}>{formatDocNumBase(contract.contractCode)}</span>
                <span className={`${styles.tipoBadge} ${styles.tipoBase}`}>Base</span>
                <span className={styles.aditData}>{originalStartDate}</span>
                <span className={styles.aditResumo}>{contract.object}</span>
                <span className={`${styles.aditImpacto} ${styles.impactoBase}`}>
                  {originalValue}
                </span>
                <span className={`${styles.statusBadge} ${
                  contract.signedContractUrl
                    ? styles.statusHomologado
                    : contract.contractStatus === ContractStatus.PENDING
                      ? styles.statusPendente
                      : styles.statusRascunho
                }`}>
                  {contract.signedContractUrl
                    ? 'Homologado'
                    : contract.contractStatus === ContractStatus.PENDING
                      ? 'Pendente'
                      : 'Rascunho'}
                </span>
                <span className={styles.aditActions}>
                  <button
                    className={styles.docAct}
                    title="Visualizar documento"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (contract.signedContractUrl)
                        openPreview(contract.signedContractUrl, `${contract.contractCode}.pdf`)
                    }}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    className={styles.docAct}
                    title="Baixar documento"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!contract.signedContractUrl) return
                      const a = document.createElement('a')
                      a.href = contract.signedContractUrl
                      a.download = `${contract.contractCode}.pdf`
                      a.click()
                    }}
                  >
                    <Download size={13} />
                  </button>
                </span>
              </div>
            </div>
          </section>

          {/* DADOS BANCÁRIOS */}
          {contract.contractType !== ContractType.FINANCIER && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h3>Dados Bancários</h3>
              </div>

              <div className={`${styles.fieldRow} ${styles.bank}`}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Banco</label>
                  <div className={styles.input}>
                    <span className={styles.inputValue}>
                      {contract.bancaryInfo?.bank ?? '-'}
                    </span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Agência · DV</label>
                  <div className={styles.input}>
                    <span className={`${styles.inputValue} ${styles.inputMono}`}>
                      {contract.bancaryInfo?.agency ?? '-'}-{contract.bancaryInfo?.dv ?? '-'}
                    </span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Conta</label>
                  <div className={styles.input}>
                    <span className={`${styles.inputValue} ${styles.inputMono}`}>
                      {contract.bancaryInfo?.accountNumber ?? '-'}
                    </span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>DV</label>
                  <div className={styles.input}>
                    <span className={`${styles.inputValue} ${styles.inputMono}`}>
                      {contract.bancaryInfo?.dv ?? '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`${styles.fieldRow} ${styles.cols2}`}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Tipo de chave PIX</label>
                  <div className={styles.input}>
                    <span className={styles.inputValue}>
                      {contract.pixInfo?.key_type ?? '-'}
                    </span>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Chave PIX</label>
                  <div className={styles.input}>
                    <span className={`${styles.inputValue} ${styles.inputMono}`}>
                      {contract.pixInfo?.key ?? '-'}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* CONTATOS OPERACIONAIS */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h3>Contatos Operacionais</h3>
            </div>
            <div className={`${styles.fieldRow} ${styles.cols2}`}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Email</label>
                {isEditing ? (
                  <div className={styles.inputEditable}>
                    <input
                      className={styles.inputValue}
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                    <span className={styles.inputValue}>{editEmail || '-'}</span>
                  </div>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Telefone</label>
                {isEditing ? (
                  <div className={styles.inputEditable}>
                    <input
                      className={styles.inputValue}
                      type="text"
                      value={editTelefone}
                      onChange={(e) => setEditTelefone(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className={`${styles.input} ${isEditing ? styles.inputReadonly : ''}`}>
                    <span className={styles.inputValue}>{editTelefone || '-'}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* OBSERVAÇÕES GERAIS / NOTAS INTERNAS */}
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h3>Observações Gerais / Notas Internas</h3>
            </div>
            {isEditing ? (
              <textarea
                className={styles.textareaEditable}
                value={editObservations}
                onChange={(e) => setEditObservations(e.target.value)}
                rows={4}
              />
            ) : (
              <div className={styles.textareaReadonly}>
                {contract.observations || 'Nenhuma observação registrada.'}
              </div>
            )}
          </section>
        </main>

        {/* ─── SIDEBAR ─── */}
        <aside className={styles.sidebar}>
          {/* HERO Valor Atual */}
          <div className={styles.sbHero}>
            <div className={styles.sbHeroOverline}>Valor Atual</div>
            <div className={styles.number}>
              <span className={styles.currency}>R$</span>
              <span className={styles.numberMain}>
                {currentValue.replace('R$', '').trim().split(',')[0]}
              </span>
              <span className={styles.cents}>
                ,{currentValue.replace('R$', '').trim().split(',')[1] ?? '00'}
              </span>
            </div>
          </div>

          {/* COMPOSIÇÃO */}
          <div>
            <h4>Composição</h4>
            <div className={styles.composition}>
              <div className={styles.compRow}>
                <span className={styles.compKey}>
                  Valor Original
                </span>
                <span className={styles.compValue}>{originalValue}</span>
              </div>
              {children.map((child, idx) => {
                const isValor = !child.aditivoType || child.aditivoType === 'valor'
                const isHomologado = child.aditivoStatus === 'Homologado'
                const aditivoNum = formatDocNumAditivo(contract.contractCode, idx + 1)

                if (!isValor) {
                  // Aditivos de prazo/escopo/outro não entram na composição de valor
                  return null
                }

                if (!isHomologado) {
                  return (
                    <div key={child.id} className={`${styles.compRow} ${styles.compMuted}`}>
                      <span className={styles.compKey}>
                        Aditivo {idx + 1} · {child.aditivoStatus}
                        <span className={styles.compRef}>não computado</span>
                      </span>
                      <span className={styles.compValue}>
                        {maskMonetaryValue(0)}
                      </span>
                    </div>
                  )
                }

                const isNegativo = (child.totalValue ?? 0) < 0
                const sinal = isNegativo ? '' : '+'
                const compRowClass = isNegativo ? styles.compNeg : styles.compGain
                return (
                  <div key={child.id} className={`${styles.compRow} ${compRowClass}`}>
                    <span className={styles.compKey}>
                      Aditivo {idx + 1}
                      <span className={styles.compRef}>{aditivoNum}</span>
                    </span>
                    <span className={styles.compValue}>
                      {sinal}{maskMonetaryValue(child.totalValue ?? 0)}
                    </span>
                  </div>
                )
              })}
              <div className={`${styles.compRow} ${styles.compTotal}`}>
                <span className={styles.compKey}>Valor Atual</span>
                <span className={styles.compValue}>{currentValue}</span>
              </div>
            </div>
          </div>

          {/* VIGÊNCIA ATUAL */}
          <div>
            <h4>Vigência Atual</h4>
            <div className={styles.vigaBlock}>
              <div className={styles.vigaBar}>
                <div className={styles.vigaFill} style={{ width: `${vigenciaPercent}%` }} />
                {!isVigenciaEncerrada && (
                  <span
                    className={`${styles.vigaMarker} ${styles.vigaMarkerNow}`}
                    style={{ left: `${vigenciaPercent}%` }}
                  >
                    <span style={{ position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', fontFamily: 'ui-monospace, monospace', fontSize: '9px', fontWeight: 600, color: 'var(--teal-deep)', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      hoje
                    </span>
                  </span>
                )}
                <span className={`${styles.vigaMarker} ${styles.vigaMarkerEnd}`} />
              </div>
              <div className={styles.vigaRem}>
                {isVigenciaEncerrada ? (
                  <>
                    Vigência encerrada em <strong>{endDate}</strong>
                  </>
                ) : (
                  <>
                    Vigência de <strong>{startDate}</strong> até <strong>{endDate}</strong>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* TIMELINE */}
          <div>
            <h4>Timeline</h4>
            <div className={styles.timeline}>
              {timelineItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`${styles.tlItem} ${
                    item.state === 'current' ? styles.tlCurrent : item.state === 'ok' ? styles.tlOk : ''
                  } ${
                    item.tipo === 'base'
                      ? styles.tlBase
                      : item.tipo === 'prazo'
                        ? styles.tlPrazo
                        : item.tipo === 'valor'
                          ? styles.tlValor
                          : item.tipo === 'escopo'
                            ? styles.tlEscopo
                            : item.tipo === 'outro'
                              ? styles.tlOutro
                              : item.tipo === 'distrato'
                                ? styles.tlDistrato
                                : ''
                  }`}
                >
                  <div className={styles.tlDate}>{item.date}</div>
                  <div className={styles.tlText}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ═════════ BOTTOMBAR ═════════ */}
      <footer className={styles.bottombar}>
        <div className={styles.bottomStatus}>
          <span className={styles.saveDot} />
          <span>Sincronizado · há 2 min</span>
          <span className={`${styles.statusBadgeFooter} ${derivedStatusPillClass}`}>
            {derivedStatusLabel}
          </span>
        </div>
        <div className={styles.bottomActions}>
          {isEditing ? (
            <>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSaveEdit}
              >
                Salvar alterações
              </button>
            </>
          ) : (
            <button
              className={`${styles.btn} ${styles.btnSecondary} ${isEditDisabled ? styles.btnDisabled : ''}`}
              onClick={() => setIsEditing(true)}
              disabled={isEditDisabled}
            >
              <Pencil size={13} />
              Editar contrato
            </button>
          )}
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => router.push('/contratos/adicionar')}
          >
            <Plus size={13} />
            Novo contrato
          </button>
        </div>
      </footer>

      <ModalNovoAditivo
        open={modalAditivoOpen}
        onClose={() => setModalAditivoOpen(false)}
        contractCode={contract.contractCode}
        nextAditivoNum={nextAditivoNum}
        contractStartDate={formatDate(contract.contractPeriod?.start) || undefined}
        onSubmit={handleCreateAditivo}
      />

      <ModalPreviewPDF
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        url={previewUrl}
        title={previewTitle}
      />

      <ModalViewRegistro
        open={viewRegistroOpen}
        onClose={() => setViewRegistroOpen(false)}
        data={viewRegistroData}
        isBase={viewRegistroIsBase}
        seqNum={viewRegistroSeq}
        onUpdate={handleUpdateAditivo}
        onDelete={handleDeleteAditivo}
      />
    </div>
  )
}
