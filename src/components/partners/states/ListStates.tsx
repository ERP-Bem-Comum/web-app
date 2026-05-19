'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Grid } from '@mui/material'
import TableAdd from './TableAdd'
import TableRemove from './TableRemove'
import { useGetStates } from '@/services/state'

export default function ListStates() {
  const { data, isLoading: isLoadingStates } = useGetStates()

  return (
    <div>
      {!isLoadingStates && (
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Card className="min-h-[605px]">
              <CardHeader>
                <div className="text-xl">Lista Geral de Estados</div>
              </CardHeader>
              <CardContent className="p-0">
                <TableAdd listAdd={data?.data} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card className="min-h-[605px]">
              <CardHeader>
                <div className="text-xl">Estados Parceiros Adicionados</div>
              </CardHeader>
              <CardContent className="p-0">
                <TableRemove listAdd={data?.data} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </div>
  )
}
