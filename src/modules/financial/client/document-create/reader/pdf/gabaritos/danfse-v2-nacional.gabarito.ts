/**
 * gabarito DANFSe v2.0 — layout NACIONAL (Emissor Nacional da NFS-e; ex.: Sorocaba/SP). Modelo DIFERENTE do de
 * Fortaleza (`danfse-v2.gabarito.ts`), embora os dois se anunciem "DANFSe v2.0".
 *
 * Detecção: "DANFSe v2" + a seção "TRIBUTAÇÃO FEDERAL" com o rótulo **IRRF** (Fortaleza escreve IRPF).
 *
 * Layout: rótulos numa linha, valores na linha de baixo, cada valor ALINHADO (x) ao seu rótulo — por isso os
 * valores usam a estratégia "abaixo" (posição), não "coluna": uma alíquota preenchida ("0,90 %") não é token
 * de coluna e deslocaria a contagem.
 *
 * Descrição do Serviço: o texto vem ABAIXO do rótulo, até a seção "TRIBUTAÇÃO". A linha ACIMA do rótulo é a
 * descrição do código de tributação municipal — não é a descrição do serviço.
 *
 * Retenções = valores RETIDOS: iss=0 quando "Não Retido"; irrf=IRRF; inss=Prev. Retida; csll=Contrib. Sociais
 * Retidas (agregado). PIS/COFINS "Débito Apuração Própria" NÃO são retenção (não entram).
 */
import type { Gabarito } from '../gabarito-engine.ts'

export const gabaritoDanfseV2Nacional: Gabarito = {
  nome: 'DANFSe-v2-Nacional',
  detectar: (texto) => /DANFSe\s*v2/i.test(texto) && /TRIBUTA[ÇC][ÃA]O FEDERAL[^\n]*\bIRRF\b/i.test(texto),
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
    // CNPJ/CPF do EMITENTE (prestador) — 1º documento depois de "EMITENTE", antes do TOMADOR. Habilita a
    // auto-seleção do fornecedor pelo leitor client-side (matchPartnerByTaxId).
    {
      nome: 'supplierCnpj',
      tipo: 'texto',
      estrategia: {
        mode: 'regex',
        padrao: /EMITENTE[\s\S]*?(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})/i,
      },
    },
    {
      nome: 'descricao',
      tipo: 'texto',
      estrategia: {
        mode: 'regex',
        // A trava `(?!…TRIBUTAÇÃO)`: descrição vazia (rótulo seguido direto da seção) → sem captura, em vez de
        // engolir o bloco de tributação até a PRÓXIMA seção.
        padrao:
          /Descri[çc][ãa]o\s*do\s*Servi[çc]o\s*\n(?![^\n]*TRIBUTA[ÇC][ÃA]O)([\s\S]*?)(?=\n[^\n]*TRIBUTA[ÇC][ÃA]O)/i,
      },
    },

    // "VALOR TOTAL DA NFS-e  VALOR DA OPERAÇÃO / SERVIÇO  Desconto Incondicionado  Desconto Condicionado"
    {
      nome: 'valorBruto',
      tipo: 'moeda',
      estrategia: { mode: 'abaixo', rotulo: /VALOR DA OPERA[ÇC][ÃA]O/i },
    },

    // ISSQN: "BC ISSQN  Alíquota Aplicada  Retenção do ISSQN  ISSQN Apurado"
    { nome: 'issApurado', tipo: 'moeda', estrategia: { mode: 'abaixo', rotulo: /ISSQN Apurado/i } },
    { nome: 'issStatus', tipo: 'texto', estrategia: { mode: 'abaixo', rotulo: /Reten[çc][ãa]o do ISSQN/i } },

    // TRIBUTAÇÃO FEDERAL: "IRRF  Contribuição Previdenciária - Retida  Contribuições Sociais - Retidas"
    { nome: 'irrf', tipo: 'moeda', estrategia: { mode: 'abaixo', rotulo: /\bIRRF\b/i } },
    {
      nome: 'inss',
      tipo: 'moeda',
      estrategia: { mode: 'abaixo', rotulo: /Contribui[çc][ãa]o Previdenci[áa]ria - Retida/i },
    },
    {
      nome: 'csll',
      tipo: 'moeda',
      estrategia: { mode: 'abaixo', rotulo: /Contribui[çc][õo]es Sociais - Retidas/i },
    },

    // REFORMA TRIBUTÁRIA (IBS/CBS)
    {
      nome: 'ibsMunicipal',
      tipo: 'moeda',
      estrategia: { mode: 'abaixo', rotulo: /Valor Apurado Municipal - IBS/i },
    },
    {
      nome: 'ibsEstadual',
      tipo: 'moeda',
      estrategia: { mode: 'abaixo', rotulo: /Valor Apurado Estadual - IBS/i },
    },
    { nome: 'cbs', tipo: 'moeda', estrategia: { mode: 'abaixo', rotulo: /Valor Total Apurado - CBS/i } },
  ],
  posProcessar: (c) => {
    const status = c.issStatus
    const retido = typeof status === 'string' && /^Retido/i.test(status.trim())
    return { ...c, iss: retido ? (c.issApurado ?? 0) : 0 }
  },
}
