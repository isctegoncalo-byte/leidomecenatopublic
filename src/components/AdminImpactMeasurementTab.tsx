import { useEffect, useMemo, useState } from 'react'
import { SDG_DATA } from '../data/sdgs'
import {
  applySroiProxyToInputs,
  calculateIcsScore,
  calculateImpactScore,
  calculateIrodScore,
  calculateIspScore,
  calculateSroi,
  defaultIspMeasurement,
  downloadIspWordReport,
  getDonationImpactContext,
  getIspMeasurement,
  icsInterpretation,
  icsResultParagraphs,
  impactScoreInterpretation,
  impactScoreResultParagraphs,
  IspDonationItem,
  IspMeasurement,
  irodInterpretation,
  irodResultParagraphs,
  ISP_DIMENSIONS,
  ispResultParagraphs,
  saveIspMeasurement,
  SROI_PROXY_LIBRARY,
  sroiInterpretation,
  sroiResultParagraphs,
  suggestSroiProxy,
  suggestSroiProxyRecommendation,
} from '../utils/ispMeasurement'
import { listProofs } from '../utils/proofStore'
import { listProjectInstitutions } from '../utils/projectCatalog'
import { listImpactMeasurementsReal, realBackendEnabled, saveImpactMeasurementReal } from '../utils/supabaseBackend'

const fieldClass = 'w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100'

function buildItems(): IspDonationItem[] {
  const institutions = listProjectInstitutions()
  return listProofs()
    .map(proof => {
      const institution = institutions.find(inst => inst.name === proof.institutionName || inst.id === proof.institutionAccountId)
      const project = institution?.needs.find(need => proof.selectedNeedIds?.includes(need.id)) || institution?.needs[0]
      return {
        proof,
        institution,
        project,
        companyName: proof.companyName || proof.companyEmail || proof.companyAccountId || 'Empresa nao identificada',
      }
    })
    .sort((a, b) => String(b.proof.confirmedAt || b.proof.date).localeCompare(String(a.proof.confirmedAt || a.proof.date)))
}

function scoreTone(value: number) {
  if (value >= 80) return 'text-green-700 bg-green-50 border-green-200'
  if (value >= 55) return 'text-blue-700 bg-blue-50 border-blue-200'
  return 'text-amber-700 bg-amber-50 border-amber-200'
}

function ispInterpretation(value: number) {
  if (value >= 85) return 'Impacto gerado muito elevado'
  if (value >= 70) return 'Impacto gerado elevado'
  if (value >= 50) return 'Impacto gerado moderado'
  return 'Impacto gerado a reforçar'
}

function clampInput(value: string) {
  return Math.max(0, Math.min(5, Number(value) || 0))
}

function numberInput(value: string) {
  return Math.max(0, Number(value) || 0)
}

export default function AdminImpactMeasurementTab() {
  const [items, setItems] = useState<IspDonationItem[]>(() => buildItems())
  const [selectedId, setSelectedId] = useState('')
  const [measurementVersion, setMeasurementVersion] = useState(0)
  const [syncStatus, setSyncStatus] = useState('')
  const selected = items.find(item => item.proof.id === selectedId) || items[0] || null
  const [measurement, setMeasurement] = useState<IspMeasurement | null>(() => selected ? getIspMeasurement(selected) : null)
  const isp = measurement ? calculateIspScore(measurement) : 0
  const irod = selected && measurement ? calculateIrodScore(selected, measurement) : null
  const ics = selected && measurement ? calculateIcsScore(selected, measurement) : null
  const impactScore = selected && measurement ? calculateImpactScore(selected, measurement) : null
  const sroi = selected && measurement ? calculateSroi(selected, measurement) : null
  const donationImpact = selected ? getDonationImpactContext(selected) : null
  const proxyRecommendation = selected ? suggestSroiProxyRecommendation(selected) : null
  const suggestedProxy = selected ? suggestSroiProxy(selected) : null
  const ispParagraphs = measurement ? ispResultParagraphs(measurement) : null
  const irodParagraphs = selected && measurement ? irodResultParagraphs(selected, measurement) : null
  const icsParagraphs = selected && measurement ? icsResultParagraphs(selected, measurement) : null
  const sroiParagraphs = selected && measurement ? sroiResultParagraphs(selected, measurement) : null
  const impactScoreParagraphs = selected && measurement ? impactScoreResultParagraphs(selected, measurement) : null

  useEffect(() => {
    if (selected) setMeasurement(getIspMeasurement(selected))
    else setMeasurement(null)
  }, [selected?.proof.id])

  useEffect(() => {
    if (!realBackendEnabled()) return
    let alive = true
    listImpactMeasurementsReal().then(result => {
      if (!alive) return
      if (!result.ok) {
        setSyncStatus(`Supabase: ${result.error}`)
        return
      }
      result.measurements.forEach(saveIspMeasurement)
      if (selected) {
        const remote = result.measurements.find(entry => entry.proofId === selected.proof.id)
        if (remote) setMeasurement(getIspMeasurement(selected))
      }
      setMeasurementVersion(version => version + 1)
      setSyncStatus(result.measurements.length ? 'Medições sincronizadas com Supabase.' : 'Supabase ativo; ainda sem medições guardadas.')
    })
    return () => { alive = false }
  }, [])

  const dashboard = useMemo(() => {
    const measured = items.map(item => getIspMeasurement(item))
    const avgIsp = measured.length ? Math.round(measured.reduce((sum, entry) => sum + calculateIspScore(entry), 0) / measured.length) : 0
    const avgIrod = items.length ? Math.round(items.reduce((sum, item) => sum + calculateIrodScore(item, getIspMeasurement(item)).score, 0) / items.length) : 0
    const avgIcs = items.length ? Math.round(items.reduce((sum, item) => sum + calculateIcsScore(item, getIspMeasurement(item)).score, 0) / items.length) : 0
    const avgImpactScore = items.length ? Math.round(items.reduce((sum, item) => sum + calculateImpactScore(item, getIspMeasurement(item)).score, 0) / items.length) : 0
    const avgSroi = items.length ? items.reduce((sum, item) => sum + calculateSroi(item, getIspMeasurement(item)).ratio, 0) / items.length : 0
    const sdgCounts = measured.flatMap(entry => entry.sdgs).reduce<Record<number, number>>((acc, sdg) => {
      acc[sdg.sdgNumber] = (acc[sdg.sdgNumber] || 0) + 1
      return acc
    }, {})
    return { measured, avgIsp, avgIrod, avgIcs, avgImpactScore, avgSroi, sdgCounts }
  }, [items, measurementVersion])

  const persist = (next: IspMeasurement) => {
    saveIspMeasurement(next)
    setMeasurement(next)
    setMeasurementVersion(version => version + 1)
    if (selected && realBackendEnabled()) {
      setSyncStatus('A guardar medição no Supabase...')
      void saveImpactMeasurementReal(selected, next).then(result => {
        setSyncStatus(result.ok ? 'Medição guardada no Supabase.' : `Guardada localmente; erro Supabase: ${result.error}`)
      })
    } else {
      setSyncStatus('Medição guardada localmente.')
    }
  }

  const refresh = () => setItems(buildItems())

  const applyProxy = (proxyId: string) => {
    if (!selected) return
    const proxy = SROI_PROXY_LIBRARY.find(option => option.id === proxyId)
    if (!proxy) return
    persist({
      ...measurement,
      sroi: applySroiProxyToInputs(measurement.sroi, proxy, selected),
    })
  }

  if (!selected || !measurement) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Medição ESG e Impacto | Metodologia ISP™</h2>
          <p className="text-sm text-slate-500">Apenas disponível na área de administração.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Ainda não existem donativos registados para medir. Faça um donativo de teste ou confirme um donativo existente.
        </div>
      </div>
    )
  }

  const addSdg = () => {
    const used = new Set(measurement.sdgs.map(sdg => sdg.sdgNumber))
    const next = SDG_DATA.find(sdg => !used.has(sdg.n)) || SDG_DATA[0]
    persist({
      ...measurement,
      sdgs: [
        ...measurement.sdgs,
        { sdgNumber: next.n, sdgName: next.fullLabel, contributionLevel: 'Medio', evidence: '' },
      ],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#526879]">Impacto que gera Valor</p>
          <h2 className="text-2xl font-black text-[#0E2433]">Medição ESG e Impacto | Metodologia Proprietária ISP™</h2>
          <p className="text-sm text-slate-500">Pontuação privada por donativo, dashboards ODS e exportação editável em Word.</p>
          {syncStatus && <p className="mt-2 text-xs font-bold text-[#526879]">{syncStatus}</p>}
        </div>
        <button onClick={refresh} className="rounded-xl bg-[#0E2433] px-4 py-2 text-sm font-black text-white hover:bg-[#06151D]">
          Atualizar donativos
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
        <MetricCard label="Donativos medidos" value={items.length} />
        <MetricCard label="Impact Score médio" value={dashboard.avgImpactScore} suffix="/100" tone={scoreTone(dashboard.avgImpactScore)} />
        <MetricCard label="ISP médio" value={dashboard.avgIsp} suffix="/100" tone={scoreTone(dashboard.avgIsp)} />
        <MetricCard label="IROD médio" value={dashboard.avgIrod} suffix="/100" tone={scoreTone(dashboard.avgIrod)} />
        <MetricCard label="ICS médio" value={dashboard.avgIcs} suffix="/100" tone={scoreTone(dashboard.avgIcs)} />
        <MetricCard label="SROI medio" value={`${dashboard.avgSroi.toFixed(2)}x`} tone="text-purple-700 bg-purple-50 border-purple-200" />
        <MetricCard label="ODS cobertos" value={Object.keys(dashboard.sdgCounts).length} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="overflow-hidden rounded-2xl border border-[#D7E2EA] bg-white">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-black text-[#0E2433]">Donativos</h3>
            <p className="text-xs text-slate-500">Selecione o donativo a medir pela metodologia ISP™.</p>
          </div>
          <div className="max-h-[720px] divide-y divide-slate-100 overflow-y-auto">
            {items.map(item => {
              const itemMeasurement = getIspMeasurement(item)
              const itemIsp = calculateIspScore(itemMeasurement)
              const itemIrod = calculateIrodScore(item, itemMeasurement).score
              const itemIcs = calculateIcsScore(item, itemMeasurement).score
              const itemImpactScore = calculateImpactScore(item, itemMeasurement).score
              const itemSroi = calculateSroi(item, itemMeasurement).ratio
              return (
                <button
                  key={item.proof.id}
                  onClick={() => setSelectedId(item.proof.id)}
                  className={`w-full p-5 text-left transition ${selected.proof.id === item.proof.id ? 'bg-[#EFF6FF]' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-[#0E2433]">{item.companyName}</p>
                      <p className="truncate text-sm text-slate-600">{item.proof.institutionName}</p>
                      <p className="mt-1 text-xs text-slate-500">EUR {(item.proof.confirmedAmount || item.proof.amount).toLocaleString('pt-PT')} - {item.proof.status}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${scoreTone(itemImpactScore)}`}>Impact {itemImpactScore}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${scoreTone(itemIsp)}`}>ISP {itemIsp}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${scoreTone(itemIrod)}`}>IROD {itemIrod}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${scoreTone(itemIcs)}`}>ICS {itemIcs}</span>
                      <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">SROI {itemSroi.toFixed(2)}x</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl bg-[#0E2433] p-6 text-white">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8BA5B5]">Metodologia Proprietária ISP™</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <p className="text-sm text-[#C7D7DE]">Impact Score</p>
                <p className="text-6xl font-black text-white">{impactScore?.score || 0}</p>
                <p className="text-xs text-[#C7D7DE]">{impactScore ? impactScoreInterpretation(impactScore.score) : 'Pontuação composta'}</p>
              </div>
              <div>
                <p className="text-sm text-[#C7D7DE]">ISP</p>
                <p className="text-5xl font-black text-[#E2EDF3]">{isp}</p>
                <p className="text-xs text-[#C7D7DE]">Resultado de 0 a 100</p>
              </div>
              <div>
                <p className="text-sm text-[#C7D7DE]">IROD</p>
                <p className="text-5xl font-black text-[#06B6D4]">{irod?.score || 0}</p>
                <p className="text-xs text-[#C7D7DE]">{irod ? irodInterpretation(irod.score) : 'Retorno de impacto'}</p>
              </div>
              <div>
                <p className="text-sm text-[#C7D7DE]">ICS</p>
                <p className="text-5xl font-black text-[#7BF1A8]">{ics?.score || 0}</p>
                <p className="text-xs text-[#C7D7DE]">{ics ? icsInterpretation(ics.score) : 'Credibilidade'}</p>
              </div>
              <div>
                <p className="text-sm text-[#C7D7DE]">SROI</p>
                <p className="text-5xl font-black text-[#C084FC]">{sroi ? sroi.ratio.toFixed(2) : '0.00'}x</p>
                <p className="text-xs text-[#C7D7DE]">{sroi ? sroiInterpretation(sroi.ratio) : 'Retorno social'}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1">{selected.companyName}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{selected.proof.institutionName}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{selected.project?.projectName || selected.project?.subcategory || 'Projeto não identificado'}</span>
            </div>
          </div>

          {donationImpact && (
            <Panel title="Impacto específico do donativo">
              <div className="grid gap-3 md:grid-cols-3">
                <ImpactPill label="Valor doado" value={`EUR ${donationImpact.donationAmount.toLocaleString('pt-PT')}`} />
                <ImpactPill label="Custo total do projeto" value={`EUR ${donationImpact.projectCost.toLocaleString('pt-PT')}`} />
                <ImpactPill label="Cobertura do projeto" value={`${donationImpact.coveragePercent.toFixed(1)}%`} highlight />
                <ImpactPill label="Beneficiários atribuíveis" value={donationImpact.coveredDirectBeneficiaries.toLocaleString('pt-PT')} />
                <ImpactPill label="Custo por beneficiário" value={`EUR ${donationImpact.costPerDirectBeneficiary.toFixed(2)}`} />
                <ImpactPill label="Impacto por euro" value={`${donationImpact.impactPerEuro.toFixed(4)} benef./EUR`} />
              </div>
              <div className="mt-4">
                <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-wide text-slate-500">
                  <span>Valor doado face ao custo total do projeto</span>
                  <span>{donationImpact.coveragePercent.toFixed(1)}%</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-[#E2EDF3]">
                  <div
                    className="h-full rounded-full bg-[#F59E0B]"
                    style={{ width: `${Math.max(2, Math.min(100, donationImpact.coveragePercent))}%` }}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Esta leitura evita atribuir ao donativo todo o impacto potencial do projeto quando o valor doado financia apenas uma parte do custo total.
              </p>
            </Panel>
          )}

          {sroi && (
            <Panel title="Social Return on Investment | SROI">
              <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="rounded-2xl bg-[#2E1065] p-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-200">Retorno social estimado</p>
                  <p className="mt-2 text-6xl font-black text-[#C084FC]">{sroi.ratio.toFixed(2)}x</p>
                  <p className="text-sm text-purple-100">{sroiInterpretation(sroi.ratio)}</p>
                  <p className="mt-4 text-xs leading-relaxed text-purple-100">
                    A SROI estima quantos euros de valor social sao gerados por cada euro doado, com base nos beneficiarios, valor social estimado e ajustes de atribuicao.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <ImpactPill label="Valor social bruto" value={`EUR ${sroi.grossSocialValue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}`} />
                  <ImpactPill label="Valor social ajustado" value={`EUR ${sroi.adjustedSocialValue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}`} highlight />
                  <ImpactPill label="Valor liquido social" value={`EUR ${sroi.netSocialValue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}`} />
                  <ImpactPill label="Valor do donativo" value={`EUR ${sroi.donationAmount.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}`} />
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-700">Proxy financeira aplicada</p>
                    <h4 className="mt-1 text-base font-black text-slate-900">
                      {measurement.sroi.proxyLabel || suggestedProxy?.label || 'Proxy a definir'}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-purple-900">
                      {measurement.sroi.proxyRationale || suggestedProxy?.rationale || 'Selecione uma proxy para documentar a premissa usada no calculo.'}
                    </p>
                    {(measurement.sroi.proxySource || suggestedProxy?.source) && (
                      <p className="mt-2 text-xs text-purple-800">
                        <strong>Fonte/metodo:</strong> {measurement.sroi.proxySource || suggestedProxy?.source}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
                      <span className="rounded-full bg-white px-2.5 py-1 text-purple-800">
                        ConfianÃ§a da sugestÃ£o: {measurement.sroi.proxyConfidence ?? proxyRecommendation?.confidence ?? 0}%
                      </span>
                      {(measurement.sroi.proxyMatchedSdgs?.length || proxyRecommendation?.matchedSdgs.length) ? (
                        <span className="rounded-full bg-white px-2.5 py-1 text-purple-800">
                          {(measurement.sroi.proxyMatchedSdgs || proxyRecommendation?.matchedSdgs || []).map(sdg => `ODS ${sdg}`).join(', ')}
                        </span>
                      ) : null}
                    </div>
                    {(measurement.sroi.proxyMatchedKeywords?.length || proxyRecommendation?.matchedKeywords.length) ? (
                      <p className="mt-2 text-xs text-purple-800">
                        <strong>Sinais usados:</strong> {(measurement.sroi.proxyMatchedKeywords || proxyRecommendation?.matchedKeywords || []).slice(0, 8).join(', ')}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:min-w-[430px]">
                    <select
                      value={measurement.sroi.proxyId || suggestedProxy?.id || ''}
                      onChange={event => applyProxy(event.target.value)}
                      className={fieldClass}
                    >
                      {SROI_PROXY_LIBRARY.map(proxy => (
                        <option key={proxy.id} value={proxy.id}>
                          {proxy.category} - {proxy.label}
                        </option>
                      ))}
                    </select>
                    {suggestedProxy && (
                      <button
                        type="button"
                        onClick={() => applyProxy(suggestedProxy.id)}
                        className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-black text-white hover:bg-purple-800"
                      >
                        Aplicar sugestao
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Field label="Fonte/metodo da proxy">
                  <input value={measurement.sroi.proxySource || ''} onChange={event => persist({ ...measurement, sroi: { ...measurement.sroi, proxySource: event.target.value } })} className={fieldClass} />
                </Field>
                <Field label="Justificacao da proxy">
                  <input value={measurement.sroi.proxyRationale || ''} onChange={event => persist({ ...measurement, sroi: { ...measurement.sroi, proxyRationale: event.target.value } })} className={fieldClass} />
                </Field>
                <Field label="Valor social por beneficiario direto">
                  <input type="number" value={measurement.sroi.valuePerDirectBeneficiary} onChange={event => persist({ ...measurement, sroi: { ...measurement.sroi, valuePerDirectBeneficiary: numberInput(event.target.value) } })} className={fieldClass} />
                </Field>
                <Field label="Valor social por beneficiario indireto">
                  <input type="number" value={measurement.sroi.valuePerIndirectBeneficiary} onChange={event => persist({ ...measurement, sroi: { ...measurement.sroi, valuePerIndirectBeneficiary: numberInput(event.target.value) } })} className={fieldClass} />
                </Field>
                <Field label="Atribuicao ao donativo (%)">
                  <input type="number" min={0} max={100} value={measurement.sroi.attributionPercent} onChange={event => persist({ ...measurement, sroi: { ...measurement.sroi, attributionPercent: Math.min(100, numberInput(event.target.value)) } })} className={fieldClass} />
                </Field>
                <Field label="Deadweight (%)">
                  <input type="number" min={0} max={100} value={measurement.sroi.deadweightPercent} onChange={event => persist({ ...measurement, sroi: { ...measurement.sroi, deadweightPercent: Math.min(100, numberInput(event.target.value)) } })} className={fieldClass} />
                </Field>
                <Field label="Deslocacao (%)">
                  <input type="number" min={0} max={100} value={measurement.sroi.displacementPercent} onChange={event => persist({ ...measurement, sroi: { ...measurement.sroi, displacementPercent: Math.min(100, numberInput(event.target.value)) } })} className={fieldClass} />
                </Field>
                <Field label="Duracao do impacto (anos)">
                  <input type="number" min={1} max={10} value={measurement.sroi.durationYears} onChange={event => persist({ ...measurement, sroi: { ...measurement.sroi, durationYears: Math.max(1, Math.min(10, numberInput(event.target.value))) } })} className={fieldClass} />
                </Field>
                <Field label="Drop-off anual (%)">
                  <input type="number" min={0} max={100} value={measurement.sroi.dropoffPercent} onChange={event => persist({ ...measurement, sroi: { ...measurement.sroi, dropoffPercent: Math.min(100, numberInput(event.target.value)) } })} className={fieldClass} />
                </Field>
                <Field label="Notas SROI">
                  <input value={measurement.sroi.notes} onChange={event => persist({ ...measurement, sroi: { ...measurement.sroi, notes: event.target.value } })} className={fieldClass} />
                </Field>
              </div>
              <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-4 text-xs leading-relaxed text-purple-900">
                Formula: SROI = valor social ajustado / valor do donativo. Valor social ajustado = valor social bruto x atribuicao x (1 - deadweight) x (1 - deslocacao), considerando duracao e drop-off anual.
              </div>
              {sroiParagraphs && <NarrativeBlock title="Leitura do resultado SROI" paragraphs={sroiParagraphs} />}
            </Panel>
          )}

          {irod && (
            <Panel title="Impact Return on Donation | IROD™">
              <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="rounded-2xl bg-[#06151D] p-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8BA5B5]">Retorno de impacto</p>
                  <p className="mt-2 text-6xl font-black text-[#06B6D4]">{irod.score}</p>
                  <p className="text-sm text-[#C7D7DE]">{irodInterpretation(irod.score)}</p>
                  <p className="mt-4 text-xs leading-relaxed text-[#C7D7DE]">
                    O IROD cruza a qualidade do impacto com o valor doado, a cobertura do custo total do projeto e a eficiência em beneficiários por euro.
                  </p>
                </div>
                <div className="space-y-3">
                  <IrodBar label="Qualidade de impacto" value={irod.qualityReturn} color="#2563EB" />
                  <IrodBar label="Integridade da medição" value={irod.confidenceReturn} color="#22C55E" />
                  <IrodBar label="Cobertura do custo total" value={irod.coverageReturn} color="#F59E0B" />
                  <IrodBar label="Beneficiários por euro" value={irod.beneficiaryReturn} color="#06B6D4" />
                  <IrodBar label="Alavancagem do donativo" value={irod.leverageReturn} color="#0E2433" />
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-[#D7E2EA] bg-[#F8FAFC] p-4 text-xs leading-relaxed text-slate-600">
                Fórmula: IROD = qualidade de impacto 35% + confiança 15% + cobertura do custo total 20% + beneficiários por euro 20% + alavancagem 10%.
                A alavancagem atual é {irod.leverageMultiplier.toFixed(2)}x, calculada pela relação entre custo total do projeto e valor doado.
              </div>
              {irodParagraphs && <NarrativeBlock title="Leitura do resultado IROD" paragraphs={irodParagraphs} />}
            </Panel>
          )}

          {ics && (
            <Panel title="Impact Credibility Score | ICS™">
              <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="rounded-2xl bg-[#0E2433] p-5 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8BA5B5]">Credibilidade de impacto</p>
                  <p className="mt-2 text-6xl font-black text-[#7BF1A8]">{ics.score}</p>
                  <p className="text-sm text-[#C7D7DE]">{icsInterpretation(ics.score)}</p>
                  <p className="mt-4 text-xs leading-relaxed text-[#C7D7DE]">
                    O ICS mede se a avaliação está suportada por evidência, dados consistentes, KPIs rastreáveis, ODS associados e beneficiários bem caracterizados.
                  </p>
                </div>
                <div className="space-y-3">
                  <IrodBar label="Força da evidência" value={ics.evidenceStrength} color="#2563EB" />
                  <IrodBar label="Integridade dos dados" value={ics.dataIntegrity} color="#22C55E" />
                  <IrodBar label="Rastreabilidade de KPIs" value={ics.kpiTraceability} color="#06B6D4" />
                  <IrodBar label="Alinhamento ODS" value={ics.sdgAlignment} color="#F59E0B" />
                  <IrodBar label="Clareza dos beneficiários" value={ics.beneficiaryClarity} color="#0E2433" />
                  <IrodBar label="Prontidão de validação" value={ics.validationReadiness} color="#7BF1A8" />
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-[#D7E2EA] bg-[#F8FAFC] p-4 text-xs leading-relaxed text-slate-600">
                Fórmula: ICS = evidência 25% + integridade dos dados 20% + KPIs 20% + ODS 15% + beneficiários 10% + validação 10%.
              </div>
              {icsParagraphs && <NarrativeBlock title="Leitura do resultado ICS" paragraphs={icsParagraphs} />}
            </Panel>
          )}

          {impactScore && (
            <Panel title="Impact Score">
              <div className="rounded-2xl bg-[#F8FAFC] p-5">
                <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr] md:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#526879]">Pontuação composta</p>
                    <p className="mt-2 text-7xl font-black text-[#0E2433]">{impactScore.score}</p>
                    <p className="text-sm font-bold text-[#526879]">{impactScoreInterpretation(impactScore.score)}</p>
                  </div>
                  <div className="space-y-3">
                    <IrodBar label="ISP™ x 40%" value={impactScore.isp} color="#2563EB" />
                    <IrodBar label="IROD™ x 35%" value={impactScore.irod} color="#06B6D4" />
                    <IrodBar label="ICS™ x 25%" value={impactScore.ics} color="#22C55E" />
                  </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-slate-600">
                  Fórmula: Impact Score = ISP™ x 40% + IROD™ x 35% + ICS™ x 25%. Esta pontuação fica apenas na área de administração.
                </p>
                {impactScoreParagraphs && <NarrativeBlock title="Leitura do Impact Score" paragraphs={impactScoreParagraphs} />}
              </div>
            </Panel>
          )}

          <Panel title="Impact Scoring Protocol | ISP™">
            <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="rounded-2xl bg-[#0E2433] p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8BA5B5]">Qualidade de impacto</p>
                <p className="mt-2 text-6xl font-black text-white">{isp}</p>
                <p className="text-sm text-[#C7D7DE]">{ispInterpretation(isp)}</p>
                <p className="mt-4 text-xs leading-relaxed text-[#C7D7DE]">
                  O ISP avalia a força do impacto gerado pelo donativo através de cinco dimensões ponderadas: impacto gerado, ESG, eficiência, evidência e sustentabilidade.
                </p>
              </div>
              <div className="space-y-3">
                {ISP_DIMENSIONS.map(dimension => (
                  <IrodBar
                    key={dimension.key}
                    label={`${dimension.label} (${dimension.weight}%)`}
                    value={measurement.dimensions[dimension.key] * 20}
                    color={dimension.key === 'impactGenerated' ? '#2563EB' : dimension.key === 'esgContribution' ? '#22C55E' : dimension.key === 'efficiency' ? '#06B6D4' : dimension.key === 'evidenceQuality' ? '#F59E0B' : '#0E2433'}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-[#D7E2EA] bg-[#F8FAFC] p-4 text-xs leading-relaxed text-slate-600">
              Fórmula: ISP™ = impacto gerado 40% + contribuição ESG 25% + eficiência 15% + qualidade da evidência 10% + sustentabilidade 10%.
            </div>
            {ispParagraphs && <NarrativeBlock title="Leitura do resultado ISP" paragraphs={ispParagraphs} />}
          </Panel>

          <Panel title="Dimensões ISP™">
            <div className="space-y-4">
              {ISP_DIMENSIONS.map(dimension => (
                <div key={dimension.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-black text-[#0E2433]">{dimension.label} <span className="text-sm text-slate-400">({dimension.weight}%)</span></p>
                      <p className="mt-1 text-xs text-slate-500">{dimension.criteria.join(' · ')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={5}
                        step={0.5}
                        value={measurement.dimensions[dimension.key]}
                        onChange={event => persist({ ...measurement, dimensions: { ...measurement.dimensions, [dimension.key]: clampInput(event.target.value) } })}
                        className="w-36 accent-[#2563EB]"
                      />
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.5}
                        value={measurement.dimensions[dimension.key]}
                        onChange={event => persist({ ...measurement, dimensions: { ...measurement.dimensions, [dimension.key]: clampInput(event.target.value) } })}
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Integração com ODS">
            <div className="space-y-3">
              {measurement.sdgs.map((entry, index) => (
                <div key={`${entry.sdgNumber}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[0.9fr_0.8fr_1.4fr_auto]">
                  <select
                    value={entry.sdgNumber}
                    onChange={event => {
                      const sdgNumber = Number(event.target.value)
                      const sdg = SDG_DATA.find(item => item.n === sdgNumber)
                      const sdgs = measurement.sdgs.map((current, i) => i === index ? { ...current, sdgNumber, sdgName: sdg?.fullLabel || `ODS ${sdgNumber}` } : current)
                      persist({ ...measurement, sdgs })
                    }}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    {SDG_DATA.map(sdg => <option key={sdg.n} value={sdg.n}>ODS {sdg.n} - {sdg.fullLabel}</option>)}
                  </select>
                  <select
                    value={entry.contributionLevel}
                    onChange={event => {
                      const sdgs = measurement.sdgs.map((current, i) => i === index ? { ...current, contributionLevel: event.target.value as IspMeasurement['sdgs'][number]['contributionLevel'] } : current)
                      persist({ ...measurement, sdgs })
                    }}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    {['Baixo', 'Medio', 'Elevado', 'Transformacional'].map(level => <option key={level}>{level}</option>)}
                  </select>
                  <input
                    value={entry.evidence}
                    onChange={event => {
                      const sdgs = measurement.sdgs.map((current, i) => i === index ? { ...current, evidence: event.target.value } : current)
                      persist({ ...measurement, sdgs })
                    }}
                    placeholder="Evidências associadas ao ODS"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => persist({ ...measurement, sdgs: measurement.sdgs.filter((_, i) => i !== index) })}
                    className="rounded-xl border border-red-200 px-3 py-2 text-sm font-black text-red-600 hover:bg-red-50"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button onClick={addSdg} className="rounded-xl bg-[#EFF6FF] px-4 py-2 text-sm font-black text-[#2563EB] hover:bg-[#DBEAFE]">
                + Associar ODS
              </button>
            </div>
          </Panel>

          <Panel title="Gestão de Beneficiários">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Beneficiários diretos">
                <input type="number" value={measurement.beneficiaries.direct} onChange={event => persist({ ...measurement, beneficiaries: { ...measurement.beneficiaries, direct: numberInput(event.target.value) } })} className={fieldClass} />
              </Field>
              <Field label="Beneficiários indiretos">
                <input type="number" value={measurement.beneficiaries.indirect} onChange={event => persist({ ...measurement, beneficiaries: { ...measurement.beneficiaries, indirect: numberInput(event.target.value) } })} className={fieldClass} />
              </Field>
              <Field label="Faixa etária">
                <input value={measurement.beneficiaries.ageGroup} onChange={event => persist({ ...measurement, beneficiaries: { ...measurement.beneficiaries, ageGroup: event.target.value } })} className={fieldClass} />
              </Field>
              <Field label="Género">
                <input value={measurement.beneficiaries.gender} onChange={event => persist({ ...measurement, beneficiaries: { ...measurement.beneficiaries, gender: event.target.value } })} className={fieldClass} />
              </Field>
              <Field label="Localização">
                <input value={measurement.beneficiaries.location} onChange={event => persist({ ...measurement, beneficiaries: { ...measurement.beneficiaries, location: event.target.value } })} className={fieldClass} />
              </Field>
              <Field label="Categoria de vulnerabilidade">
                <input value={measurement.beneficiaries.vulnerabilityCategory} onChange={event => persist({ ...measurement, beneficiaries: { ...measurement.beneficiaries, vulnerabilityCategory: event.target.value } })} className={fieldClass} />
              </Field>
            </div>
          </Panel>

          <Panel title="Notas e Exportação">
            <textarea
              value={measurement.notes}
              onChange={event => persist({ ...measurement, notes: event.target.value })}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => persist(defaultIspMeasurement(selected))} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
                Recalcular defaults
              </button>
              <button onClick={() => downloadIspWordReport(selected, measurement)} className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-black text-white hover:bg-[#0E4AC8]">
                Exportar Word editável
              </button>
            </div>
          </Panel>

          <Panel title="Dashboard ODS">
            <div className="grid gap-3 md:grid-cols-3">
              {Object.entries(dashboard.sdgCounts).length === 0 ? (
                <p className="text-sm text-slate-500">Sem ODS medidos.</p>
              ) : Object.entries(dashboard.sdgCounts).map(([sdgNumber, count]) => {
                const sdg = SDG_DATA.find(item => item.n === Number(sdgNumber))
                return (
                  <div key={sdgNumber} className="rounded-xl border border-slate-200 p-4" style={{ backgroundColor: `${sdg?.color || '#2563EB'}12` }}>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">ODS {sdgNumber}</p>
                    <p className="mt-1 font-black text-[#0E2433]">{sdg?.fullLabel || `ODS ${sdgNumber}`}</p>
                    <p className="mt-2 text-sm text-slate-600">{count} donativo(s)</p>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, suffix = '', tone = 'text-[#0E2433] bg-white border-slate-200' }: { label: string; value: number | string; suffix?: string; tone?: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${tone}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}<span className="text-base">{suffix}</span></p>
    </div>
  )
}

function ImpactPill({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
      <p className={`text-[10px] font-black uppercase tracking-wide ${highlight ? 'text-amber-700' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-1 text-lg font-black text-[#0E2433]">{value}</p>
    </div>
  )
}

function IrodBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        <span>{Math.round(value)}/100</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#E2EDF3]">
        <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, value))}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function NarrativeBlock({ title, paragraphs }: { title: string; paragraphs: [string, string] }) {
  return (
    <div className="mt-4 rounded-xl border border-[#D7E2EA] bg-white p-4 text-sm leading-relaxed text-slate-700">
      <p className="text-xs font-black uppercase tracking-wide text-[#526879]">{title}</p>
      <div className="mt-2 space-y-2">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#D7E2EA] bg-white p-5">
      <h3 className="mb-4 font-black text-[#0E2433]">{title}</h3>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}
