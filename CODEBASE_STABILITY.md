# Notas de Estabilidade do Código

Este projeto evoluiu rapidamente e tem muitos fluxos interligados. Para reduzir quebras em alterações futuras, ficam estas regras práticas.

## Princípios

- Não remover tipos ou propriedades de interfaces se já foram usados em versões anteriores.
- Quando uma regra muda, preferir tornar campos antigos opcionais em vez de os apagar.
- Manter compatibilidade com dados guardados em `localStorage`, porque browsers podem ter dados antigos.
- Antes de alterar fluxos centrais, correr sempre `npm run build`.

## Campos legados mantidos

Alguns campos continuam no tipo como opcionais para evitar erros com dados antigos:

- `ImpactContract.accessCode?`
- `DonationProof.accessCode?`
- `DonationProof.certificateId?`
- `DonationProof.certificateIssuedAt?`
- `NeedItem.supportType?`
- `NeedItem.status?`

Estes campos não determinam o comportamento atual, mas protegem contra quebras se existirem registos antigos em `localStorage`.

## Comportamento atual do relatório ESG

- O relatório ESG não é desbloqueado por código.
- O relatório ESG fica disponível apenas na área privada da empresa.
- O relatório ESG só pode ser descarregado quando empresa e instituição confirmam o donativo.

## Onde mexer para alterações comuns

- Preços dos serviços: `src/types/index.ts` em `REPORT_TIERS`.
- Perfis das instituições simuladas: `src/data/institutions.ts`.
- Templates de relatório: `src/templates/reportTemplates.ts`.
- Templates de comunicação: `src/templates/socialTemplates.ts`.
- Identidade da marca: `src/utils/brandIdentity.ts` e área admin.
- Regras de rating: `src/utils/esgEngine.ts`.
- PDF do relatório ESG: `src/utils/sustainabilityPdf.ts`.
- Área privada: `src/components/PrivateAreaPage.tsx`.

## Fluxos sensíveis

Antes de alterar estes fluxos, validar todos os passos manualmente:

- Fluxo de empresa: `src/components/CompanyDonationPage.tsx`.
- Confirmação de donativo: `src/components/PrivateAreaPage.tsx`.
- Notificações: `src/utils/notificationStore.ts`.
- Chat: `src/utils/chatStore.ts`.

## Build

Após qualquer alteração:

```bash
npm run build
```

O deploy só deve ser feito com build limpo.
