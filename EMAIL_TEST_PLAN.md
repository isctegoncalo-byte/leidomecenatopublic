# Plano de teste de emails

## Previews locais

Abrir no servidor local:

`http://127.0.0.1:5173/email-previews/`

Gerar novamente:

`npm run emails:preview`

## Emails cobertos

- Confirmacao de conta: `supabase/email-templates/confirm-signup.html`
- Recuperacao de palavra-passe: `supabase/email-templates/reset-password.html`
- Convite de utilizador: `supabase/email-templates/invite-user.html`
- Magic link: `supabase/email-templates/magic-link.html`
- Alteracao de email: `supabase/email-templates/change-email.html`
- Notificacao de novo registo para admin: `supabase/functions/registration-notification`
- Notificacao de donativo para admin: `supabase/functions/donation-notification`
- Confirmacao de compra de relatorio: `supabase/functions/stripe-report-payment-webhook`

## Testes reais no Supabase Auth

No Dashboard do Supabase confirmar:

- Authentication > URL Configuration:
  - Site URL: `https://leidomecenato.pt`
  - Redirect URLs:
    - `https://leidomecenato.pt/*`
    - `http://127.0.0.1:5173/*`
- Authentication > Emails > Templates:
  - Colar os 5 templates em `supabase/email-templates`.
- Authentication > SMTP:
  - Configurar SMTP proprio.
  - Desativar tracking de links no fornecedor de email.

Fluxos a testar:

1. Criar uma conta empresa nova em `/entrar`.
2. Confirmar que chega email "Confirme a sua conta".
3. Clicar no link e entrar com email/password.
4. Pedir recuperacao de palavra-passe em `/entrar`.
5. Confirmar que chega email "Recuperar palavra-passe".
6. Clicar no link e definir nova palavra-passe.
7. Se usado, testar magic link e convite no painel Supabase.
8. Se usado, testar alteracao de email a partir da conta.

## Testes reais das Edge Functions

As Edge Functions precisam destas secrets no projeto Supabase:

- `RESEND_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` apenas para `registration-notification`
- `ADMIN_REGISTRATION_EMAIL`, recomendado: `geral@leidomecenato.pt`
- `ADMIN_DONATION_EMAIL`, recomendado: `geral@leidomecenato.pt`
- `ADMIN_NOTIFICATION_FROM`, recomendado: `Lei do Mecenato <geral@leidomecenato.pt>`
- `DONATION_NOTIFICATION_FROM`, recomendado: `Lei do Mecenato <geral@leidomecenato.pt>`
- `REPORT_PURCHASE_FROM`, recomendado: `Lei do Mecenato <geral@leidomecenato.pt>`

Fluxos a testar:

1. Novo registo: deve chegar email ao admin.
2. Intencao/confirmação de donativo: deve chegar email ao admin.
3. Checkout Stripe concluido: deve chegar email à empresa compradora.

## Estado local atual

O ficheiro `.env` local tem apenas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

As secrets de envio real nao devem ser expostas no cliente; devem viver no Supabase hosted.
