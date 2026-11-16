import { ImpactContract } from '../types'
import { calculateTotalWithVat, calculateVat, formatCurrency } from '../types'

interface Props {
  contract: ImpactContract
  onGoToPrivate: () => void
  onHome: () => void
}

export default function ImpactContractSuccessPage({ contract, onGoToPrivate, onHome }: Props) {
  const reportVat = contract.reportVat ?? calculateVat(contract.reportPrice)
  const reportTotal = contract.reportTotal ?? calculateTotalWithVat(contract.reportPrice)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-center text-white">
          <h2 className="text-3xl font-black mb-2">
            {contract.reportPrice > 0 ? 'Pedido de relatório registado' : 'Intenção de donativo registada'}
          </h2>
          <p className="text-green-100">Referência: <strong>{contract.id}</strong></p>
        </div>

        <div className="p-8">
          {/* Institution */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
            <span className="text-4xl">LM</span>
            <div>
              <p className="text-xs text-slate-500">Instituição apoiada</p>
              <h3 className="font-bold text-slate-800">{contract.institutionName}</h3>
              <p className="text-sm text-slate-500">Intenção de donativo registada na plataforma</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6">
            <h4 className="font-bold text-slate-800 mb-4">Resumo</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Referência do contrato:</span>
                <span className="font-mono text-blue-700">{contract.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Donativo (100% para a instituição):</span>
                <span className="font-bold">€ {contract.donationAmount.toLocaleString('pt-PT')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tipo:</span>
                <span className="font-bold">{contract.donationType === 'dinheiro' ? 'Financeiro' : 'Produtos/Serviços'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-slate-500">Serviço selecionado:</span>
                <span className="font-bold text-purple-600">{contract.reportTier.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Preço do relatório de impacto:</span>
                <span className="font-bold text-purple-600">{formatCurrency(contract.reportPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IVA do relatório:</span>
                <span className="font-bold text-purple-600">{formatCurrency(reportVat)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total do serviço:</span>
                <span className="font-black text-purple-700">{formatCurrency(reportTotal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Dedução IRC (140%):</span>
                <span className="font-black text-blue-600">€ {(contract.donationAmount * 1.4).toLocaleString('pt-PT')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Poupança fiscal estimada:</span>
                <span className="font-black text-green-600">€ {(contract.donationAmount * 1.4 * 0.21).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {contract.reportPrice > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-amber-900">
              <h4 className="font-bold mb-1">Pagamento a aguardar confirmação</h4>
              <p className="text-sm">O regresso do checkout não confirma o pagamento. O estado será atualizado depois de a Stripe confirmar a transação.</p>
            </div>
          )}

          {/* Report status */}
          {contract.reportPrice > 0 && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
              <h4 className="font-bold text-purple-800 mb-1">Disponibilização do relatório</h4>
              <p className="text-purple-700 text-sm mb-3">
                O relatório só fica disponível depois da confirmação Stripe do pagamento e da confirmação do donativo pela empresa e pela instituição.
              </p>
              <ol className="text-xs text-purple-600 space-y-1 list-decimal list-inside">
                <li>Confirme o donativo na área privada</li>
                <li>Aguarde a confirmação da instituição beneficiária</li>
                <li>Consulte o estado do pagamento e o relatório na área privada</li>
              </ol>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={onGoToPrivate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition">
              Ir para Área Privada
            </button>
            <button onClick={onHome}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-2xl transition">
              Voltar ao Início
            </button>
          </div>

          <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-700 text-center">
            <p><strong>Lembrete:</strong> A Lei do Mecenato é uma iniciativa privada independente. Não somos um organismo público. O donativo foi feito diretamente à instituição, e a plataforma não reteve qualquer valor. Este serviço refere-se apenas ao relatório de impacto do donativo.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
