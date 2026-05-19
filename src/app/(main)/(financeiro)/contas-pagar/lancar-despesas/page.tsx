'use client'
import FormPayable from '@/components/payables/FormPayable'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function LaunchExpense() {
  const router = useRouter()

  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <button className={styles.back} title="Voltar" onClick={() => router.push('/contas-pagar')}>
          ←
        </button>
        <h1>Lançar Documento</h1>
        <div className={styles.crumb}>
          <span>Módulo Financeiro</span>
          <span>Contas a Pagar</span>
        </div>
        <button className={styles.close} title="Fechar" onClick={() => router.push('/contas-pagar')}>
          ✕
        </button>
      </header>

      <div className={styles.body}>
        <aside className={styles.preview}>
          <div className={styles.previewHead}>
            <span className={styles.previewLabel}>📄 Documento · pré-visualização</span>
            <div className={styles.tools}>
              <button title="Reduzir zoom">−</button>
              <button title="Ampliar zoom">+</button>
              <button title="Baixar">⤓</button>
            </div>
          </div>

          <div className={styles.pdf}>
            <div className={styles.pdfHead}>
              <div className={styles.seal}>BC</div>
              <div>
                <h2>Documento de Despesa</h2>
                <div className={styles.pdfSub}>Anexe o comprovante para conferência do lançamento</div>
              </div>
              <div className={styles.pdfNum}>
                <div>Status</div>
                <strong>Novo</strong>
                <div>Rascunho</div>
              </div>
            </div>

            <div className={styles.pdfSection}>
              <div className={styles.pdfSectionTitle}>Identificação</div>
              <div className={styles.pdfRow}>
                <span>Fornecedor</span>
                <strong>Aguardando seleção</strong>
              </div>
              <div className={styles.pdfRow}>
                <span>Documento</span>
                <strong>NFS-e, boleto ou recibo</strong>
              </div>
              <div className={styles.pdfRow}>
                <span>Competência</span>
                <strong>Não informada</strong>
              </div>
            </div>

            <div className={styles.pdfSection}>
              <div className={styles.pdfSectionTitle}>Conferência</div>
              <table className={styles.pdfTable}>
                <tbody>
                  <tr>
                    <td>Valor líquido</td>
                    <td>R$ 0,00</td>
                  </tr>
                  <tr>
                    <td>Impostos</td>
                    <td>R$ 0,00</td>
                  </tr>
                  <tr>
                    <td>Conta de pagamento</td>
                    <td>Pendente</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.pdfTotals}>
              <div>
                <span>Líquido a pagar</span>
                <strong>R$ 0,00</strong>
              </div>
            </div>
          </div>
        </aside>

        <main className={styles.form}>
          <FormPayable payable={null} edit={true} variant="document" />
        </main>

        <aside className={styles.sidebar}>
          <section>
            <h4>Composição</h4>
            <div className={styles.composition}>
              <div>
                <span>Valor líquido</span>
                <strong>R$ 0,00</strong>
              </div>
              <div>
                <span>Impostos</span>
                <strong>R$ 0,00</strong>
              </div>
              <div>
                <span>Descontos</span>
                <strong>R$ 0,00</strong>
              </div>
            </div>
            <div className={styles.netBlock}>
              <span>Líquido a pagar</span>
              <strong>R$ 0,00</strong>
              <small>vence após informar os dados</small>
            </div>
          </section>

          <section>
            <h4>Títulos Previstos</h4>
            <div className={styles.titleCard}>
              <span>Documento principal</span>
              <strong>Aguardando valor</strong>
            </div>
          </section>

          <section>
            <h4>Validação</h4>
            <div className={styles.validations}>
              <span>Fornecedor pendente</span>
              <span>Dados de pagamento pendentes</span>
              <span>Categorização pendente</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
