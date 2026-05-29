'use client'
import {
  Autocomplete,
  Box,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader } from '../../ui/card'
import { BiFilterAlt, BiSearch } from 'react-icons/bi'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MdInfo, MdNavigateBefore, MdNavigateNext } from 'react-icons/md'
import TableCellStyled from '../../table/TableCellStyled'
import useDebounce from '@/utils/use-debounce'
import { LoadingTable } from '../../table/loadingTable'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { saveAs } from 'file-saver'
import { ptBR } from 'date-fns/locale'
import { HttpStatusCode } from 'axios'
import { useQueryClient } from '@tanstack/react-query'

import {
  disabledList,
  educationList,
  genderList,
  programList,
  raceList,
  roleList,
  statusList,
} from '@/utils/enums'
import { LocalizationProvider } from '@mui/x-date-pickers'
import {
  getExportCollaborator,
  getExportCollaboratorTimeline,
  importCollaborators,
  useGetCollaborators,
} from '@/services/collaborator'
import TableHeadCellStyled from '@/components/table/TableHeadCellStyled'
import { ImportCollaboratorsModal, ImportPhase, ImportStatus, ImportSummary } from './ImportCollaboratorsModal'

interface Data {
  id: string
  name: string
  email: string
  occupationArea: string
  contract: string
  role: string
  active: boolean
  status: string
  disableBy: string
}

function createData(
  id: string,
  name: string,
  email: string,
  occupationArea: string,
  contract: string,
  role: string,
  active: boolean,
  status: string,
  disableBy: string,
): Data {
  return {
    id,
    name,
    email,
    occupationArea,
    contract,
    role,
    active,
    status,
    disableBy,
  }
}

interface HeadCell {
  id: keyof Data
  label: string
  align: any
}

const headCells: readonly HeadCell[] = [
  {
    id: 'name',
    align: 'left',
    label: 'REPRESENTANTE LEGAL',
  },
  {
    id: 'email',
    align: 'left',
    label: 'EMAIL',
  },
  {
    id: 'occupationArea',
    align: 'left',
    label: 'ÁREA DE ATUAÇÃO',
  },
  {
    id: 'contract',
    align: 'left',
    label: 'CONTRATOS/ADITIVOS',
  },
  {
    id: 'role',
    align: 'left',
    label: 'FUNÇÃO',
  },
  {
    id: 'active',
    align: 'left',
    label: 'STATUS',
  },
]

const ACCEPTED_IMPORT_EXTENSIONS = ['csv', 'xlsx', 'xls']
const MAX_IMPORT_FILE_SIZE_MB =
  Number(
    process.env.NEXT_PUBLIC_IMPORT_MAX_MB ||
      process.env.NEXT_PUBLIC_MAX_IMPORT_MB ||
      process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ||
      10,
  ) || null

const COLLABORATOR_CSV_TEMPLATE_HEADERS = [
  'nome',
  'nome_contato_emergencia',
  'email',
  'telefone',
  'telefone_contato_emergencia',
  'cpf',
  'rg',
  'status_cadastro',
  'ativo',
  'desativador_por',
  'programa',
  'funcao',
  'inicio_contrato',
  'data_nascimento',
  'endereco_completo',
  'vinculo_empregaticio',
  'identidade_de_genero',
  'raca_cor',
  'alergias',
  'categoria_alimentar',
  'descricao_categoria_alimentar',
  'escolaridade',
  'experiencia_setor_publico',
  'biografia',
  'remuneracao',
  'historico',
]

interface DicionarioEntry {
  campo: string
  descricao: string
  obrigatorio: string
  tipo: string
  formato: string
  valores_aceitos: string
}

const COLLABORATOR_DICIONARIO: DicionarioEntry[] = [
  {
    campo: 'nome',
    descricao: 'Nome completo do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Texto livre',
    valores_aceitos: '',
  },
  {
    campo: 'nome_contato_emergencia',
    descricao: 'Nome do contato de emergencia do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Texto livre',
    valores_aceitos: '',
  },
  {
    campo: 'email',
    descricao: 'Endereco de e-mail do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'exemplo@dominio.com',
    valores_aceitos: '',
  },
  {
    campo: 'telefone',
    descricao: 'Numero de telefone do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: '(XX) XXXXX-XXXX',
    valores_aceitos: '',
  },
  {
    campo: 'telefone_contato_emergencia',
    descricao: 'Numero de telefone do contato de emergencia',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: '(XX) XXXXX-XXXX',
    valores_aceitos: '',
  },
  {
    campo: 'cpf',
    descricao: 'CPF do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'XXX.XXX.XXX-XX',
    valores_aceitos: '',
  },
  {
    campo: 'rg',
    descricao: 'RG do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Texto livre',
    valores_aceitos: '',
  },
  {
    campo: 'status_cadastro',
    descricao: 'Situacao cadastral do colaborador no sistema',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Valor fixo',
    valores_aceitos: 'PRE_CADASTRO | CADASTRO_COMPLETO',
  },
  {
    campo: 'ativo',
    descricao: 'Indica se o colaborador esta ativo',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Valor fixo',
    valores_aceitos: 'Sim | Nao',
  },
  {
    campo: 'desativador_por',
    descricao: 'Motivo da desativacao do colaborador. Use N/A quando ativo = Sim',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Valor fixo',
    valores_aceitos: 'DESLIGAMENTO_ABC | FALECIMENTO | TEMPO_CONTRATO_FINALIZADO | SOLICITACAO_RESCISAO_CONTRATUAL',
  },
  {
    campo: 'programa',
    descricao: 'Programa ao qual o colaborador esta vinculado',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Valor fixo',
    valores_aceitos: 'EPV | PARC',
  },
  {
    campo: 'funcao',
    descricao: 'Cargo ou funcao do colaborador dentro do programa',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Texto livre',
    valores_aceitos: '',
  },
  {
    campo: 'inicio_contrato',
    descricao: 'Data de inicio do contrato do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Data',
    formato: 'DD/MM/AAAA',
    valores_aceitos: '',
  },
  {
    campo: 'data_nascimento',
    descricao: 'Data de nascimento do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Data',
    formato: 'DD/MM/AAAA',
    valores_aceitos: '',
  },
  {
    campo: 'endereco_completo',
    descricao: 'Endereco completo do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Texto livre',
    valores_aceitos: '',
  },
  {
    campo: 'vinculo_empregaticio',
    descricao: 'Tipo de vinculo empregaticio do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Valor fixo',
    valores_aceitos: 'CLT | PJ',
  },
  {
    campo: 'identidade_de_genero',
    descricao: 'Identidade de genero do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Valor fixo',
    valores_aceitos: 'HOMEM_CIS | MULHER_CIS | HOMEM_TRANS | MULHER_TRANS | NAO_BINARIO | OUTRO',
  },
  {
    campo: 'raca_cor',
    descricao: 'Raca ou cor autodeclarada do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Valor fixo',
    valores_aceitos: 'BRANCO | PRETO | PARDO | AMARELO | INDIGENA',
  },
  {
    campo: 'alergias',
    descricao: 'Alergias do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Texto livre',
    valores_aceitos: '',
  },
  {
    campo: 'categoria_alimentar',
    descricao: 'Categoria alimentar do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Valor fixo',
    valores_aceitos: 'ONIVORO | VEGETARIANO | VEGANO | OUTRO',
  },
  {
    campo: 'descricao_categoria_alimentar',
    descricao: 'Descricao adicional sobre a categoria alimentar',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Texto livre',
    valores_aceitos: '',
  },
  {
    campo: 'escolaridade',
    descricao: 'Nivel de escolaridade do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Valor fixo',
    valores_aceitos: 'ENSINO_MEDIO | ENSINO_SUPERIOR | POS_GRADUACAO | MESTRADO | DOUTORADO',
  },
  {
    campo: 'experiencia_setor_publico',
    descricao: 'Indica se o colaborador possui experiencia no setor publico',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Valor fixo',
    valores_aceitos: 'Sim | Nao',
  },
  {
    campo: 'biografia',
    descricao: 'Biografia ou descricao do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'Texto livre',
    valores_aceitos: '',
  },
  {
    campo: 'remuneracao',
    descricao: 'Remuneracao do colaborador',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: 'R$ X.XXX,XX',
    valores_aceitos: '',
  },
  {
    campo: 'historico',
    descricao: 'Historico retroativo do colaborador importado de outro sistema. Cada evento deve estar entre chaves {}. Se o colaborador nao possui historico retroativo, preencher apenas com {} para evitar erro de importacao',
    obrigatorio: 'Sim',
    tipo: 'Texto',
    formato: '{evento 1}{evento 2}{evento 3} ou {} quando sem historico',
    valores_aceitos: '',
  },
]

function generateDicionarioCSV(): Blob {
  const header = 'campo,descricao,obrigatorio,tipo,formato,valores_aceitos'
  const rows = COLLABORATOR_DICIONARIO.map((entry) => {
    const values = [
      entry.campo,
      entry.descricao,
      entry.obrigatorio,
      entry.tipo,
      entry.formato,
      entry.valores_aceitos,
    ].map((v) => (v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v))
    return values.join(',')
  })
  return new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
}

interface EnhancedTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void
  order: 'asc' | 'desc'
  orderBy: string
  rowCount: number
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { order, orderBy, onRequestSort } = props
  const createSortHandler = (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property)
  }

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableHeadCellStyled
            key={headCell.id}
            align={headCell.align}
            // sortDirection={orderBy === headCell.id ? order : false}
          >
            {/* {headCell.id === 'name' ? (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={order === 'asc' ? 'desc' : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc'
                      ? 'sorted descending'
                      : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            ) : ( */}
            <div style={{ fontWeight: 600 }}>{headCell.label}</div>
            {/* )} */}
          </TableHeadCellStyled>
        ))}
      </TableRow>
    </TableHead>
  )
}

export default function CollaboratorsTable() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [search, setSearch] = useState('')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [orderBy] = useState('name')
  const [page, setPage] = useState(1)
  const [qntPage, setQntPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [disablePrev, setDisablePrev] = useState(true)
  const [disableNext, setDisableNext] = useState(false)
  const [rows, setRows] = useState<Data[]>([])
  const [openFilter, setOpenFilter] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>()
  const [selectedEducation, setSelectedEducation] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<Date | null>()
  const [selectedRace, setSelectedRace] = useState<string[]>([])
  const [selectedDisabled, setSelectedDisabled] = useState<string[]>([])
  const [selectedProgram, setSelectedProgram] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<string[]>([])
  const [selectedGender, setSelectedGender] = useState<string[]>([])
  const [selectedAge, setSelectedAge] = useState<string>()
  const [selectedEmployment, setSelectedEmployment] = useState<string[]>([])
  const [selectedSituation, setSelectedSituation] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<number | null>()
  const [filterEducation, setFilterEducation] = useState<string[]>([])
  const [filterYear, setFilterYear] = useState<string | null>()
  const [filterRace, setFilterRace] = useState<string[]>([])
  const [filterDisabled, setFilterDisabled] = useState<string[]>([])
  const [filterProgram, setFilterProgram] = useState<string[]>([])
  const [filterRole, setFilterRole] = useState<string[]>([])
  const [filterGender, setFilterGender] = useState<string[]>([])
  const [filterAge, setFilterAge] = useState<string>()
  const [filterEmployment, setFilterEmployment] = useState<string[]>([])
  const [filterSituation, setFilterSituation] = useState<string[]>([])
  const [listRoles, setListRoles] = useState<string[]>([])
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importPhase, setImportPhase] = useState<ImportPhase>(null)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [errorBlob, setErrorBlob] = useState<Blob | null>(null)
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false)
  const [importErrors, setImportErrors] = useState<
    Array<{ line: number; message: string; rowData?: Record<string, any> }>
  >([])
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null)
  const debouncedSearchTerm = useDebounce(searchTerm, 1000)

  const { data, isLoading: isLoadingUsers } = useGetCollaborators({
    page,
    limit,
    search,
    age: filterAge,
    yearOfContract: filterYear,
    genderIdentities: filterGender,
    breeds: filterRace,
    educations: filterEducation,
    status: filterSituation,
    occupationAreas: filterProgram,
    employmentRelationships: filterEmployment,
    disableBy: filterDisabled,
    roles: filterRole,
    active: filterStatus,
  })

  useEffect(() => {
    const list = [] as Data[]

    setQntPage(data?.meta?.totalPages)

    data?.items?.forEach((x: Data) => {
      list.push(
        createData(
          x.id,
          x.name,
          x?.email,
          x?.occupationArea,
          x?.contract,
          x.role,
          x.active,
          x.status,
          x.disableBy,
        ),
      )
    })
    setRows(list)
  }, [data?.items, data?.meta?.totalPages])

  useEffect(() => {
    setDisablePrev(page === 1)
    setDisableNext(page === qntPage)
  }, [qntPage, page])

  const handleRequestSort = (_event: React.MouseEvent<unknown>, property: keyof Data) => {
    const isAsc = order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    // setSelectedColumn(property)
  }

  const handleChangePage = (direction: string) => {
    if (direction === 'prev') {
      setPage(page - 1)
    } else {
      setPage(page + 1)
    }
  }

  const handleChangeLimit = (event: any) => {
    setLimit(parseInt(event.target.value))
    setPage(1)
  }

  const handleImportButtonClick = () => {
    fileInputRef.current?.click()
  }

  const resetImportState = () => {
    setImportSummary(null)
    setImportMessage(null)
    setErrorBlob(null)
    setImportErrors([])
    setOriginalFile(null)
  }

  const closeImportModal = () => {
    if (importStatus === 'inProgress') return
    setIsImportModalOpen(false)
    setImportStatus('idle')
    setImportPhase(null)
  }

  const extractSummary = (
    data: any,
  ): ImportSummary & {
    errors?: Array<{ line: number; message: string; rowData?: Record<string, any> }>
  } => {
    if (!data || typeof data !== 'object') return {}

    const summaryData = data.summary || data
    const success =
      summaryData.success ??
      summaryData.successCount ??
      summaryData.imported ??
      summaryData.importedCount ??
      summaryData.importedLines ??
      summaryData.successLines ??
      (data.imported !== undefined ? data.imported : undefined)

    // Se errors é um array, conta o tamanho; se é número, usa o número
    const errorsArray = Array.isArray(data.errors)
      ? data.errors
      : Array.isArray(summaryData.errors)
        ? summaryData.errors
        : null
    const failed =
      summaryData.failed ??
      summaryData.failedCount ??
      summaryData.errorsCount ??
      summaryData.errorLines ??
      (errorsArray ? errorsArray.length : undefined) ??
      (typeof summaryData.errors === 'number' ? summaryData.errors : undefined) ??
      (typeof data.errors === 'number' ? data.errors : undefined)

    const total =
      summaryData.total ??
      summaryData.totalCount ??
      summaryData.totalLines ??
      (typeof success === 'number' || typeof failed === 'number'
        ? (typeof success === 'number' ? success : 0) + (typeof failed === 'number' ? failed : 0)
        : undefined)

    return {
      success: typeof success === 'number' ? success : undefined,
      failed: typeof failed === 'number' ? failed : undefined,
      total: typeof total === 'number' ? total : undefined,
      message: summaryData.message ?? data.message ?? null,
      limitMb: summaryData.limitMb ?? summaryData.limit ?? data.limit ?? null,
      errorFileName: summaryData.errorFileName ?? summaryData.fileName ?? undefined,
      errors: errorsArray || undefined,
    }
  }

  const buildImportOutcome = (
    result: Awaited<ReturnType<typeof importCollaborators>>,
  ): {
    status: ImportStatus
    summary: ImportSummary | null
    message?: string | null
    errorFile?: Blob | null
    shouldRefresh?: boolean
    errors?: Array<{ line: number; message: string; rowData?: Record<string, any> }>
  } => {
    const summaryData = extractSummary(result.jsonData)
    const hasSummary =
      summaryData.success !== undefined ||
      summaryData.failed !== undefined ||
      summaryData.total !== undefined ||
      summaryData.message ||
      summaryData.limitMb
    const baseSummary = hasSummary ? { ...summaryData } : null
    // Remove errors do summary antes de passar para o modal
    if (baseSummary && 'errors' in baseSummary) {
      delete (baseSummary as any).errors
    }
    const successCount = summaryData.success ?? 0
    const failedCount = summaryData.failed ?? 0
    const errorsArray = summaryData.errors || []
    const hasErrors = errorsArray.length > 0
    const totalCount =
      summaryData.total ??
      (successCount || failedCount ? successCount + failedCount : undefined)
    const contentType = result.headers?.['content-type'] || ''
    const hasFilePayload =
      (contentType && !contentType.includes('application/json')) || !result.jsonData

    // Arquivo muito grande
    if (result.status === HttpStatusCode.PayloadTooLarge) {
      return {
        status: 'fileTooLarge',
        summary: { ...(baseSummary || {}), limitMb: summaryData.limitMb ?? MAX_IMPORT_FILE_SIZE_MB },
        message: null,
        errorFile: null,
        shouldRefresh: false,
      }
    }

    // Erro 400: Formato inválido ou arquivo vazio
    if (result.status === HttpStatusCode.BadRequest) {
      return {
        status: 'fileError',
        summary: baseSummary,
        message: summaryData.message,
        errorFile: null,
        shouldRefresh: false,
        errors: errorsArray,
      }
    }

    // Se a API retornou dados, verificar success e errors
    if (result.jsonData) {
      const apiSuccess = result.jsonData.success === true
      const isPartialImport = result.jsonData.isPartialImport === true

      // Importação parcial: isPartialImport = true OU (success = true com erros)
      if (isPartialImport || (apiSuccess && hasErrors && successCount > 0)) {
        return {
          status: 'partial',
          summary:
            baseSummary || {
            success: successCount,
            failed: failedCount,
            total: totalCount ?? successCount + failedCount,
          },
          message: null,
          errorFile: hasFilePayload ? result.blob : null,
          shouldRefresh: true,
          errors: errorsArray,
        }
      }

      // Sucesso total: success = true e sem erros
      if (apiSuccess && !hasErrors && successCount > 0) {
        return {
          status: 'success',
          summary: baseSummary || { success: successCount, total: totalCount ?? successCount },
          message: null,
          errorFile: null,
          shouldRefresh: true,
        }
      }

      // Falha total: tem erros mas nenhum sucesso
      if (hasErrors && successCount === 0) {
        return {
          status: 'fail',
          summary:
            baseSummary || {
            failed: failedCount || errorsArray.length,
            total: totalCount ?? errorsArray.length,
          },
          message: null,
          errorFile: hasFilePayload ? result.blob : null,
          shouldRefresh: false,
          errors: errorsArray,
        }
      }
    }

    // Status 200-299 sem erros: sucesso
    if (result.status >= 200 && result.status < 300 && !hasErrors) {
      return {
        status: 'success',
        summary: baseSummary || { total: totalCount },
        message: null,
        errorFile: null,
        shouldRefresh: true,
      }
    }

    // Fallback: falha genérica
    return {
      status: 'fail',
      summary:
        baseSummary || {
        failed: failedCount || errorsArray.length || undefined,
        total: totalCount ?? (failedCount || errorsArray.length || undefined),
      },
      message: summaryData.message,
      errorFile: hasFilePayload ? result.blob : null,
      shouldRefresh: false,
      errors: errorsArray,
    }
  }

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (event.target.value) event.target.value = ''
    if (!file) return

    setIsImportModalOpen(true)
    setImportStatus('inProgress')
    setImportPhase('validating')
    resetImportState()

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !ACCEPTED_IMPORT_EXTENSIONS.includes(extension)) {
      setImportStatus('fileError')
      setImportPhase(null)
      setImportMessage(
        'Utilize um arquivo CSV ou Excel (.csv ou .xlsx) separado por ponto e vírgula.',
      )
      return
    }

    if (file.size === 0) {
      setImportStatus('fileError')
      setImportPhase(null)
      return
    }

    if (MAX_IMPORT_FILE_SIZE_MB && file.size > MAX_IMPORT_FILE_SIZE_MB * 1024 * 1024) {
      setImportStatus('fileTooLarge')
      setImportPhase(null)
      setImportSummary({ limitMb: MAX_IMPORT_FILE_SIZE_MB })
      return
    }

    setImportPhase('processing')
    setImportMessage(null)
    setOriginalFile(file)

    try {
      const result = await importCollaborators(file)
      const outcome = buildImportOutcome(result)
      setImportStatus(outcome.status)
      setImportPhase(null)
      setImportSummary(outcome.summary || null)
      setImportMessage(outcome.message || null)
      setErrorBlob(outcome.errorFile || null)
      setImportErrors(outcome.errors || [])

      if (outcome.shouldRefresh) {
        queryClient.invalidateQueries({ queryKey: ['collaborators'] })
      }
    } catch (error) {
      setImportPhase(null)
      setImportStatus('fail')
      setImportMessage(
        (error as Error)?.message ||
          'Não foi possível concluir a importação. Verifique o arquivo e tente novamente.',
      )
    }
  }

  const generateErrorCSVFromRowData = (
    errors: Array<{ line: number; message: string; rowData?: Record<string, any> }>,
  ): Blob => {
    if (errors.length === 0) {
      throw new Error('Nenhum erro encontrado')
    }

    // Pegar o primeiro erro para obter as chaves (cabeçalho)
    const firstError = errors[0]
    if (!firstError.rowData) {
      throw new Error('Dados das linhas não disponíveis. A API deve retornar rowData em cada erro.')
    }

    // Obter todas as chaves únicas de todos os rowData
    const allKeys = new Set<string>()
    errors.forEach((error) => {
      if (error.rowData) {
        Object.keys(error.rowData).forEach((key) => allKeys.add(key))
      }
    })

    // Ordenar as chaves para manter consistência
    const headers = Array.from(allKeys)

    // Criar linha de cabeçalho
    const headerLine = headers.join(';')

    // Criar linhas de dados
    const dataLines = errors
      .filter((error) => error.rowData)
      .map((error) => {
        return headers
          .map((key) => {
            const value = error.rowData![key]
            // Escapar valores que contêm ponto e vírgula ou quebras de linha
            if (value === null || value === undefined) return ''
            const stringValue = String(value)
            // Se contém ponto e vírgula, aspas ou quebra de linha, envolver em aspas
            if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          .join(';')
      })

    // Combinar cabeçalho + dados
    const csvContent = [headerLine, ...dataLines].join('\n')
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  }

  const handleDownloadErrors = async () => {
    setIsDownloadingErrors(true)
    try {
      // Se já temos um blob de erro da API, usar ele
      if (errorBlob && errorBlob.size > 0) {
        const fileName =
          importSummary?.errorFileName ||
          (originalFile?.name
            ? `erros-${originalFile.name.replace(/\.(csv|xlsx|xls)$/i, '.csv')}`
            : 'erros-importacao-colaboradores.csv')
        saveAs(errorBlob, fileName)
        return
      }

      // Se temos erros com rowData, gerar CSV a partir dos dados
      if (importErrors.length > 0 && importErrors.some((e) => e.rowData)) {
        const errorCSV = generateErrorCSVFromRowData(importErrors)
        const fileName = originalFile?.name
          ? `erros-${originalFile.name.replace(/\.(csv|xlsx|xls)$/i, '.csv')}`
          : 'erros-importacao-colaboradores.csv'
        saveAs(errorCSV, fileName)
        return
      }

      // Fallback: tentar usar arquivo original se disponível
      if (importErrors.length > 0 && originalFile) {
        console.warn(
          'rowData não disponível nos erros. A API deve retornar rowData em cada erro para gerar o arquivo de correção.',
        )
        // Não podemos gerar o CSV sem rowData, então apenas avisar
        alert(
          'Não foi possível gerar o arquivo de erros automaticamente. Verifique se a API está retornando rowData em cada erro.',
        )
        return
      }

      console.warn('Não foi possível gerar arquivo de erros: faltam dados')
    } catch (error) {
      console.error('Erro ao gerar arquivo de erros:', error)
      alert('Erro ao gerar arquivo de erros. Verifique o console para mais detalhes.')
    } finally {
      setIsDownloadingErrors(false)
    }
  }

  const setRow = (row: Data, index: number) => {
    const labelId = `enhanced-table-checkbox-${index}`
    return (
      <TableRow
        id={'collaborator' + row.id}
        key={labelId}
        tabIndex={-1}
        className="hover:bg-[#F6FAFB]"
        onClick={() => router.push(`/colaboradores/detalhes/${row?.id}`)}
      >
        <TableCellStyled border={false}>{row.name}</TableCellStyled>
        <TableCellStyled>{row.email}</TableCellStyled>
        <TableCellStyled>{row.occupationArea}</TableCellStyled>
        <TableCellStyled>{row.contract}</TableCellStyled>
        <TableCellStyled>{row.role}</TableCellStyled>
        <TableCellStyled>
          <div className="flex items-center">
            <div
              className={`mr-1 py-[5px] px-2 rounded-md ${
                row.active ? 'border border-erp-success' : 'bg-erp-gradient'
              }`}
            >
              {row.active ? 'Ativo' : 'Inativo'}
            </div>
            {row.status === 'CADASTRO_COMPLETO' && !row.active && (
              <Tooltip title={disabledList[row?.disableBy]} placement="top-end" arrow>
                <IconButton>
                  <MdInfo size={20} color={'#000'} />
                </IconButton>
              </Tooltip>
            )}
          </div>
          {statusList[row.status]}
        </TableCellStyled>
      </TableRow>
    )
  }

  const handleFilter = () => {
    if (selectedStatus === 'Ativo') setFilterStatus(1)
    else if (selectedStatus === 'Inativo') setFilterStatus(0)
    else setFilterStatus(null)
    setFilterEducation(selectedEducation)
    setFilterYear(selectedYear ? selectedYear?.getFullYear().toString() : null)
    setFilterRace(selectedRace)
    setFilterDisabled(selectedDisabled)
    setFilterProgram(selectedProgram)
    setFilterRole(selectedRole)
    setFilterGender(selectedGender)
    setFilterAge(selectedAge)
    setFilterEmployment(selectedEmployment)
    setFilterSituation(selectedSituation)
    setPage(1)
  }

  useEffect(() => {
    if (debouncedSearchTerm) {
      setSearch(debouncedSearchTerm)
    } else setSearch('')

    setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm])

  const getListRoles = () => {
    let list = [] as string[]
    selectedProgram?.forEach((program) => {
      list = list.concat(list, roleList[program])
      // list.push(roleList[program])
    })

    setListRoles(list)
    // return list
  }

  useEffect(() => {
    getListRoles()
  }, [selectedProgram])

  const exportFilters = {
    page: 1,
    limit: 9999999,
    search,
    age: filterAge,
    yearOfContract: filterYear,
    genderIdentities: filterGender,
    breeds: filterRace,
    educations: filterEducation,
    status: filterSituation,
    occupationAreas: filterProgram,
    employmentRelationships: filterEmployment,
    disableBy: filterDisabled,
    roles: filterRole,
    active: filterStatus,
  }

  const handleExport = async () => {
    setExportMenuAnchor(null)
    const resp = await getExportCollaborator(exportFilters)
    saveAs(resp?.data, 'Colaboradores.csv')
    saveAs(generateDicionarioCSV(), 'colaboradores_dicionario.csv')
  }

  const handleExportTimeline = async () => {
    setExportMenuAnchor(null)
    const resp = await getExportCollaboratorTimeline(exportFilters)
    saveAs(resp?.data, 'Colaboradores-Historico.csv')
  }

  const handleExportTemplate = () => {
    setExportMenuAnchor(null)
    const csvContent = COLLABORATOR_CSV_TEMPLATE_HEADERS.join(',')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, 'Template-Colaboradores.csv')
  }

  return (
    <div>
      <Card className="overflow-hidden">
        <CardHeader data-text="" className="p-4 flex items-center flex-row justify-between">
          <div className="flex items-center">
            <Button
              data-test="filter"
              size="none"
              variant="erpReturn"
              className="border-[#E0E4E4] me-4"
              onClick={() => setOpenFilter(!openFilter)}
            >
              <BiFilterAlt size={20} color={'#155366'} />
            </Button>
            <TextField
              name="search"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              label="Pesquise"
              size="small"
              sx={{ backgroundColor: '#fff', width: 392 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BiSearch size={20} color={'#155366'} />
                  </InputAdornment>
                ),
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="erpSecondary"
              onClick={handleImportButtonClick}
              type="button"
              style={{ display: 'block' }}
            >
              Importar CSV/Excel
            </Button>
            <Button
              data-test="add"
              variant="erpPrimary"
              onClick={() => router.push('/colaboradores/adicionar')}
            >
              Adicionar Colaborador
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleImportFileChange}
            />
          </div>
        </CardHeader>
        {openFilter && (
          <div className="bg-[#F6FAFB] grid gap-4 grid-cols-7 p-4 w-full">
            <Autocomplete
              id="education"
              multiple
              size="small"
              noOptionsText="Escolaridade"
              value={selectedEducation}
              options={Object.keys(educationList)}
              getOptionLabel={(option) => educationList[option]}
              onChange={(_event, newValue) => {
                setSelectedEducation(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Escolaridade"
                  sx={{
                    backgroundColor: '#fff',
                  }}
                />
              )}
            />
            <Autocomplete
              id="race"
              size="small"
              multiple
              noOptionsText="Raça"
              value={selectedRace}
              options={Object.keys(raceList)}
              getOptionLabel={(option) => raceList[option]}
              onChange={(_event, newValue) => {
                setSelectedRace(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Raça"
                  sx={{
                    backgroundColor: '#fff',
                  }}
                />
              )}
            />
            <div>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label={'Ano de Contrato'}
                  openTo="year"
                  views={['year']}
                  value={selectedYear}
                  onChange={setSelectedYear}
                  sx={{
                    backgroundColor: '#fff',
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </LocalizationProvider>
            </div>
            <Autocomplete
              id="disabled"
              size="small"
              multiple
              noOptionsText="Desativado por"
              value={selectedDisabled}
              options={Object.keys(disabledList)}
              getOptionLabel={(option) => disabledList[option]}
              onChange={(_event, newValue) => {
                setSelectedDisabled(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Desativado por"
                  sx={{
                    backgroundColor: '#fff',
                  }}
                />
              )}
            />
            <Autocomplete
              id="program"
              size="small"
              noOptionsText="Programa"
              multiple
              value={selectedProgram}
              options={programList}
              // getOptionLabel={(option) => option.name}
              onChange={(_event, newValue) => {
                setSelectedProgram(newValue)
                setSelectedRole([])
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Programa"
                  sx={{
                    backgroundColor: '#fff',
                  }}
                />
              )}
            />
            <Autocomplete
              id="role"
              size="small"
              noOptionsText="Função"
              multiple
              value={selectedRole}
              options={listRoles}
              onChange={(_event, newValue) => {
                setSelectedRole(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Função"
                  sx={{
                    backgroundColor: '#fff',
                  }}
                />
              )}
              disabled={selectedProgram.length === 0}
            />
            <Autocomplete
              id="gender"
              size="small"
              multiple
              noOptionsText="Identidade de Gênero"
              value={selectedGender}
              options={Object.keys(genderList)}
              getOptionLabel={(option) => genderList[option]}
              onChange={(_event, newValue) => {
                setSelectedGender(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Identidade de Gênero"
                  sx={{
                    backgroundColor: '#fff',
                  }}
                />
              )}
            />
            {/* </div>
            <div className="flex"> */}
            <div>
              <Autocomplete
                id="status"
                size="small"
                noOptionsText="Status"
                value={selectedStatus}
                options={['Ativo', 'Inativo']}
                // getOptionLabel={(option) => option.name}
                onChange={(_event, newValue) => {
                  setSelectedStatus(newValue)
                }}
                renderInput={(params) => <TextField {...params} label="Status" />}
                sx={{
                  backgroundColor: '#fff',
                }}
              />
            </div>
            <Autocomplete
              id="situation"
              size="small"
              multiple
              noOptionsText="Situação Cadastral"
              value={selectedSituation}
              options={Object.keys(statusList)}
              getOptionLabel={(option) => statusList[option]}
              onChange={(_event, newValue) => {
                setSelectedSituation(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Situação Cadastral"
                  sx={{
                    backgroundColor: '#fff',
                  }}
                />
              )}
            />
            <div>
              <TextField
                id="age"
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                label="Idade"
                type="number"
                size="small"
                fullWidth
                InputProps={{ inputProps: { min: 1, max: 100 } }}
                sx={{
                  backgroundColor: '#fff',
                }}
              />
            </div>
            <Autocomplete
              id="status"
              size="small"
              multiple
              noOptionsText="Vínculo Empregatício"
              value={selectedEmployment}
              options={['CLT', 'PJ']}
              onChange={(_event, newValue) => {
                setSelectedEmployment(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Vínculo Empregatício"
                  sx={{
                    backgroundColor: '#fff',
                  }}
                />
              )}
            />
            <Button
              variant="erpSecondary"
              // className="mr-4"
              onClick={() => handleFilter()}
            >
              Filtrar
            </Button>
            <Button variant="erpSecondary" onClick={(e) => setExportMenuAnchor(e.currentTarget)}>
              Exportar
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={() => setExportMenuAnchor(null)}
            >
              <MenuItem onClick={handleExport}>Tudo</MenuItem>
              <MenuItem onClick={handleExportTimeline}>Histórico</MenuItem>
              <MenuItem onClick={handleExportTemplate}>Baixar template</MenuItem>
            </Menu>
            {/* </div> */}
          </div>
        )}
        <CardContent className="p-0">
          <Box sx={{ width: '100%' }}>
            <Paper
              sx={{
                width: '100%',
              }}
            >
              {isLoadingUsers ? (
                <LoadingTable />
              ) : (
                <TableContainer className="w-full overflow-auto">
                  <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
                    <EnhancedTableHead
                      order={order}
                      orderBy={orderBy}
                      onRequestSort={handleRequestSort}
                      rowCount={rows.length}
                    />
                    <TableBody id="tableBody" className="">
                      {rows?.length ? (
                        rows.map((row, index) => {
                          return setRow(row, index)
                        })
                      ) : (
                        <div className="p-4 text-erp-grayscale text-sm">
                          Nenhum resultado encontrado
                        </div>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <div className="flex justify-end items-center text-sm bg-[#F5F5F5] py-4 px-3 text-[#248DAD] flex-wrap">
                Itens por página:
                <select value={limit} onChange={handleChangeLimit}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <p
                  style={{
                    marginLeft: '25px',
                  }}
                ></p>
                {page} - {qntPage}
                <p
                  style={{
                    marginRight: '25px',
                  }}
                ></p>
                <button
                  onClick={() => handleChangePage('prev')}
                  disabled={disablePrev}
                  className="disabled:text-[#A1E5FA]"
                >
                  <MdNavigateBefore size={24} />
                </button>
                <button
                  onClick={() => handleChangePage('next')}
                  disabled={disableNext}
                  className="disabled:text-[#A1E5FA]"
                >
                  <MdNavigateNext size={24} />
                </button>
              </div>
            </Paper>
          </Box>
        </CardContent>
      </Card>
      <ImportCollaboratorsModal
        open={isImportModalOpen}
        status={importStatus}
        phase={importPhase}
        summary={importSummary}
        message={importMessage}
        errors={importErrors}
        onClose={closeImportModal}
        onDownloadErrors={errorBlob || importErrors.length > 0 ? handleDownloadErrors : undefined}
        isDownloadingErrors={isDownloadingErrors}
      />
    </div>
  )
}
