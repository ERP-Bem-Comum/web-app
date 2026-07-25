/**
 * gabarito DANFSe v1.0 (NFS-e Nacional). Layout: rótulos numa linha, valores na linha IMEDIATAMENTE abaixo,
 * várias colunas. Campos simples via regex na linha de valores; monetários em tabela via estratégia "coluna"
 * (tokeniza cada "R$ x" / "-" como coluna — robusto se um "-" virar valor real).
 *
 * PIS/COFINS/CSLL: o PDF NÃO separa (mostra o agregado "Contribuições Sociais - Retidas"). A separação só existe
 * no XML. Do PDF sai o agregado (mapeado como CSRF na leitura de PDF).
 */
import type { Gabarito } from '../gabarito-engine.ts'

export const gabaritoDanfse: Gabarito = {
  nome: 'DANFSe',
  detectar: (texto) => /DANFSe\s*v1/i.test(texto),
  campos: [
    { nome: 'tipo', tipo: 'texto', estrategia: { mode: 'regex', padrao: /\b(NFS-e)\b/i } },
    {
      nome: 'numero',
      tipo: 'inteiro',
      estrategia: { mode: 'regex', padrao: /N[úu]mero da NFS-?e[^\n]*\n\s*(\d+)/i },
    },
    {
      nome: 'competencia',
      tipo: 'competencia',
      estrategia: { mode: 'regex', padrao: /N[úu]mero da NFS-?e[^\n]*\n\s*\d+\s+(\d{2}\/\d{2}\/\d{4})/i },
    },
    {
      nome: 'emissao',
      tipo: 'data',
      estrategia: {
        mode: 'regex',
        padrao: /N[úu]mero da NFS-?e[^\n]*\n\s*\d+\s+\d{2}\/\d{2}\/\d{4}\s+(\d{2}\/\d{2}\/\d{4})/i,
      },
    },
    {
      nome: 'serie',
      tipo: 'inteiro',
      estrategia: { mode: 'regex', padrao: /S[ée]rie da DPS[^\n]*\n\s*\d+\s+(\d+)/i },
    },
    { nome: 'chaveAcesso', tipo: 'texto', estrategia: { mode: 'regex', padrao: /(\d{50})/ } },
    // CNPJ/CPF do EMITENTE (prestador) — ancora em "EMITENTE" e pega o 1º documento DEPOIS dele (antes do
    // TOMADOR). Habilita a auto-seleção do fornecedor pelo leitor client-side (matchPartnerByTaxId).
    {
      nome: 'supplierCnpj',
      tipo: 'texto',
      estrategia: {
        mode: 'regex',
        padrao: /EMITENTE[\s\S]*?(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})/i,
      },
    },

    // VALOR TOTAL: "Valor do Serviço  Desconto Condicionado  Desconto Incondicionado  ISSQN Retido"
    {
      nome: 'valorBruto',
      tipo: 'moeda',
      estrategia: { mode: 'coluna', rotulo: /Desconto Condicionado/i, indice: 0 },
    },
    {
      nome: 'iss',
      tipo: 'moeda',
      estrategia: { mode: 'coluna', rotulo: /Desconto Condicionado/i, indice: 3 },
    },

    // TRIBUTAÇÃO FEDERAL: "IRRF  Contribuição Previdenciária - Retida  Contribuições Sociais - Retidas"
    { nome: 'irrf', tipo: 'moeda', estrategia: { mode: 'coluna', rotulo: /^IRRF\b/i, indice: 0 } },
    { nome: 'inss', tipo: 'moeda', estrategia: { mode: 'coluna', rotulo: /^IRRF\b/i, indice: 1 } },
    {
      nome: 'contribSociaisRetidas',
      tipo: 'moeda',
      estrategia: { mode: 'coluna', rotulo: /^IRRF\b/i, indice: 2 },
    },
  ],
}
