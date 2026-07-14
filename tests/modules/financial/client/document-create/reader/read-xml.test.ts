/**
 * read-xml (puro, node:test) — roteamento por leiaute + mapeamento campo-a-campo de cada parser XML.
 *
 * LGPD: todas as fixtures são SINTÉTICAS (CNPJ 11.222.333/0001-81, nomes fictícios). Zero dado real.
 */
/* eslint-disable no-secrets/no-secrets -- fixtures XML SINTÉTICAS (LGPD): CNPJ 11222333000181 e nomes fictícios, sem segredo real */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { readXml } from '../../../../../../src/modules/financial/client/document-create/reader/xml/read-xml.ts'

const nfseNacional = `
<NFSe>
  <infNFSe Id="NFSe12345678901234567890123456789012345678901234567890">
    <nNFSe>42</nNFSe>
    <emit><CNPJ>11222333000181</CNPJ><xNome>Prestador Ficticio ME</xNome></emit>
    <valores><vLiq>3850.00</vLiq></valores>
    <DPS><infDPS>
      <nDPS>7</nDPS><serie>1</serie><dCompet>2026-07</dCompet><dhEmi>2026-07-15T10:00:00-03:00</dhEmi>
      <prest><CNPJ>11222333000181</CNPJ></prest>
      <serv><cServ><xDescServ>Servico de consultoria ficticia</xDescServ></cServ></serv>
      <valores>
        <vServPrest><vServ>4000.00</vServ></vServPrest>
        <trib>
          <tribFed>
            <vRetIRRF>150.00</vRetIRRF><vRetCP>0</vRetCP><vRetCSLL>100.00</vRetCSLL>
            <piscofins><vRetPIS>65.00</vRetPIS><vRetCofins>300.00</vRetCofins></piscofins>
          </tribFed>
          <tribMun><vISSQNRet>0</vISSQNRet></tribMun>
          <IBSCBS><CBS><vCBS>50.00</vCBS></CBS><IBSMun><vIBSMun>10.00</vIBSMun></IBSMun><IBSUF><vIBSUF>20.00</vIBSUF></IBSUF></IBSCBS>
        </trib>
      </valores>
    </infDPS></DPS>
  </infNFSe>
</NFSe>`

const nfseAbrasf = `
<Nfse><InfNfse>
  <Numero>1001</Numero>
  <Competencia>2026-06</Competencia>
  <DataEmissao>2026-06-20</DataEmissao>
  <Discriminacao>Servico ABRASF ficticio</Discriminacao>
  <ChaveAcesso>ABC123</ChaveAcesso>
  <CodigoVerificacao>XYZ9</CodigoVerificacao>
  <Valores>
    <ValorServicos>2500.00</ValorServicos>
    <ValorIssRetido>75.00</ValorIssRetido>
    <ValorIr>0</ValorIr><ValorInss>0</ValorInss><ValorPis>0</ValorPis><ValorCofins>0</ValorCofins><ValorCsll>0</ValorCsll>
  </Valores>
  <PrestadorServico><RazaoSocial>Prestador ABRASF ME</RazaoSocial><Cnpj>11222333000181</Cnpj></PrestadorServico>
</InfNfse></Nfse>`

const nfseSaoPaulo = `
<NFe>
  <NumeroNFe>500123</NumeroNFe>
  <ChaveRPS><SerieRPS>ABC</SerieRPS></ChaveRPS>
  <DataEmissaoNFe>2026-05-10</DataEmissaoNFe>
  <DataFatoGeradorNFe>2026-05-10</DataFatoGeradorNFe>
  <ValorServicos>1500.00</ValorServicos>
  <Discriminacao>Servico SP ficticio</Discriminacao>
  <ISSRetido>true</ISSRetido>
  <ValorISS>30.00</ValorISS>
  <CPFCNPJPrestador><CNPJ>11222333000181</CNPJ></CPFCNPJPrestador>
  <RazaoSocialPrestador>Prestador SP ME</RazaoSocialPrestador>
  <CodigoVerificacao>ABCD1234</CodigoVerificacao>
</NFe>`

const nfeProduto = `
<nfeProc><NFe><infNFe Id="NFe12345678901234567890123456789012345678901234">
  <ide><nNF>25526</nNF><serie>1</serie><dhEmi>2026-02-07T09:00:00-03:00</dhEmi></ide>
  <emit><CNPJ>11222333000181</CNPJ><xNome>Fornecedor Produto ME</xNome></emit>
  <det><prod><xProd>Cadeira</xProd></prod></det>
  <det><prod><xProd>Mesa</xProd></prod></det>
  <total><ICMSTot><vProd>59.90</vProd><vNF>59.90</vNF><vICMS>0</vICMS><vIPI>0</vIPI><vPIS>0</vPIS><vCOFINS>0</vCOFINS><vTotTrib>5.00</vTotTrib></ICMSTot></total>
</infNFe></NFe></nfeProc>`

describe('readXml — roteamento + mapeamento', () => {
  it('entrada vazia → null (degradação graciosa)', () => {
    assert.equal(readXml(''), null)
    assert.equal(readXml('   '), null)
  })

  it('NFS-e nacional (DANFSe v1.0): mapeia campos, retenções e reforma tributária', () => {
    const r = readXml(nfseNacional)
    assert.ok(r !== null)
    assert.equal(r.kind, 'NFS-e')
    assert.equal(r.category, 'service')
    assert.equal(r.number, '42')
    assert.equal(r.series, '1')
    assert.equal(r.competence, '07/2026')
    assert.equal(r.issueDate, '2026-07-15')
    assert.equal(r.grossValue, 4000)
    assert.equal(r.description, 'Servico de consultoria ficticia')
    assert.equal(r.accessKey, '12345678901234567890123456789012345678901234567890')
    assert.equal(r.supplier.taxId, '11222333000181')
    assert.equal(r.supplier.name, 'Prestador Ficticio ME')
    assert.deepEqual(r.retentions, { iss: 0, irrf: 150, inss: 0, pis: 65, cofins: 300, csll: 100 })
    assert.deepEqual(r.reformaTributaria, { cbs: 50, ibsMunicipal: 10, ibsEstadual: 20 })
  })

  it('NFS-e ABRASF/ginfes: detecta por CodigoVerificacao e mapeia ISS retido', () => {
    const r = readXml(nfseAbrasf)
    assert.ok(r !== null)
    assert.equal(r.kind, 'NFS-e')
    assert.equal(r.number, '1001')
    assert.equal(r.series, null)
    assert.equal(r.competence, '06/2026')
    assert.equal(r.issueDate, '2026-06-20')
    assert.equal(r.grossValue, 2500)
    assert.equal(r.supplier.taxId, '11222333000181')
    assert.equal(r.retentions.iss, 75)
  })

  it('NFS-e São Paulo: vence o ABRASF (mesmo com CodigoVerificacao) e retém ISS quando ISSRetido', () => {
    const r = readXml(nfseSaoPaulo)
    assert.ok(r !== null)
    assert.equal(r.kind, 'NFS-e')
    assert.equal(r.number, '500123')
    assert.equal(r.series, 'ABC')
    assert.equal(r.competence, '05/2026')
    assert.equal(r.issueDate, '2026-05-10')
    assert.equal(r.grossValue, 1500)
    assert.equal(r.accessKey, 'ABCD1234')
    assert.equal(r.supplier.name, 'Prestador SP ME')
    assert.equal(r.retentions.iss, 30)
  })

  it('NF-e produto (modelo 55): categoria produto, chave 44 dígitos, descrição concatenada', () => {
    const r = readXml(nfeProduto)
    assert.ok(r !== null)
    assert.equal(r.kind, 'NF-e')
    assert.equal(r.category, 'product')
    assert.equal(r.number, '25526')
    assert.equal(r.series, '1')
    assert.equal(r.issueDate, '2026-02-07')
    assert.equal(r.grossValue, 59.9)
    assert.equal(r.description, 'Cadeira; Mesa')
    assert.equal(r.accessKey, '12345678901234567890123456789012345678901234')
    assert.equal(r.supplier.taxId, '11222333000181')
    assert.equal(r.retentions.iss, 0)
    assert.ok(r.productTaxes !== null)
  })
})
