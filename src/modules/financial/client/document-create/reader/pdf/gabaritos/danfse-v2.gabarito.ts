/**
 * gabarito DANFSe v2.0 (sistema próprio de Fortaleza/CE). Rótulos em MAIÚSCULAS; seção "TRIBUTAÇÃO FEDERAL
 * (EXCETO CBS)" (IRPF/Prev./Contrib. Sociais) e seção "TRIBUTAÇÃO IBS/CBS" (Reforma Tributária) preenchidas.
 *
 * Retenções = valores RETIDOS: iss=0 quando "Não Retido"; irrf=IRPF; inss=Prev. Retida; csll=Contrib. Sociais
 * Retidas (agregado). CBS/IBS → Reforma Tributária. `posProcessar` zera ISS quando não retido.
 */
import type { Gabarito } from '../gabarito-engine.ts'

export const gabaritoDanfseV2: Gabarito = {
  nome: 'DANFSe-v2-Fortaleza',
  detectar: (texto) => /DANFSe\s*v2/i.test(texto),
  campos: [
    { nome: 'tipo', tipo: 'texto', estrategia: { mode: 'regex', padrao: /\b(NFS-?e)\b/i } },
    {
      nome: 'numero',
      tipo: 'inteiro',
      estrategia: { mode: 'regex', padrao: /N[ÚU]MERO DA NFS-?E[^\n]*\n\s*(\d+)/i },
    },
    {
      nome: 'competencia',
      tipo: 'competencia',
      estrategia: { mode: 'regex', padrao: /N[ÚU]MERO DA NFS-?E[^\n]*\n\s*\d+\s+(\d{2}\/\d{2}\/\d{4})/i },
    },
    {
      nome: 'emissao',
      tipo: 'data',
      estrategia: {
        mode: 'regex',
        padrao: /N[ÚU]MERO DA NFS-?E[^\n]*\n\s*\d+\s+\d{2}\/\d{2}\/\d{4}\s+(\d{2}\/\d{2}\/\d{4})/i,
      },
    },
    {
      nome: 'serie',
      tipo: 'inteiro',
      estrategia: { mode: 'regex', padrao: /S[ÉE]RIE DA DPS[^\n]*\n\s*\d+\s+(\d+)/i },
    },
    { nome: 'chaveAcesso', tipo: 'texto', estrategia: { mode: 'regex', padrao: /(\d{50})/ } },

    {
      nome: 'valorBruto',
      tipo: 'moeda',
      estrategia: { mode: 'coluna', rotulo: /VALOR DA OPERA[ÇC][ÃA]O/i, indice: 0 },
    },

    // ISSQN: "BC ISSQN  Alíquota Aplicada  Retenção do ISSQN  ISSQN Apurado" → tokens R$: [BC, Apurado]
    { nome: 'issApurado', tipo: 'moeda', estrategia: { mode: 'coluna', rotulo: /BC ISSQN/i, indice: 1 } },
    {
      nome: 'issStatus',
      tipo: 'texto',
      estrategia: { mode: 'regex', padrao: /Reten[çc][ãa]o do ISSQN[^\n]*\n[^\n]*?(N[ãa]o Retido|Retido)/i },
    },

    // TRIBUTAÇÃO FEDERAL: "IRPF  Contribuição Previdenciária - Retida  Contribuições Sociais - Retidas"
    { nome: 'irrf', tipo: 'moeda', estrategia: { mode: 'coluna', rotulo: /IRPF/i, indice: 0 } },
    { nome: 'inss', tipo: 'moeda', estrategia: { mode: 'coluna', rotulo: /IRPF/i, indice: 1 } },
    { nome: 'csll', tipo: 'moeda', estrategia: { mode: 'coluna', rotulo: /IRPF/i, indice: 2 } },

    // REFORMA TRIBUTÁRIA (IBS/CBS)
    {
      nome: 'ibsMunicipal',
      tipo: 'moeda',
      estrategia: { mode: 'coluna', rotulo: /Valor Apurado Municipal - IBS/i, indice: 1 },
    },
    {
      nome: 'ibsEstadual',
      tipo: 'moeda',
      estrategia: { mode: 'coluna', rotulo: /Valor Apurado Municipal - IBS/i, indice: 3 },
    },
    {
      nome: 'cbs',
      tipo: 'moeda',
      estrategia: { mode: 'coluna', rotulo: /Valor Total Apurado - IBS/i, indice: 2 },
    },
  ],
  posProcessar: (c) => {
    const status = c.issStatus
    const retido = typeof status === 'string' && /^Retido/i.test(status.trim())
    return { ...c, iss: retido ? (c.issApurado ?? 0) : 0 }
  },
}
