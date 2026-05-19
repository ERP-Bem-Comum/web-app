'use client'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { ModalQuestion } from '@/components/modals/ModalQuestion'
import TableCellStyled from '@/components/table/TableCellStyled'
import TableHeadCellStyled from '@/components/table/TableHeadCellStyled'
import { Button } from '@/components/ui/button'
import { IState, removeState } from '@/services/state'
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
import { MdRemoveCircleOutline } from 'react-icons/md'

interface Params {
  listAdd: IState[]
}

export default function TableRemove({ listAdd }: Params) {
  const [listUfFilter, setListUfFilter] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [removeUf, setRemoveUf] = useState<IState>()
  const [showModalDelete, setShowModalDelete] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)

  useEffect(() => {
    let listFiltered = listAdd

    if (search)
      listFiltered = listAdd?.filter((uf) =>
        uf.name
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
  }, [listAdd, search])

  const handleRemove = async () => {
    setIsDisabled(true)
    const response = await removeState(removeUf?.id)

    if (response?.message) {
      setSuccess(false)
      setErrorMessage(response.message)
    } else {
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['partner_states'] })
      // router.refresh()
    }
    setShowModalConfirm(true)
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
              <TableHeadCellStyled align="center">REMOVER</TableHeadCellStyled>
            </TableRow>
          </TableHead>
          <TableBody>
            {listUfFilter.length ? (
              listUfFilter.map((uf) => (
                <TableRow key={uf.id}>
                  <TableCellStyled>{uf.name}</TableCellStyled>
                  <TableCellStyled align="center">
                    <Button
                      data-test={`remove-${uf.id}`}
                      variant="ghost"
                      size="none"
                      onClick={() => {
                        setRemoveUf(uf)
                        setShowModalDelete(true)
                      }}
                      className="rounded-full"
                      disabled={isDisabled}
                    >
                      <MdRemoveCircleOutline color={'#FF5353'} size={32} className="m-auto" />
                    </Button>
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
      <ModalQuestion
        open={showModalDelete}
        onConfirm={() => {
          setShowModalDelete(false)
          handleRemove()
        }}
        onClose={() => {
          setShowModalDelete(false)
        }}
        text={`Atenção! Você está prestes a remover um estado, com orçamentos criados. Tem certeza que deseja continuar?`}
        textConfirm="Sim, salvar alterações"
        textCancel="Descartar alterações"
      />
      <ModalConfirm
        open={showModalConfirm}
        onClose={() => {
          setShowModalConfirm(false)
        }}
        text={success ? `Estado removido com sucesso!` : errorMessage}
        success={success}
      />
    </Fragment>
  )
}
