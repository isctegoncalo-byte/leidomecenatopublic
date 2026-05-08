# Pagamentos, emails e recibos dos relatorios

O site usa Stripe Payment Links para cobrar os servicos de relatorio sem guardar dados de cartao no frontend.

## 1. Criar produtos no Stripe

Criar 3 Payment Links:

- Relatorio de Impacto: EUR 150
- Relatorio de Impacto Premium: EUR 250
- Relatorio de Impacto Premium + Pack Redes Sociais: EUR 400

Configurar os metodos de pagamento no Stripe Dashboard.

## 2. Configurar variaveis do frontend

Criar `.env.local` com:

```env
VITE_STRIPE_PAYMENT_LINK_STANDARD=https://buy.stripe.com/...
VITE_STRIPE_PAYMENT_LINK_PREMIUM=https://buy.stripe.com/...
VITE_STRIPE_PAYMENT_LINK_SOCIAL=https://buy.stripe.com/...
```

Depois reiniciar o Vite.

## 3. Recibo imediato de pagamento

Para o Stripe enviar recibo automatico imediatamente apos pagamento:

1. Stripe Dashboard > Settings > Customer emails.
2. Ativar `Successful payments`.
3. Confirmar marca, logo, cor, email e dados publicos em Branding/Public details.
4. Nos Payment Links, recolher o email do cliente.

O recibo automatico e enviado pelo Stripe quando o pagamento e bem-sucedido. Em modo de teste, o Stripe pode nao enviar emails automaticamente; o recibo pode ser visto no Dashboard.

Para emitir uma fatura/recibo mais completo para compras unicas, ativar `post-payment invoice`/paid invoice no Payment Link ou usar Checkout Sessions com `invoice_creation`.

## 4. Email de confirmacao da compra

Foi preparada uma base transversal para todos os packs:

- cabecalho comum `Lei do Mecenato`;
- confirmacao da compra;
- pack adquirido;
- valor pago;
- instituicao apoiada, quando existir;
- prazo de entrega;
- link do recibo Stripe, quando disponivel;
- nota de que o donativo e direto entre empresa e instituicao.

O texto especifico muda por pack:

- `standard`: confirma relatorio base.
- `premium`: confirma analise premium, Impact Score, narrativa e ESG.
- `social`: confirma premium + pack de redes sociais.

O template de frontend esta em:

```text
src/templates/reportPurchaseEmailTemplates.ts
```

A funcao de webhook esta em:

```text
supabase/functions/stripe-report-payment-webhook/index.ts
```

## 5. Configurar webhook para email customizado

Variaveis necessarias na Supabase Edge Function:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
REPORT_PURCHASE_FROM=Lei do Mecenato <geral@leidomecenato.pt>
```

No Stripe Dashboard:

1. Developers > Webhooks.
2. Criar endpoint para a URL da funcao Supabase.
3. Selecionar evento `checkout.session.completed`.
4. Copiar o signing secret para `STRIPE_WEBHOOK_SECRET`.

## 6. Limite importante

Com Payment Links, o frontend consegue abrir checkout seguro, mas nao consegue confirmar sozinho que o pagamento foi concluido.
A confirmacao fiavel deve vir do webhook Stripe.
