/**
 * gabarito FILU — DANFSe da Prefeitura de São Paulo. Valores vêm SEM "R$" (ex.: "0,00"), então os campos de
 * imposto usam regex posicional em vez da estratégia de coluna (que depende de "R$"/"-"). No modelo SP o ISS
 * normalmente não é retido (só confiável via XML) → `posProcessar` zera ISS.
 */
import type { Gabarito } from '../gabarito-engine.ts'

export const gabaritoFiluSp: Gabarito = {
  nome: 'NFSe-SaoPaulo',
  detectar: (t) => /PREFEITURA DO MUNIC[IÍ]PIO DE S[ÃA]O PAULO/i.test(t),
  campos: [
    { nome: 'tipo', tipo: 'texto', estrategia: { mode: 'regex', padrao: /(NFS-?e)/i } },
    {
      nome: 'numero',
      tipo: 'inteiro',
      estrategia: { mode: 'regex', padrao: /N[úu]mero da Nota[\s\S]{0,80}?(\d{6,})/i },
    },
    {
      nome: 'emissao',
      tipo: 'data',
      estrategia: { mode: 'regex', padrao: /Data e Hora de Emiss[ãa]o[\s\S]{0,40}?(\d{2}\/\d{2}\/\d{4})/i },
    },
    {
      nome: 'competencia',
      tipo: 'competencia',
      estrategia: { mode: 'regex', padrao: /Data e Hora de Emiss[ãa]o[\s\S]{0,40}?(\d{2}\/\d{2}\/\d{4})/i },
    },
    {
      nome: 'codigoVerificacao',
      tipo: 'texto',
      estrategia: { mode: 'regex', padrao: /\b([A-Z0-9]{4}-[A-Z0-9]{4})\b/ },
    },
    {
      nome: 'valorBruto',
      tipo: 'moeda',
      estrategia: { mode: 'regex', padrao: /VALOR TOTAL DO SERVI[ÇC]O\s*=\s*(R\$ ?[\d.,]+)/i },
    },

    // Linha "INSS (R$) IRRF (R$) CSLL (R$) COFINS (R$) PIS/PASEP (R$) IPI (R$)" / valores sem "R$"
    {
      nome: 'inss',
      tipo: 'moeda',
      estrategia: { mode: 'regex', padrao: /INSS \(R\$\)[^\n]*\n\s*([\d.,-]+)/i },
    },
    {
      nome: 'irrf',
      tipo: 'moeda',
      estrategia: { mode: 'regex', padrao: /INSS \(R\$\)[^\n]*\n\s*[\d.,-]+\s+([\d.,-]+)/i },
    },
    {
      nome: 'csll',
      tipo: 'moeda',
      estrategia: { mode: 'regex', padrao: /INSS \(R\$\)[^\n]*\n\s*(?:[\d.,-]+\s+){2}([\d.,-]+)/i },
    },
    {
      nome: 'cofins',
      tipo: 'moeda',
      estrategia: { mode: 'regex', padrao: /INSS \(R\$\)[^\n]*\n\s*(?:[\d.,-]+\s+){3}([\d.,-]+)/i },
    },
    {
      nome: 'pis',
      tipo: 'moeda',
      estrategia: { mode: 'regex', padrao: /INSS \(R\$\)[^\n]*\n\s*(?:[\d.,-]+\s+){4}([\d.,-]+)/i },
    },

    // "... Base de Cálculo (R$) Alíquota (%) Valor do ISS (R$) ..." → ISS apurado = 4º token
    {
      nome: 'issApurado',
      tipo: 'moeda',
      estrategia: {
        mode: 'regex',
        padrao: /Base de C[áa]lculo \(R\$\)[^\n]*\n\s*(?:[\d.,%-]+\s+){3}([\d.,-]+)/i,
      },
    },
  ],
  posProcessar: (c) => ({ ...c, iss: 0 }),
}
