import { CollaboratorData } from '@/types/reports/team'
import React from 'react'
import GenderChart from './charts/GenderChart'
import RaceChart from './charts/RaceChart'
import AgeChart from './charts/AgeChart'
import YearChart from './charts/YearChart'
import RoleChart from './charts/RoleChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TeamChartsProps {
  data?: CollaboratorData[]
}

const TeamCharts = ({ data }: TeamChartsProps) => {
  if (!data) return null

  return (
    <div id="chart-pdf-export-container" className="grid grid-cols-1 gap-8 md:grid-cols-2 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Gênero</CardTitle>
        </CardHeader>
        <CardContent>
          <GenderChart data={data} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Raça/Cor</CardTitle>
        </CardHeader>
        <CardContent>
          <RaceChart data={data} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Idade</CardTitle>
        </CardHeader>
        <CardContent>
          <AgeChart data={data} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quantitativo de Funcionários por Ano</CardTitle>
        </CardHeader>
        <CardContent>
          <YearChart data={data} />
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Distribuição por Função</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleChart data={data} />
        </CardContent>
      </Card>
    </div>
  )
}

export default TeamCharts
