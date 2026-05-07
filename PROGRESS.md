# Estado Atual do Projeto

Última atualização: 2026-04-27

## Posicionamento

- Plataforma privada independente.
- Não é organismo público.
- Não intermedia donativos.
- O donativo vai 100% da empresa para a instituição.
- O serviço cobrado é apenas o Relatório de Impacto do Donativo.

## Funcionalidades Já Implementadas

- Página inicial com explicação do posicionamento.
- Fluxo para empresa.
- Fluxo para instituição.
- Registo detalhado de necessidades ESG da instituição.
- Dois modos de donativo:
  - Dinheiro, ligado a uma causa/projeto com custo total.
  - Produtos/serviços, ligados a uma necessidade concreta.
- Geração de código único de donativo.
- Validação do código antes de solicitar relatório.
- Checkout interno para pagamento do relatório.
- Relatório gerado em PDF por template.
- Bloqueio do acesso ao PDF sem código validado e pagamento.
- Código de demonstração ativo: `LM-DEMO-2025`.

## Templates de PDF

- Os templates ficam em `src/templates/reportTemplates.ts`.
- Os PDFs são gerados em `src/utils/pdfReport.ts`.

## Persistência Local

- Os contratos de demonstração e os estados de pagamento ficam guardados em `localStorage`.
- O registo é gerido em `src/utils/reportRegistry.ts`.

## Ficheiros Principais

- `src/App.tsx`
- `src/components/CompanyDonationPage.tsx`
- `src/components/ReportAccessPage.tsx`
- `src/components/ESGReportPage.tsx`
- `src/utils/esgEngine.ts`
- `src/utils/pdfReport.ts`
- `src/utils/reportRegistry.ts`
- `src/templates/reportTemplates.ts`

## Build

- O projeto compila com sucesso.
- Última validação: `npm run build`.

## Demo

- Código de donativo para simulação: `LM-DEMO-2025`
- Este código já está pré-carregado para testar o fluxo final.
