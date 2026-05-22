import { SocialTemplate } from '../templates/socialTemplates'

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsText(file)
  })
}

function slug(input: string) {
  return input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function importCommunicationTemplate(file: File): Promise<SocialTemplate> {
  const text = await readFileAsText(file)
  const ext = (file.name.split('.').pop() || '').toLowerCase()

  if (ext === 'json') {
    const parsed = JSON.parse(text)
    if (!parsed.name || !parsed.internalComms?.body) {
      throw new Error('JSON inválido. Deve conter name e internalComms.body.')
    }
    return {
      id: parsed.id || `comm-${Date.now()}-${slug(parsed.name)}`,
      name: parsed.name,
      description: parsed.description || '',
      internalComms: {
        title: parsed.internalComms.title || parsed.name,
        body: parsed.internalComms.body,
        hashtags: [],
        callToAction: parsed.internalComms.callToAction || '',
      },
    }
  }

  if (ext === 'txt') {
    const lines = text.split('\n')
    const firstLine = lines.find(l => l.trim()) || file.name.replace(/\.txt$/i, '')
    return {
      id: `comm-${Date.now()}-${slug(firstLine)}`,
      name: firstLine.replace(/^#\s*/, '').trim(),
      description: `Importado de ${file.name}`,
      internalComms: {
        title: firstLine.replace(/^#\s*/, '').trim(),
        body: text.trim(),
        hashtags: [],
        callToAction: '',
      },
    }
  }

  throw new Error('Formato não suportado. Use .json ou .txt')
}

export function downloadCommunicationTemplateExample() {
  const example = {
    id: 'template-exemplo-comunicacao',
    name: 'Template Exemplo — Comunicação Interna',
    description: 'Modelo de email interno para colaboradores.',
    internalComms: {
      title: 'O impacto gerado por {{empresa}}',
      body: `Caros colaboradores,

A {{empresa}} efetuou um donativo de €{{donativo}} à {{instituicao}}.

Este apoio gerou impacto direto em {{beneficiarios}} beneficiários.

ODS alinhados: {{ods_numeros}}

Necessidades apoiadas:
- {{necessidade_1}}
- {{necessidade_2}}

Obrigado por fazerem parte deste compromisso.`,
      callToAction: 'O relatório completo ficará disponível na área privada.',
    },
  }

  const blob = new Blob([JSON.stringify(example, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template-comunicacao-exemplo.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}
