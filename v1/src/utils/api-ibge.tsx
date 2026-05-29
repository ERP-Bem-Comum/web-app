const url = 'https://servicodados.ibge.gov.br/api/v1/localidades/'

interface Estado {
  id: number
  sigla: string
  nome: string
  regiao: {
    id: number
    sigla: string
    nome: string
  }
}

interface Municipio {
  id: number
  nome: string
  microrregiao: {
    id: number
    nome: string
    mesorregiao: {
      id: number
      nome: string
      UF: {
        id: number
        sigla: string
        nome: string
        regiao: {
          id: number
          sigla: string
          nome: string
        }
      }
    }
  }
  'regiao-imediata': {
    id: number
    nome: string
    'regiao-intermediaria': {
      id: number
      nome: string
      UF: {
        id: number
        sigla: string
        nome: string
        regiao: {
          id: number
          sigla: string
          nome: string
        }
      }
    }
  }
}

export async function loadUf() {
  let list: Estado[] = []
  await fetch(`${url}estados`)
    .then((response) => response.json())
    .then((data: Estado[]) => {
      data.sort((a, b) => a.nome.localeCompare(b.nome))
      list = data
    })
  return list
}

export async function loadCity(sigla: string) {
  let list: Municipio[] = []
  await fetch(`${url}estados/${sigla}/municipios`)
    .then((response) => response.json())
    .then((data: Municipio[]) => {
      data.sort((a, b) => a.nome.localeCompare(b.nome))
      list = data
    })
  return list
}
