import { ParamsContracts, ContractRow } from '@/types/contracts'
import { InputAdornment, TextField, TextFieldProps } from '@mui/material'
import { useState, useMemo } from 'react'
import { Control, Controller, FieldErrors, UseFormSetValue } from 'react-hook-form'
import { Download, Filter, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { CardHeader } from '../ui/card'
import { FilterContracts } from './Filters/FiltersContracts'
import { ContractsExportButton } from './tablesComponents/ContractsExportButton'
import { deriveStatus, getMostRecentChild } from '@/utils/contracts/status'
import styles from './contractsGrid.module.css'

export type StatusFilterKey = 'todos' | 'em-andamento' | 'pendente' | 'finalizado' | 'distrato' | 'rascunho' | 'vencendo'

interface HeaderContractsProps {
  control: Control<ParamsContracts>
  errors: FieldErrors<ParamsContracts>
  values: ParamsContracts
  handleFilter: (nextParams?: ParamsContracts['payableParams']) => void
  setValue: UseFormSetValue<ParamsContracts>
  contracts: ContractRow[] | undefined
  selectedStatus: StatusFilterKey
  onStatusChange: (status: StatusFilterKey) => void
}

const STATUS_OPTIONS: { key: StatusFilterKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'em-andamento', label: 'Em Andamento' },
  { key: 'pendente', label: 'Pendente' },
  { key: 'finalizado', label: 'Finalizado' },
  { key: 'distrato', label: 'Distrato' },
  { key: 'rascunho', label: 'Rascunho' },
  { key: 'vencendo', label: 'Vencendo' },
]

export const HeaderContracts = ({
  control,
  errors,
  values,
  handleFilter,
  contracts,
  selectedStatus,
  onStatusChange,
}: HeaderContractsProps) => {
  const [openFilter, setOpenFilter] = useState(false)

  const counts = useMemo(() => {
    const result: Record<string, number> = { todos: 0, 'em-andamento': 0, pendente: 0, finalizado: 0, distrato: 0, rascunho: 0, vencendo: 0 }
    if (!contracts) return result

    result.todos = contracts.length

    const now = new Date()
    const threshold = 45 * 24 * 60 * 60 * 1000

    contracts.forEach((row) => {
      const info = getMostRecentChild(row)
      const derived = deriveStatus(info, !!row.children?.length)
      if (result[derived.key] !== undefined) {
        result[derived.key]++
      }

      // Contagem para Vencendo (≤ 45 dias)
      if (info?.contractPeriod?.end) {
        const end = new Date(info.contractPeriod.end)
        const diff = end.getTime() - now.getTime()
        if (diff > 0 && diff <= threshold) {
          result.vencendo++
        }
      }
    })
    return result
  }, [contracts])

  return (
    <CardHeader className="space-y-0 p-0">
      <section className={styles.header}>
        <div className={styles.searchGroup}>
          <Button
            size="none"
            variant="ghost"
            className={`${styles.filterButton} ${openFilter ? styles.filterButtonActive : ''}`}
            onClick={() => setOpenFilter(!openFilter)}
            title="Filtros"
          >
            <Filter size={16} />
          </Button>
          <Controller
            name={'search'}
            control={control}
            render={({ field }) => (
              <TextField
                id="search"
                name="search"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="Buscar por contratado, número, CNPJ/CPF"
                size="small"
                className={styles.searchField}
                variant="outlined"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={15} color={'#396496'} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
          />
        </div>

        <div className={styles.statusChips}>
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              type="button"
              variant="ghost"
              className={`${styles.statusChip} ${selectedStatus === opt.key ? styles.statusChipActive : ''} ${opt.key === 'vencendo' ? styles.nearExpiryChip : ''}`}
              onClick={() => onStatusChange(opt.key)}
              title={opt.key === 'vencendo' ? 'Contratos com vigência de 45 dias ou menos' : undefined}
            >
              {opt.label}
              <span className={styles.statusChipCount}>{counts[opt.key] ?? 0}</span>
            </Button>
          ))}
        </div>

        <div className={styles.actions}>
          <ContractsExportButton currentParams={values} icon={<Download size={14} />} />
        </div>
      </section>
      <section className={styles.filterPanel} hidden={!openFilter}>
        <FilterContracts control={control} errors={errors} handleFilter={handleFilter} />
      </section>
    </CardHeader>
  )
}
