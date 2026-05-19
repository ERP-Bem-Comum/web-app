'use client'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import TableCellStyled from '@/components/table/TableCellStyled'
import TableHeadCellStyled from '@/components/table/TableHeadCellStyled'
import { Button } from '@/components/ui/button'
import { IState, addState } from '@/services/state'
import { loadUf } from '@/utils/api-ibge'
import { InputAdornment, TextField } from '@mui/material'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { queryClient } from 'lib/react-query'
import { Fragment, useEffect, useState } from 'react'
import { BiSearch } from 'react-icons/bi'
import { MdOutlineAddCircle } from 'react-icons/md'

interface Params {
  listAdd: IState[]
}
export default function TableAdd({ listAdd }: Params) {
  const [listUf, setListUf] = useState<any[]>([])
  const [listUfFilter, setListUfFilter] = useState<any[]>([])
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [search, setSearch] = useState('')
  const [isDisabled, setIsDisabled] = useState(false)

  useEffect(() => {
    async function fetchAPI() {
      const ufs = await loadUf()
      setListUf(ufs)
      setListUfFilter(ufs)
    }
    fetchAPI()
  }, [])

  useEffect(() => {
    let listFiltered = listUf

    if (search)
      listFiltered = listUf.filter((uf) =>
        uf.nome
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
    setListUfFilter(listFiltered)
  }, [search, listUf])

  const handleAdd = async (uf: any) => {
    setIsDisabled(true)
    const resp = await addState({ name: uf.nome, abbreviation: uf.sigla })

    if (resp?.message) {
      setSuccess(false)
      setErrorMessage(resp.message)
      setShowModalConfirm(true)
    } else {
      // setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['partner_states'] })
      // router.refresh()
    }
    setIsDisabled(false)
  }

  return (
    <Fragment>
      <div className="px-5">
        <TextField
          id="search-state"
          label="Procurar Estado"
          size="small"
          fullWidth
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
              <TableHeadCellStyled>ESTADOS</TableHeadCellStyled>
              <TableHeadCellStyled align="center">ADD</TableHeadCellStyled>
            </TableRow>
          </TableHead>
          <TableBody>
            {listUfFilter.length ? (
              listUfFilter.map((uf) => (
                <TableRow key={uf.id}>
                  <TableCellStyled>{uf.nome}</TableCellStyled>
                  <TableCellStyled align="center">
                    {listAdd?.find((state: IState) => state.abbreviation === uf.sigla) ? (
                      <div className="text-sm text-erp-gradient h-9 leading-9 ">Adicionado</div>
                    ) : (
                      <Button
                        data-test={`add-${uf.id}`}
                        variant="ghost"
                        size="none"
                        onClick={() => handleAdd(uf)}
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
        text={success ? `Estado adicionado com sucesso!` : errorMessage}
        success={success}
      />
    </Fragment>
  )
}
