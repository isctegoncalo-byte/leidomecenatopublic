import { useState, useEffect, useRef } from 'react'
import { BrandIdentity, getBrandIdentity, saveBrandIdentity, resetBrandIdentity, DEFAULT_BRAND } from '../utils/brandIdentity'
import { importBrandFolder, exportBrandAsJson, exportBrandAsTypeScript, downloadFolderTemplate, ImportReport } from '../utils/brandImporter'
import { notifyBrandUpdated } from '../hooks/useBrand'

export default function AdminBrandTab() {
  const [brand, setBrand] = useState<BrandIdentity>(DEFAULT_BRAND)
  const [saved, setSaved] = useState(false)
  const [importReport, setImportReport] = useState<ImportReport | null>(null)
  const [importing, setImporting] = useState(false)
  const folderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setBrand(getBrandIdentity()) }, [])

  const handleFolderUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setImporting(true)
    try {
      const { brand: imported, report } = await importBrandFolder(files, brand)
      setBrand(imported)
      setImportReport(report)
      setSaved(false)
    } catch (e) {
      alert('Erro ao importar pasta: ' + (e instanceof Error ? e.message : String(e)))
    }
    setImporting(false)
  }

  const update = <K extends keyof BrandIdentity>(field: K, value: BrandIdentity[K]) => {
    setBrand(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const updateArray = (field: 'keyMessages' | 'doRules' | 'dontRules' | 'paletteSecondary', idx: number, value: string) => {
    setBrand(prev => {
      const arr = [...prev[field]]
      arr[idx] = value
      return { ...prev, [field]: arr }
    })
    setSaved(false)
  }

  const addArrayItem = (field: 'keyMessages' | 'doRules' | 'dontRules' | 'paletteSecondary') => {
    setBrand(prev => ({ ...prev, [field]: [...prev[field], field === 'paletteSecondary' ? '#000000' : ''] }))
    setSaved(false)
  }

  const removeArrayItem = (field: 'keyMessages' | 'doRules' | 'dontRules' | 'paletteSecondary', idx: number) => {
    setBrand(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }))
    setSaved(false)
  }

  const handleLogoUpload = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update('logoUrl', String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const handleLogoMonoUpload = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update('logoMonoUrl', String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    saveBrandIdentity(brand)
    notifyBrandUpdated()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    if (confirm('Repor identidade aos valores por defeito?')) {
      resetBrandIdentity()
      setBrand(DEFAULT_BRAND)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900">🎨 Kit de Identidade da Marca</h2>
          <p className="text-sm text-slate-500">Os valores aqui guardados são aplicados em todos os documentos gerados.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportBrandAsTypeScript(brand)} className="bg-slate-800 text-white text-sm px-4 py-2 rounded-xl">Exportar código</button>
          <button onClick={handleReset} className="bg-slate-200 text-slate-700 text-sm px-4 py-2 rounded-xl">Repor</button>
          <button onClick={handleSave}
            className={`text-white text-sm font-bold px-5 py-2 rounded-xl transition ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {saved ? '✓ Guardado' : '💾 Guardar Identidade'}
          </button>
        </div>
      </div>

      {/* IMPORT/EXPORT */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-3xl p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-4xl">📦</div>
          <div className="flex-1">
            <h3 className="font-black text-slate-900 text-lg">Importar Pasta de Identidade</h3>
            <p className="text-sm text-slate-600 mt-1">
              Faça upload de uma pasta com todos os ficheiros da identidade da marca (logos, JSON com cores, ficheiros de texto com regras...). Os campos abaixo são preenchidos automaticamente.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-4">
          {/* Upload de pasta inteira */}
          <label className={`bg-white border-2 border-dashed border-indigo-300 rounded-2xl p-4 text-center cursor-pointer hover:bg-indigo-50 transition ${importing ? 'opacity-50' : ''}`}>
            <div className="text-3xl mb-2">📁</div>
            <p className="font-bold text-indigo-700 text-sm">Carregar Pasta</p>
            <p className="text-xs text-slate-500 mt-1">{importing ? 'A processar...' : 'Selecionar uma pasta inteira'}</p>
            <input
              ref={folderInputRef}
              type="file"
              {...({ webkitdirectory: '', directory: '' } as any)}
              multiple
              onChange={e => handleFolderUpload(e.target.files)}
              className="hidden"
              disabled={importing}
            />
          </label>

          {/* Upload de ficheiros individuais */}
          <label className="bg-white border-2 border-dashed border-blue-300 rounded-2xl p-4 text-center cursor-pointer hover:bg-blue-50 transition">
            <div className="text-3xl mb-2">📄</div>
            <p className="font-bold text-blue-700 text-sm">Carregar Ficheiros</p>
            <p className="text-xs text-slate-500 mt-1">Selecionar vários ficheiros</p>
            <input
              type="file"
              multiple
              onChange={e => handleFolderUpload(e.target.files)}
              className="hidden"
            />
          </label>

          {/* Download exemplo */}
          <button onClick={downloadFolderTemplate}
            className="bg-white border-2 border-slate-300 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-50 transition">
            <div className="text-3xl mb-2">📥</div>
            <p className="font-bold text-slate-700 text-sm">Guia de Estrutura</p>
            <p className="text-xs text-slate-500 mt-1">Descarregar exemplo</p>
          </button>
        </div>

        {/* Lista de ficheiros aceites */}
        <details className="text-xs text-slate-600">
          <summary className="cursor-pointer font-bold text-indigo-700 hover:text-indigo-900">Ver ficheiros aceites na pasta</summary>
          <div className="mt-3 grid md:grid-cols-2 gap-x-6 gap-y-1 bg-white rounded-xl p-4">
            <code><strong>brand.json</strong> — todos os campos num único JSON</code>
            <code><strong>logo.png</strong> — logótipo principal</code>
            <code><strong>logo-mono.png</strong> — logótipo monocromático</code>
            <code><strong>paleta.json</strong> — cores em JSON</code>
            <code><strong>contactos.json</strong> — email/telefone/redes</code>
            <code><strong>nome.txt</strong> — nome da marca</code>
            <code><strong>tagline.txt</strong> — slogan</code>
            <code><strong>descricao.txt</strong> — descrição longa</code>
            <code><strong>tom-de-voz.txt</strong> — tom de comunicação</code>
            <code><strong>mensagens-chave.txt</strong> — uma mensagem por linha</code>
            <code><strong>fazer.txt</strong> — regras "FAZER"</code>
            <code><strong>nao-fazer.txt</strong> — regras "NÃO FAZER"</code>
            <code><strong>disclaimer.txt</strong> — disclaimer legal</code>
          </div>
        </details>

        {/* Export atual */}
        <div className="mt-4 pt-4 border-t border-indigo-200 flex justify-between items-center">
          <p className="text-xs text-slate-500">Exporta a identidade atual para guardares, versionares ou aplicares no código</p>
          <div className="flex gap-2">
            <button onClick={() => exportBrandAsJson(brand)}
              className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg">
              📤 JSON
            </button>
            <button onClick={() => exportBrandAsTypeScript(brand)}
              className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-lg">
              💻 Código TS
            </button>
          </div>
        </div>

        <div className="mt-3 bg-white border border-indigo-100 rounded-xl p-3 text-xs text-slate-600">
          <strong>Guardar em código:</strong> depois de ajustares a identidade, clica em <strong>💻 Código TS</strong> para descarregar um ficheiro TypeScript com todos os valores atuais. Esse ficheiro pode ser colocado no repositório para que a identidade fique versionada e não dependa apenas do armazenamento local do browser.
        </div>

        {/* Relatório de importação */}
        {importReport && (
          <div className="mt-4 pt-4 border-t border-indigo-200 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">📋 Relatório de Importação</h4>
            {importReport.applied.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-xs font-bold text-green-800 mb-1">✓ Aplicado ({importReport.applied.length}):</p>
                <ul className="text-xs text-green-700 space-y-0.5">
                  {importReport.applied.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
            )}
            {importReport.ignored.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-800 mb-1">⚠ Ignorado ({importReport.ignored.length}):</p>
                <p className="text-xs text-amber-700">{importReport.ignored.join(', ')}</p>
              </div>
            )}
            {importReport.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs font-bold text-red-800 mb-1">✕ Erros:</p>
                <ul className="text-xs text-red-700">{importReport.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
              </div>
            )}
            <p className="text-xs text-slate-500 italic">
              Lembra-te de clicar em "💾 Guardar Identidade" para confirmar as alterações.
            </p>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="rounded-3xl p-8 shadow-lg" style={{ backgroundColor: brand.primaryColor, color: '#ffffff' }}>
        <div className="flex items-center gap-4 mb-4">
          {brand.logoUrl && (
            <div className="bg-white rounded-xl p-2 shadow">
              <img src={brand.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
          )}
          <div>
            <h3 className="text-3xl font-black" style={{ color: '#ffffff' }}>{brand.name}</h3>
            <p style={{ color: brand.accentColor }} className="text-sm font-semibold">{brand.tagline}</p>
          </div>
        </div>
        <p className="text-sm opacity-80">{brand.description}</p>
        <div className="flex gap-2 mt-4">
          <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: brand.primaryColor, border: '2px solid white' }} />
          <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: brand.secondaryColor }} />
          <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: brand.accentColor }} />
          {brand.paletteSecondary.map((c, i) => (
            <div key={i} className="w-10 h-10 rounded-lg" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* IDENTIDADE BÁSICA */}
      <Section title="📛 Identidade Básica">
        <Field label="Nome da Marca" value={brand.name} onChange={v => update('name', v)} />
        <Field label="Tagline / Slogan" value={brand.tagline} onChange={v => update('tagline', v)} />
        <FieldArea label="Descrição da Marca" value={brand.description} onChange={v => update('description', v)} rows={3} />
      </Section>

      {/* LOGÓTIPOS */}
      <Section title="🖼️ Logótipos">
        <div className="grid md:grid-cols-2 gap-4">
          <LogoUploader
            label="Logótipo Principal"
            url={brand.logoUrl}
            onUpload={handleLogoUpload}
            help="Logótipo a cores. PNG transparente ou JPG. Recomendado: 512×512px."
          />
          <LogoUploader
            label="Logótipo Monocromático (opcional)"
            url={brand.logoMonoUrl}
            onUpload={handleLogoMonoUpload}
            help="Versão a 1 cor para fundos escuros ou impressões."
          />
        </div>
      </Section>

      {/* CORES */}
      <Section title="🎨 Paleta de Cores">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <ColorField label="Cor Principal (header, títulos)" value={brand.primaryColor} onChange={v => update('primaryColor', v)} />
          <ColorField label="Cor Secundária (destaque)" value={brand.secondaryColor} onChange={v => update('secondaryColor', v)} />
          <ColorField label="Cor de Acento (CTAs, ícones)" value={brand.accentColor} onChange={v => update('accentColor', v)} />
          <ColorField label="Cor do Texto" value={brand.textColor} onChange={v => update('textColor', v)} />
          <ColorField label="Cor de Fundo" value={brand.backgroundColor} onChange={v => update('backgroundColor', v)} />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-slate-700">Paleta Secundária (apoio)</label>
            <button onClick={() => addArrayItem('paletteSecondary')} className="text-xs text-blue-600 font-semibold">+ Adicionar cor</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {brand.paletteSecondary.map((color, i) => (
              <div key={i} className="flex gap-2 items-center">
                <ColorField label="" value={color} onChange={v => updateArray('paletteSecondary', i, v)} compact />
                <button onClick={() => removeArrayItem('paletteSecondary', i)} className="text-red-500 text-xs">×</button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* TIPOGRAFIA */}
      <Section title="✍️ Tipografia">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Fonte Principal (títulos)" value={brand.primaryFont} onChange={v => update('primaryFont', v)} placeholder="Ex: Helvetica, Inter, Montserrat" />
          <Field label="Fonte Secundária (corpo)" value={brand.secondaryFont} onChange={v => update('secondaryFont', v)} placeholder="Ex: Helvetica, Open Sans" />
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Tamanho Base de Fonte (px)</label>
            <input type="number" value={brand.fontSizeBase}
              onChange={e => update('fontSizeBase', Number(e.target.value) || 14)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl" min={10} max={24} />
          </div>
        </div>
        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
          <p style={{ fontFamily: brand.primaryFont }} className="text-2xl font-black mb-2">Título de Exemplo (Fonte Principal)</p>
          <p style={{ fontFamily: brand.secondaryFont, fontSize: brand.fontSizeBase }} className="text-slate-600">
            Este é um exemplo de texto de corpo usando a fonte secundária e tamanho base. Adapta-se aos textos longos dos relatórios e documentos.
          </p>
        </div>
      </Section>

      {/* COMUNICAÇÃO */}
      <Section title="🗣️ Tom de Comunicação">
        <FieldArea label="Tom de Voz" value={brand.voiceTone} onChange={v => update('voiceTone', v)} rows={3}
          help="Como queres que a marca soe? (ex: profissional, próximo, técnico...)" />

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-slate-700">Mensagens-Chave</label>
            <button onClick={() => addArrayItem('keyMessages')} className="text-xs text-blue-600 font-semibold">+ Adicionar</button>
          </div>
          <div className="space-y-2">
            {brand.keyMessages.map((msg, i) => (
              <div key={i} className="flex gap-2">
                <input value={msg} onChange={e => updateArray('keyMessages', i, e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm" />
                <button onClick={() => removeArrayItem('keyMessages', i)} className="text-red-500 px-2">×</button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* REGRAS */}
      <Section title="✅ Regras de Utilização">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex justify-between mb-3">
              <h4 className="font-bold text-green-800">✅ FAZER</h4>
              <button onClick={() => addArrayItem('doRules')} className="text-xs text-green-600">+ Adicionar</button>
            </div>
            <div className="space-y-2">
              {brand.doRules.map((rule, i) => (
                <div key={i} className="flex gap-2">
                  <input value={rule} onChange={e => updateArray('doRules', i, e.target.value)}
                    className="flex-1 px-3 py-2 border border-green-200 rounded-lg text-sm bg-white" />
                  <button onClick={() => removeArrayItem('doRules', i)} className="text-red-500 px-2">×</button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex justify-between mb-3">
              <h4 className="font-bold text-red-800">❌ NÃO FAZER</h4>
              <button onClick={() => addArrayItem('dontRules')} className="text-xs text-red-600">+ Adicionar</button>
            </div>
            <div className="space-y-2">
              {brand.dontRules.map((rule, i) => (
                <div key={i} className="flex gap-2">
                  <input value={rule} onChange={e => updateArray('dontRules', i, e.target.value)}
                    className="flex-1 px-3 py-2 border border-red-200 rounded-lg text-sm bg-white" />
                  <button onClick={() => removeArrayItem('dontRules', i)} className="text-red-500 px-2">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* CONTACTOS */}
      <Section title="📞 Contactos">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Email" value={brand.contactEmail} onChange={v => update('contactEmail', v)} />
          <Field label="Telefone" value={brand.contactPhone} onChange={v => update('contactPhone', v)} />
          <Field label="Website" value={brand.website} onChange={v => update('website', v)} />

        </div>
      </Section>

      {/* DISCLAIMER */}
      <Section title="⚖️ Disclaimer Legal Base">
        <FieldArea label="Texto base usado em PDFs e documentos" value={brand.legalDisclaimer} onChange={v => update('legalDisclaimer', v)} rows={4}
          help="Este texto pode ser referenciado pelos templates através do placeholder {{disclaimer_marca}}." />
      </Section>

      {/* Save bar */}
      <div className="sticky bottom-4 flex justify-end gap-2 bg-white border border-slate-200 rounded-2xl p-3 shadow-lg">
        <button onClick={() => exportBrandAsTypeScript(brand)} className="bg-slate-800 text-white text-sm px-4 py-2 rounded-xl">Exportar código</button>
        <button onClick={handleReset} className="bg-slate-200 text-slate-700 text-sm px-4 py-2 rounded-xl">Repor</button>
        <button onClick={handleSave}
          className={`text-white text-sm font-bold px-6 py-2 rounded-xl transition ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {saved ? '✓ Identidade Guardada' : '💾 Guardar Identidade'}
        </button>
      </div>
    </div>
  )
}

// ─── HELPERS ────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
    </div>
  )
}

function FieldArea({ label, value, onChange, rows = 3, help }: { label: string; value: string; onChange: (v: string) => void; rows?: number; help?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        className="w-full px-3 py-2 border border-slate-300 rounded-xl resize-none" />
      {help && <p className="text-xs text-slate-400 mt-1">{help}</p>}
    </div>
  )
}

function ColorField({ label, value, onChange, compact }: { label: string; value: string; onChange: (v: string) => void; compact?: boolean }) {
  return (
    <div>
      {label && <label className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>}
      <div className="flex gap-2 items-center">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
        {!compact && (
          <input value={value} onChange={e => onChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm" />
        )}
      </div>
    </div>
  )
}

function LogoUploader({ label, url, onUpload, help }: { label: string; url: string; onUpload: (file?: File) => void; help: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-600 mb-2">{label}</label>
      <label className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex items-center gap-3">
        <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {url ? <img src={url} alt="Logo" className="w-full h-full object-contain p-1" /> : <span className="text-xs text-slate-400 text-center px-1">Sem logo</span>}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-blue-700 text-sm mb-1">{url ? 'Substituir' : 'Carregar'}</p>
          <p className="text-xs text-slate-500">{help}</p>
        </div>
        <input type="file" accept="image/*" onChange={e => onUpload(e.target.files?.[0])} className="hidden" />
      </label>
    </div>
  )
}
