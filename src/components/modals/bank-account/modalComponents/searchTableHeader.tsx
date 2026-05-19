import { AutoComplete } from '@/components/layout/AutoComplete'
import DoubleButton from '@/components/layout/shared/doubleButton'
import SearchByCPForCNPJ from '@/components/layout/shared/searchByCPForCNPJ'
import { TitleLabel } from '@/components/layout/TitleLabel'
import { useOptions } from '@/hooks/useOptions'
import { SearchAppointmentParams } from '@/types/searchAppointments'
import { Grid, TextField } from '@mui/material'
import searchIcon from '../../../../../public/images/Search.svg'
import { Control, Controller, FieldErrors, UseFormReset } from 'react-hook-form'
import Image from 'next/image'

interface SearchTableHeaderProps {
  control: Control<SearchAppointmentParams>
  errors: FieldErrors<SearchAppointmentParams>
  reset: UseFormReset<SearchAppointmentParams>
  onFilter: () => void
  accountId: number
  values: SearchAppointmentParams
}

export const SearchTableHeader = ({
  control,
  errors,
  accountId,
  values,
  reset,
  onFilter,
}: SearchTableHeaderProps) => {
  const { options } = useOptions()

  const handleReset = (typeOfTransaction: 'Payable' | 'Receivable') => {
    reset((values) => ({
      searchAppointmentParams: {
        ...values.searchAppointmentParams,
        typeOfTransaction,
        CNPJorNameSearch: '',
      },
      paginationParams: { ...values.paginationParams, page: 1 },
    }))
  }

  const handleOptions = () => {
    if (values.searchAppointmentParams.typeOfTransaction === 'Payable') {
      return options.Suppliers()
    }
    return options.Financiers()
  }

  return (
    <Grid container rowGap={1.5} columnSpacing={1}>
      <Grid item xs={12}>
        <TitleLabel>Filtros:</TitleLabel>
      </Grid>
      <Grid item sx={{ width: 'fit-content', minWidth: '180px' }}>
        <AutoComplete
          control={control}
          editable={false}
          label=""
          name="searchAppointmentParams.accountId"
          options={options.Accounts()}
          error={errors.searchAppointmentParams?.accountId?.message}
          defaultValue={options.Accounts()?.find((op) => op.id === accountId)}
        />
      </Grid>
      <Grid item sx={{ width: 'fit-content' }}>
        <DoubleButton
          labelLeft="A Pagar"
          labelRight="A Receber"
          onClickLeft={() => handleReset('Payable')}
          onClickRight={() => handleReset('Receivable')}
        />
      </Grid>
      <Grid item sx={{ flex: 1 }}>
        <SearchByCPForCNPJ
          defaultId={undefined}
          handleRefetch={onFilter}
          options={handleOptions()}
        />
      </Grid>
      <Grid item xs={12} sx={{ borderTop: 1, borderColor: '#C4DADF' }} />
      <Grid item xs={12}>
        <TitleLabel>Apontamentos encontrados</TitleLabel>
      </Grid>
      <Grid item xs={3.5} sx={{ paddingBottom: 2 }}>
        <Controller
          name={'searchAppointmentParams.identificationCodeSearch'}
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e.target.value)
              }}
              id={'identificationCodeSearch'}
              className="mb-6"
              label={'Pesquise por identificação'}
              slotProps={{
                htmlInput: {
                  maxLength: 20,
                  sx: {
                    paddingLeft: 1,
                  },
                },
                input: {
                  startAdornment: <Image src={searchIcon} alt="icon" />,
                  sx: {
                    backgroundColor: '#F5F5F5',
                  },
                },
              }}
              size="small"
              fullWidth
              error={!!errors.searchAppointmentParams?.identificationCodeSearch?.message}
              helperText={errors.searchAppointmentParams?.identificationCodeSearch?.message}
            />
          )}
        />
      </Grid>
    </Grid>
  )
}

export default SearchTableHeader
