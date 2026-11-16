# Publicação no Netlify

## Estado confirmado em 2026-11-16

- Site `leidomecenato`, domínio principal `https://leidomecenato.pt`, equipa `iscte-goncalo`.
- Deploy de produção na branch `main` está pronto; último deploy publicado confirmado em 2026-06-10.
- As variáveis públicas `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_ODS_BUCKET`, `VITE_SUPABASE_ODS_FOLDER`, os três `VITE_STRIPE_PAYMENT_LINK_*` e `VITE_GA_MEASUREMENT_ID` estão configurados no site.
- O código local atual tem alterações posteriores ao deploy publicado; publicar requer revisão, build e envio dessas alterações à branch de produção.

## Configuração do site

- Build command: `npm run build`
- Publish directory: `dist`
- Node.js: `22.12.0` (definido em `netlify.toml`)
- Branch de produção: selecionar a branch aprovada para lançamento no painel Netlify.

O script `postbuild` gera as páginas pré-renderizadas para SEO. O ficheiro `public/_redirects` é copiado para `dist` e encaminha as rotas da aplicação para `index.html`.

## Variáveis públicas no Netlify

Definir no painel, para o contexto de produção e para os deploys de preview conforme aplicável:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_ODS_BUCKET` (normalmente `images`)
- `VITE_SUPABASE_ODS_FOLDER` (normalmente `ODS`)
- `VITE_STRIPE_PAYMENT_LINK_STANDARD`
- `VITE_STRIPE_PAYMENT_LINK_PREMIUM`
- `VITE_STRIPE_PAYMENT_LINK_SOCIAL`
- `VITE_GA_MEASUREMENT_ID` (opcional)
- `VITE_META_PIXEL_ID` (opcional)
- `VITE_GOOGLE_SITE_VERIFICATION` (opcional)

As variáveis `VITE_*` são incorporadas no bundle do browser. Não colocar nelas chaves secretas.

## Segredos Supabase Edge Functions

Configurar no projeto Supabase, nunca no Netlify/frontend:

- Stripe webhook: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `RESEND_API_KEY`, `REPORT_PURCHASE_FROM`, `REPORT_PURCHASE_INTERNAL_EMAIL`.
- Notificação de registo: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ADMIN_REGISTRATION_EMAIL`, `ADMIN_NOTIFICATION_FROM`, `SITE_ORIGIN`.
- Notificação de donativo: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `ADMIN_DONATION_EMAIL`, `DONATION_NOTIFICATION_FROM`, `SITE_ORIGIN`.

## Antes de ativar o domínio de produção

1. Configurar e validar as variáveis nos ambientes de preview e produção.
2. Confirmar os URLs de redirecionamento/recuperação de email no Supabase Auth para o domínio de produção e previews autorizados.
3. Confirmar que os Payment Links usam os três produtos, valores e metadados esperados e que o retorno aponta para `/empresa/donativo?payment=success`.
4. Confirmar no Stripe o endpoint Supabase e o evento `checkout.session.completed`.
5. Publicar só depois de aplicar e rever manualmente `supabase/schema.sql` e de verificar as funções Edge no projeto Supabase.
6. Verificar rotas diretas, páginas SEO, autenticação, upload privado, pagamento em modo de teste e emails antes de mudar DNS.

Os valores reais de chaves, IDs, contas e domínio têm de ser fornecidos/configurados nos painéis pelos responsáveis. Este repositório não contém esses segredos.
