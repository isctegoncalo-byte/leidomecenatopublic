# Guia simples: ativar a parte real da plataforma

Este projeto ja funciona como demo. Para receber contas reais e ficheiros reais, vamos ligar ao Supabase.

## O que fica real

- Registo de empresas e instituicoes.
- Login com email e palavra-passe.
- Upload de documentos e imagens para armazenamento privado.
- Lista e download dos ficheiros de cada conta.
- Base preparada para um admin ver e gerir dados no Supabase.

## 1. Criar conta Supabase

1. Abrir https://supabase.com
2. Clicar em "Start your project".
3. Entrar com Google ou criar conta.
4. Clicar em "New project".
5. Escolher uma organizacao.
6. Nome sugerido: `lei-do-mecenato`
7. Criar uma password forte para a base de dados e guarda-la.
8. Escolher uma regiao europeia, por exemplo West Europe.
9. Clicar em "Create new project".

## 2. Criar a base de dados e zona de ficheiros

1. No painel do Supabase, abrir "SQL Editor".
2. Clicar em "New query".
3. Abrir no computador este ficheiro:
   `supabase/schema.sql`
4. Copiar tudo.
5. Colar no SQL Editor.
6. Clicar em "Run".

Quando isto terminar, ficam criadas as tabelas base `profiles`, `documents` e o bucket privado `documents`. O esquema inclui também `institution_submissions` para candidaturas institucionais privadas.

## 3. Copiar as chaves do Supabase

1. No Supabase, abrir "Project Settings".
2. Abrir "API".
3. Copiar o "Project URL".
4. Copiar a chave "anon public".

## 4. Criar o ficheiro .env

Na pasta do projeto, criar um ficheiro chamado:

```text
.env
```

Dentro dele colocar:

```text
VITE_SUPABASE_URL=https://pucqlcfqkdxznjeoihkv.supabase.co
VITE_SUPABASE_ANON_KEY=colar_aqui_a_anon_public_key
VITE_SUPABASE_ODS_BUCKET=images
VITE_SUPABASE_ODS_FOLDER=ODS
```

Exemplo:

```text
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_ODS_BUCKET=images
VITE_SUPABASE_ODS_FOLDER=ODS
```

Nao usar aspas.

Para as imagens dos ODS, criar no Supabase Storage um bucket publico chamado `images` e uma pasta `ODS`.
Colocar as 17 imagens nessa pasta. O padrao preferido e `ods-1-pt.png`, `ods-2-pt.png` ... `ods-17-pt.png`.
O site tambem tenta nomes alternativos como `01.png`, `1.png`, `ODS01.png`, `ODS1.png`, `ODS-01.png`, `ODS_01.png`, `ods-01.png`, `E-WEB-Goal-01.png` ou `S-WEB-Goal-01.png`.

## 5. Instalar Node.js

Se o comando `npm` nao funcionar, instalar o Node.js:

1. Abrir https://nodejs.org
2. Descarregar a versao LTS.
3. Instalar com as opcoes normais.
4. Fechar e voltar a abrir o PowerShell.

Depois confirmar:

```powershell
npm -v
```

## 6. Instalar o projeto

No PowerShell:

```powershell
cd "C:\Users\Apoio Social\Documents\Codex\2026-05-05\tenho-uma-pasta-de-winrar-para\extracted"
npm install
```

## 7. Testar no computador

```powershell
npm run dev
```

O terminal vai mostrar um endereco parecido com:

```text
http://localhost:5173
```

Abrir esse endereco no browser.

Teste recomendado:

1. Criar uma conta de instituicao.
2. Entrar na area privada.
3. Abrir "Documentos".
4. Carregar um PDF ou imagem.
5. Confirmar que aparece na lista.
6. No Supabase, abrir "Storage" > "documents" e confirmar que o ficheiro apareceu.

## 8. Gerar deploy

Quando estiver tudo certo:

```powershell
npm run build
```

Depois enviar o conteudo da pasta `dist/` para o alojamento.

## Nota importante

Com as variáveis Supabase configuradas, a autenticação, os documentos, as transações de relatórios e as medições de impacto usam o Supabase. Outros registos operacionais (donativos, confirmações, chat, notificações e registos de instituições) ainda dependem do armazenamento do browser e não ficam partilhados entre dispositivos.
Sem `.env`, a autenticação real não está disponível; a versão publicada não aceita sessões guardadas no browser.

## Segurança aplicada no Supabase

As alteracoes incrementais devem ser guardadas em `supabase/migrations/` e aplicadas pela ferramenta de migrations. Evitar voltar a executar o ficheiro completo `supabase/schema.sql` num projeto existente sem rever o diff e o estado remoto.

A migration `20261116004637_harden_live_policies.sql` limita novas transacoes do browser ao estado pendente, reserva transicoes de estado ao `service_role`, remove insercoes publicas de notificacoes, retira a leitura anonima de dados institucionais privados e impede que um utilizador altere o proprio estado de revisao documental. O bucket `documents` permanece privado.

A migration `20261116011144_restrict_document_storage.sql` remove politicas legadas que davam acesso amplo aos objetos no bucket `documents`; mantem o acesso do proprietario e do administrador.

A migration `20261116013237_align_document_storage_columns.sql` alinha a tabela remota `documents` com o upload de ficheiros privado usado pelo frontend e mantem os campos legados. O administrador pode listar os documentos autorizados e obter URLs assinados temporarios. O caminho foi revisto, mas falta um upload de ponta a ponta com uma conta de teste antes de afirmar que a operacao real foi validada.

A migration `20261116014230_institution_submissions.sql` cria o registo persistente de candidaturas de instituições. O titular autenticado e a administração podem ler a candidatura; só a administração a pode rever. O formulário exige uma conta com role `instituicao` e envia documentos comprovativos e imagens para o bucket privado `documents`. O painel de administração apresenta os dados e cria links temporários para os anexos. A decisão administrativa ainda não publica automaticamente a instituição no catálogo.

O alerta de protecao contra palavras-passe comprometidas ainda requer ativacao nas definicoes de Auth do projeto. O alerta de `is_admin()` para utilizadores autenticados permanece porque as politicas RLS dependem dessa funcao; nao remover a permissao sem migrar essas politicas.

Para as Edge Functions, configurar tambem:

```text
RESEND_API_KEY=...
ADMIN_REGISTRATION_EMAIL=geral@leidomecenato.pt
ADMIN_NOTIFICATION_FROM=Lei do Mecenato <geral@leidomecenato.pt>
SITE_ORIGIN=https://leidomecenato.pt
```

A function `registration-notification` deve ficar com verificacao de JWT ativa. Assim so utilizadores autenticados conseguem disparar notificacoes de registo, e o email enviado tem de corresponder ao email da sessao.
