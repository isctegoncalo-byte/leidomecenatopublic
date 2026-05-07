import { useEffect, useState } from 'react'
import { BrandIdentity, getBrandIdentity } from '../utils/brandIdentity'

const BRAND_KEY = 'leidomecenato_brand_identity'

// Hook reativo: regista listeners para alterações no localStorage
// e atualiza a identidade automaticamente em todo o site.
export function useBrand(): BrandIdentity {
  const [brand, setBrand] = useState<BrandIdentity>(() => getBrandIdentity())

  useEffect(() => {
    const refresh = () => setBrand(getBrandIdentity())

    // Listener para alterações no localStorage (ex: outra tab)
    window.addEventListener('storage', refresh)

    // Polling leve para apanhar mudanças na própria tab (mesmo localStorage)
    const interval = setInterval(refresh, 1500)

    // Custom event opcional
    window.addEventListener('brand-updated', refresh)

    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('brand-updated', refresh)
      clearInterval(interval)
    }
  }, [])

  return brand
}

// Helper para disparar o evento manualmente quando a identidade muda
export function notifyBrandUpdated() {
  window.dispatchEvent(new Event('brand-updated'))
  // touch the storage key so other tabs also pick up
  const v = localStorage.getItem(BRAND_KEY)
  if (v) localStorage.setItem(BRAND_KEY, v)
}
