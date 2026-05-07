// Generates simple gradient placeholder images as data-URLs for the demo PDF.
// In production these are real photos uploaded by the institution.

function makePhoto(color1: string, color2: string, label: string): string {
  try {
    const c = document.createElement('canvas')
    c.width = 400
    c.height = 280
    const ctx = c.getContext('2d')
    if (!ctx) return ''
    const grad = ctx.createLinearGradient(0, 0, 400, 280)
    grad.addColorStop(0, color1)
    grad.addColorStop(1, color2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 400, 280)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, 200, 130)
    ctx.font = '16px sans-serif'
    ctx.fillText('Imagem de demonstração', 200, 165)
    return c.toDataURL('image/jpeg', 0.9)
  } catch {
    return ''
  }
}

let cache: string[] | null = null

export function getDemoPhotos(): string[] {
  if (cache) return cache
  cache = [
    makePhoto('#2563eb', '#1e40af', 'Sala de Aula'),
    makePhoto('#16a34a', '#15803d', 'Distribuição Alimentar'),
    makePhoto('#7c3aed', '#6d28d9', 'Fachada da Instituição'),
    makePhoto('#db2777', '#be185d', 'Equipa e Voluntários'),
  ]
  return cache
}
