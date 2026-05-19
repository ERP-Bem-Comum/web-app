'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Grid } from '@mui/material'
import TableAdd from './TableAdd'
import TableRemove from './TableRemove'
import { useGetCities } from '@/services/city'

export default function ListCities() {
  const { data, isLoading: isLoadingCity } = useGetCities({
    page: 1,
    limit: 99999999,
  })

  return (
    <div>
      {!isLoadingCity && (
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Card className="min-h-[605px]">
              <CardHeader>
                <div className="text-xl">Lista Geral de Municípios</div>
              </CardHeader>
              <CardContent className="p-0">
                <TableAdd listAdd={data?.items} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card className="min-h-[605px]">
              <CardHeader>
                <div className="text-xl">Municípios Parceiros Adicionados</div>
              </CardHeader>
              <CardContent className="p-0">
                <TableRemove listAdd={data?.items} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </div>
  )
}
