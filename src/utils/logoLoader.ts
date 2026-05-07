// Carrega o logo como data URL para uso no PDF
let cachedLogo: string | null = null
let loading: Promise<string> | null = null

export async function getLogoDataUrl(): Promise<string> {
  if (cachedLogo) return cachedLogo
  if (loading) return loading

  loading = (async () => {
    try {
      const res = await fetch('/images/logo-leidomecenato-official.svg')
      const blob = await res.blob()
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          cachedLogo = result
          resolve(result)
        }
        reader.onerror = () => resolve('')
        reader.readAsDataURL(blob)
      })
    } catch {
      return ''
    }
  })()

  return loading
}
