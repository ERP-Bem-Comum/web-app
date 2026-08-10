/**
 * gabarito DANFE — NF-e de PRODUTO (modelo 55). Extrai número, série, emissão, valor total/produtos e impostos
 * (ICMS/IPI). Valores no DANFE vêm sem "R$" → regex posicional. `posProcessar` normaliza a chave (remove
 * espaços) e usa o valor total como bruto.
 */
import type { Gabarito } from '../gabarito-engine.ts'

export const gabaritoDanfe: Gabarito = {
  nome: 'DANFE-NFe-Produto',
  detectar: (t) => /\bDANFE\b/i.test(t) || /DOCUMENTO AUXILIAR DA NOTA FISCAL\s+ELETR/i.test(t),
  campos: [
    { nome: 'tipo', tipo: 'texto', estrategia: { mode: 'regex', padrao: /(NF-e)/i } },
    { nome: 'numero', tipo: 'inteiro', estrategia: { mode: 'regex', padrao: /N[ºo]\s*0*(\d{3,})/i } },
    { nome: 'serie', tipo: 'inteiro', estrategia: { mode: 'regex', padrao: /S[ÉEé]rie\s*:?\s*(\d+)/i } },
    {
      nome: 'emissao',
      tipo: 'data',
      estrategia: { mode: 'regex', padrao: /Data emiss[ãa]o[\s\S]{0,120}?(\d{2}\/\d{2}\/\d{4})/i },
    },
    { nome: 'chaveAcesso', tipo: 'texto', estrategia: { mode: 'regex', padrao: /((?:\d{4}\s+){10}\d{4})/ } },

    // "Base de cálculo do ICMS  Valor do ICMS ... Valor total dos produtos"
    {
      nome: 'icms',
      tipo: 'moeda',
      estrategia: {
        mode: 'regex',
        padrao: /Base de c[áa]lculo do ICMS\s+Valor do ICMS[^\n]*\n\s*[\d.,]+\s+([\d.,]+)/i,
      },
    },
    {
      nome: 'valorProdutos',
      tipo: 'moeda',
      estrategia: { mode: 'regex', padrao: /Valor total dos produtos[^\n]*\n\s*(?:[\d.,]+\s+){5}([\d.,]+)/i },
    },

    // "Valor do frete ... Valor do IPI  Valor total da nota"
    {
      nome: 'ipi',
      tipo: 'moeda',
      estrategia: {
        mode: 'regex',
        padrao: /Valor do IPI\s+Valor total da nota[^\n]*\n\s*(?:[\d.,]+\s+){4}([\d.,]+)/i,
      },
    },
    {
      nome: 'valorTotal',
      tipo: 'moeda',
      estrategia: {
        mode: 'regex',
        padrao: /Valor do IPI\s+Valor total da nota[^\n]*\n\s*(?:[\d.,]+\s+){5}([\d.,]+)/i,
      },
    },
  ],
  posProcessar: (c) => ({
    ...c,
    chaveAcesso:
      typeof c.chaveAcesso === 'string' ? c.chaveAcesso.replace(/\s+/g, '') : (c.chaveAcesso ?? null),
    valorBruto: c.valorTotal ?? c.valorProdutos ?? null,
  }),
}
