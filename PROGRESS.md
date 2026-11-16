# Estado Atual do Projeto

Ultima atualizacao: 2026-11-16

## Configuracao remota e seguranca — 2026-11-16

- Projeto Supabase `LeidoMecenato` confirmado como ativo.
- Aplicada a migration `supabase/migrations/20261116004637_harden_live_policies.sql`: transacoes criadas pelo utilizador autenticado ficam pendentes, apenas o papel `service_role` pode alterar o estado, notificacoes deixaram de aceitar insercoes publicas, dados institucionais deixaram de ser legiveis anonimamente e utilizadores comuns deixaram de poder alterar o estado de revisao dos proprios documentos.
- Aplicada a migration `supabase/migrations/20261116011144_restrict_document_storage.sql`: removidas quatro politicas antigas de acesso amplo ao bucket privado `documents`; permanecem as politicas por proprietario e administrador.
- Aplicada a migration `supabase/migrations/20261116013237_align_document_storage_columns.sql`: adicionadas as colunas que o fluxo de upload usa (`storage_path`, `public_url`, `mime_type`, `size`), preservando `file_url` e `file_size` legados.
- Aplicada a migration `supabase/migrations/20261116014230_institution_submissions.sql`: criada uma tabela de candidaturas institucionais com RLS, leitura apenas pelo titular/admin e revisão exclusiva do admin. Aplicada tambem `20261116022000_index_institution_submission_reviews.sql`.
- O formulário completo de instituição exige agora sessão Supabase com role `instituicao`, requer comprovativo de NIF, estatutos, relatório/contas e comprovativo de IBAN, e guarda os dados/anexos/imagens como candidatura privada no Supabase. O painel admin lista, permite descarregar os anexos por URL assinada e regista a decisão/nota de revisão.
- No projeto remoto, antes de existirem novos registos, havia 7 perfis `empresa`, 1 `admin`, 0 `instituicao`, 0 documentos e 0 objetos no bucket `documents`. Nenhuma candidatura/ficha ou ficheiro de teste foi criado.
- O fluxo de documentos existente foi alinhado com o esquema remoto e as permissões permitem listar metadados e gerar URLs assinados de curta duração para titular/admin. A estrutura/RLS foram verificadas, mas falta um teste ponta a ponta com uma conta autorizada e ficheiros reais.
- Atualizada a Edge Function `stripe-report-payment-webhook` no Supabase para a versao local (versao publicada 14). Continua a validar assinatura, sessao paga, moeda e montante antes de persistir a transacao.
- A chave `RESEND_API_KEY` foi substituida nos segredos Edge Function do Supabase em 2026-11-16. O valor nao esta guardado no repositorio. Nao foi enviado email de teste; recomenda-se rodar a chave depois de validar o acesso e confirmar o dominio no Resend, dado que foi partilhada na conversa.
- Reverificacao dos conselheiros Supabase: deixaram de surgir alertas sobre leitura anonima de SECURITY DEFINER e `search_path`; permanece um alerta esperado para `is_admin()` acessivel a utilizadores autenticados devido ao seu uso em politicas RLS, e a protecao contra palavras-passe comprometidas continua desativada na configuracao Auth.
- O projeto Netlify `leidomecenato` esta associado a `leidomecenato.pt`, com um deploy de producao pronto na branch `main` publicado em 2026-06-10. Foram confirmadas as variaveis publicas Supabase, os tres Payment Links Stripe e a medicao GA4. As alteracoes locais atuais ainda nao foram publicadas.
- Stripe continua sem acesso de gestao nesta sessao; nao foi possivel confirmar o modo da conta, valores/metadados dos Payment Links nem o endpoint de webhook no Dashboard Stripe.
- O dominio remetente, estado de verificacao, limites e logs do Resend continuam por confirmar. A funcao `donation-notification` existe no repositorio mas nao esta publicada no projeto remoto.
- Continua pendente migrar donativos/comprovativos, confirmações, conversas e notificações do `localStorage` para o Supabase. Não existe ainda publicação automática das candidaturas confirmadas no catálogo público.
- O build foi tentado, mas não pôde correr porque `npm` não está instalado/disponível nesta sessão. `git diff --check` terminou sem erros. Não foram criados registos de negócio, ficheiros de teste ou emails, nem foi publicado deploy.

## Continuidade e segurança — 2026-11-15

- O retorno do browser do Stripe deixou de marcar o pagamento como pago. O frontend mantém o estado pendente; a confirmação depende do webhook.
- O webhook só processa sessões Stripe em modo `payment`, pagas, em EUR e com o total esperado para o pacote. Uma falha ao persistir a transação impede o envio do email de confirmação.
- A inserção de transações autenticadas pela empresa está limitada ao estado pendente e não aceita IDs/recibos Stripe nem dados de emissão fiscal.
- Os campos dinâmicos dos emails de compra são escapados antes de integrar HTML.
- Sessões locais de demonstração só são restauradas em desenvolvimento. Os botões de saída invalidam também a sessão Supabase.
- As páginas Empresas, Instituições e Relatórios já não mostram o ecrã genérico “em preparação”. A página de instituições não apresenta perfis locais como catálogo global.
- Adicionada configuração de build estático para Netlify e guia de variáveis e publicação.
- A migração de donativos, comprovativos, confirmações, chat, notificações e registos institucionais para persistência Supabase continua pendente. É necessária uma migração por domínio, com permissões separadas para cada parte e armazenamento privado para comprovativos; os dados locais existentes não foram apagados nem migrados automaticamente.
- Não foram executados SQL no Supabase, deploys ou verificações de build/testes nesta etapa.

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
