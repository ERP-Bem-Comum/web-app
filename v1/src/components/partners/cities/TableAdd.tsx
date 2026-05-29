'use client'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import TableCellStyled from '@/components/table/TableCellStyled'
import TableHeadCellStyled from '@/components/table/TableHeadCellStyled'
import { Button } from '@/components/ui/button'
import { ICity, addCity } from '@/services/city'
import { loadCity, loadUf } from '@/utils/api-ibge'
import { Autocomplete, InputAdornment, TextField } from '@mui/material'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { queryClient } from 'lib/react-query'
import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'
import { BiSearch } from 'react-icons/bi'
import { MdOutlineAddCircle } from 'react-icons/md'

interface Params {
  listAdd: ICity[]
}
export default function TableAdd({ listAdd }: Params) {
  const [listUf, setListUf] = useState<any[]>([])
  const [selectedUf, setSelectedUf] = useState<any>()
  const [listCity, setListCity] = useState<any[]>([])
  const [listCityFilter, setListCityFilter] = useState<any[]>([])
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [search, setSearch] = useState('')
  const [isDisabled, setIsDisabled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchAPI() {
      const ufs = await loadUf()
      setListUf(ufs)
    }
    fetchAPI()
  }, [])

  useEffect(() => {
    async function fetchAPI() {
      if (selectedUf) {
        const cities = await loadCity(selectedUf?.sigla)
        setListCity(cities)
        setListCityFilter(cities)
      } else {
        setListCity([])
        setListCityFilter([])
      }
    }
    fetchAPI()
  }, [selectedUf])

  useEffect(() => {
    let listFiltered = listCity

    if (search)
      listFiltered = listCity.filter((city) =>
        city.nome
          .toUpperCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes(
            search
              .toUpperCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, ''),
          ),
      )
    setListCityFilter(listFiltered)
  }, [search, listCity])

  const handleAdd = async (city: any) => {
    setIsDisabled(true)
    const resp = await addCity({
      name: city.nome,
      uf: city.microrregiao.mesorregiao.UF.sigla,
      cod: city.id.toString(),
    })

    if (resp?.message) {
      setSuccess(false)
      setErrorMessage(resp.message)
      setShowModalConfirm(true)
    } else {
      queryClient.invalidateQueries({ queryKey: ['partner_municipalities'] })
      // router.refresh()
    }

    setIsDisabled(false)
  }

  return (
    <Fragment>
      <div className="px-5">
        <Autocomplete
          id="state"
          size="small"
          noOptionsText="Selecionar Estado"
          value={selectedUf}
          options={listUf}
          getOptionLabel={(option) => option.nome}
          onChange={(_event, newValue) => {
            setSelectedUf(newValue)
            setSearch('')
          }}
          renderInput={(params) => <TextField {...params} label="Selecionar Estado" />}
          sx={{ backgroundColor: '#fff', marginBottom: '8px' }}
        />
        <TextField
          id="city"
          label="Procurar Município"
          size="small"
          fullWidth
          value={search}
          sx={{ backgroundColor: '#fff', marginBottom: '24px' }}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <BiSearch color={'#32C6F4'} size={24} />
              </InputAdornment>
            ),
          }}
        />
      </div>
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: 430,
          overflowY: 'auto',
        }}
      >
        <Table stickyHeader aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableHeadCellStyled>MUNICÍPIOS</TableHeadCellStyled>
              <TableHeadCellStyled align="center">ADD</TableHeadCellStyled>
            </TableRow>
          </TableHead>
          <TableBody>
            {listCityFilter.length ? (
              listCityFilter.map((city) => (
                <TableRow key={'city' + city.id}>
                  <TableCellStyled>{city.nome}</TableCellStyled>
                  <TableCellStyled align="center">
                    {listAdd?.find((addCity: ICity) => addCity.cod === city.id.toString()) ? (
                      <div className="text-sm text-erp-gradient h-9 leading-9 ">Adicionado</div>
                    ) : (
                      <Button
                        data-test={`add-${city.id}`}
                        variant="ghost"
                        size="none"
                        onClick={() => handleAdd(city)}
                        className="rounded-full"
                        disabled={isDisabled}
                      >
                        <MdOutlineAddCircle color={'#64BC47'} size={32} className="m-auto" />
                      </Button>
                    )}
                  </TableCellStyled>
                </TableRow>
              ))
            ) : (
              <div className="p-4 text-erp-grayscale text-sm">Nenhum resultado encontrado</div>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <div className="w-full h-9 bg-[#F5F5F5] rounded-b-lg"></div>
      <ModalConfirm
        open={showModalConfirm}
        onClose={() => {
          setShowModalConfirm(false)
        }}
        text={success ? `Município adicionado com sucesso!` : errorMessage}
        success={success}
      />
    </Fragment>
  )
}
