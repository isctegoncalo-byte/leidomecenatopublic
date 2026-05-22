/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_ODS_BUCKET?: string
  readonly VITE_SUPABASE_ODS_FOLDER?: string
  readonly VITE_STRIPE_PAYMENT_LINK_STANDARD?: string
  readonly VITE_STRIPE_PAYMENT_LINK_PREMIUM?: string
  readonly VITE_STRIPE_PAYMENT_LINK_SOCIAL?: string
  readonly VITE_STRIPE_PAYMENT_LINK_REPORTS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
