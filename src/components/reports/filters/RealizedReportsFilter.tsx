import { Grid } from '@mui/material'
import { Control, FieldErrors } from 'react-hook-form'
import { AutoComplete } from '@/components/layout/AutoComplete'
import { useOptions } from '@/hooks/useOptions'
import { Button } from '../../ui/button'
import { ReactNode, useCallback, useEffect } from 'react'
import { FilterRealizedReportParams } from '@/types/reports/realized'
import { YearPicker } from '@/components/layout/FilterComponents/YearPicker'

interface RealizedReportsFilterProps {
  control: Control<FilterRealizedReportParams>
  errors: FieldErrors<FilterRealizedReportParams>
  values: FilterRealizedReportParams
  exportButton?: ReactNode
  setLimit?: (value: number) => void
  handleFilter: () => void
  clearField: (field: keyof FilterRealizedReportParams) => void
  currentLimit?: number
  extraSlot?: ReactNode
}

export const RealizedReportsFilter = ({
  control,
  errors,
  values,
  extraSlot,
  exportButton,
  handleFilter,
  clearField,
}: RealizedReportsFilterProps) => {
  const { options } = useOptions()

  const clearFieldsFrom = useCallback(
    (startField: keyof Required<FilterRealizedReportParams>) => {
      const fieldsToClear = (
        {
          programId: ['budgetPlanId'],
        } as unknown as Record<
          keyof Required<FilterRealizedReportParams>,
          (keyof Required<FilterRealizedReportParams>)[]
        >
      )[startField]
      if (fieldsToClear && fieldsToClear.length > 0) {
        fieldsToClear.forEach(clearField)
      }
    },
    [clearField],
  )

  useEffect(() => {
    if (!values.programId) clearFieldsFrom('programId')
  }, [values.programId, clearFieldsFrom])

  return (
    <div className="w-full h-full p-5">
      <Grid container spacing={2} className="bg-[#F6FAFB] p-4 w-full m-0">
        <Grid item xs={12 / 5}>
          <AutoComplete
            control={control}
            options={options.Program()}
            name="programId"
            label="Programa:"
            editable
            error={errors?.programId?.message}
          />
        </Grid>
        <Grid item xs={12 / 5}>
          <AutoComplete
            control={control}
            options={options.BudgetPlan()?.filter((cc) => cc.parentId === values?.programId) ?? []}
            name="budgetPlanId"
            label="Plano Orçamentário:"
            editable={!!values?.programId}
            error={errors?.budgetPlanId?.message}
          />
        </Grid>

        <Grid item xs={12 / 5}>
          <AutoComplete
            control={control}
            label="Estado"
            name="partnerStateId"
            options={options.States()}
            error={errors?.partnerStateId?.message}
            editable={true}
          />
        </Grid>
        <Grid item xs={12 / 5}>
          <AutoComplete
            control={control}
            label="Municipio"
            name="partnerMunicipalityId"
            options={
              options
                .Cities()
                ?.filter(
                  (cc) =>
                    cc.parentId ===
                    options.States()?.find((s) => s.id === values.partnerStateId)?.name,
                ) ?? []
            }
            editable={!!values?.partnerStateId}
            error={errors?.partnerMunicipalityId?.message}
          />
        </Grid>

        <Grid item xs={12 / 5}>
          <YearPicker control={control} label="Ano:" error={errors?.year?.message} field="year" />
        </Grid>

        <Grid item xs={24 / 5} justifyContent="flex-start" gap={5}>
          <Button variant="erpSecondary" className="mr-4" onClick={handleFilter}>
            Filtrar
          </Button>
          {exportButton}
          {extraSlot && extraSlot}
        </Grid>
      </Grid>
    </div>
  )
}
