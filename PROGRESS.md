# Estado Atual do Projeto

Ultima atualizacao: 2026-05-17

## Posicionamento

- Plataforma privada independente.
- Nao e organismo publico.
- Nao intermedia donativos.
- O donativo vai 100% da empresa para a instituicao.
- O servico cobrado e apenas o Relatorio de Impacto do Donativo.
- Ratings de projetos/donativos nao devem ser publicados; ficam reservados ao administrador.

## Checkpoint desta sessao

- Repositorio local carregado a partir do GitHub: `isctegoncalo-byte/leidomecenatopublic`.
- Dependencias instaladas e build validado com `npm run build`.
- Site local a correr em `http://127.0.0.1:5173`.

## Alteracoes feitas

- Criada notificacao por email para `geral@leidomecenato.org` quando uma empresa confirma/submete um donativo com notificacao para a associacao.
- Adicionada Edge Function Supabase: `supabase/functions/donation-notification/index.ts`.
- O email usa o mesmo titulo e corpo da notificacao mostrada na pagina da associacao.
- Texto da notificacao de donativo corrigido: o recibo deve ser carregado na plataforma `leidomecenato.pt`.
- Ratings de projetos removidos das paginas publicas e da area privada de instituicoes/empresas.
- Rating mantido apenas no painel de administracao.
- Removida a pagina publica `ImpactRatingPage`.
- Substituidos os projetos simulados por 15 projetos novos e completos em `src/data/institutions.ts`.
- Cada projeto inclui resumo executivo, fundamentacao, objetivos, ODS, KPI, beneficiarios, custo, financiamento assegurado, contactos institucionais internos, plano de divulgacao, evidencias e galeria.
- Na pagina publica do projeto foram escondidos:
  - contactos internos do projeto;
  - pessoa responsavel;
  - contacto para donativos;
  - telefone/telemovel;
  - email e `mailto:`.
- Na homepage/cartoes de projeto tambem foram escondidos email e telefone.
- Resumo executivo deixou de aparecer duplicado no topo da pagina do projeto.
- Resumo executivo, fundamentacao e objetivos foram reduzidos para cerca de metade do tamanho anterior.
- KPI associados aos ODS selecionados passaram a ser preenchidos automaticamente para todos os projetos.
- Galeria de fotos movida para a coluna lateral da pagina do projeto, imediatamente acima do progresso e do botao de donativo.
- Pagina Impacto Real deixou de usar casos simulados antigos e passou a usar projetos em destaque vindos da nova base.
- Cartoes da homepage ajustados: removidos Site/Redes Sociais e nome do projeto colocado no bloco de progresso.
- Linguagem publica revista para evitar a palavra "dinheiro", usando apoio financeiro/donativo financeiro/valor.
- Fundamentacao continua obrigatoria na area privada, mas deixou de aparecer na pagina publica do projeto.
- Objetivos passaram a ser preenchidos por topicos, com limite de 5 objetivos.
- Populacoes-chave passaram a ser preenchidas por topicos, com limite de 5 populacoes, e aparecem publicamente na pagina do projeto.
- Cada ODS selecionado mostra 5 KPI sugeridos, sem retirar a possibilidade de adicionar KPI proprios.
- KPI preenchidos por ODS e KPI adicionais aparecem sempre na pagina publica do projeto.
- Resumo executivo publico foi reduzido para uma versao mais curta.

## Ficheiros principais alterados

- `src/data/institutions.ts`
- `src/components/ProjectDetailPage.tsx`
- `src/components/HomePage.tsx`
- `src/components/ImpactStoriesPage.tsx`
- `src/components/PrivateAreaPage.tsx`
- `src/components/AdminPage.tsx` manteve o rating privado no admin.
- `src/App.tsx`
- `src/utils/supabaseBackend.ts`
- `src/utils/notificationStore.ts`
- `src/data/impactMetrics.ts`
- `supabase/functions/donation-notification/index.ts`
- `.env.example`

## Estado tecnico

- Ultima validacao: `npm run build` passou com sucesso em 2026-05-17.
- O servidor local foi confirmado em `http://127.0.0.1:5173`.
- `dist/index.html` esta modificado por ter sido regenerado pelo build.
- Alteracoes preparadas para commit/deploy.

## Proximos passos sugeridos

- Rever visualmente varias paginas de projeto no browser.
- Testar fluxo completo de donativo ate notificacao da associacao.
- Fazer deploy da Edge Function `donation-notification` no Supabase.
- Configurar secrets Supabase: `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ADMIN_DONATION_EMAIL`, `DONATION_NOTIFICATION_FROM`.
- Enviar commit para GitHub e acionar deploy da plataforma.
