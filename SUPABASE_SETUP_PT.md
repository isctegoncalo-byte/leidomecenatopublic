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

Quando isto terminar, ficam criadas as tabelas `profiles`, `documents` e o bucket privado `documents`.

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

Depois de preencher `.env`, este projeto deixa de guardar documentos so no browser e passa a enviar para o Supabase.
Sem `.env`, continua em modo demo.

## Segurança aplicada no Supabase

O ficheiro `supabase/schema.sql` deve ser corrido novamente sempre que forem atualizadas as regras de seguranca.
As regras atuais impedem utilizadores comuns de criarem ou alterarem perfis com `role = admin`, mantem o bucket `documents` privado e limitam uploads aos tipos permitidos.

Para as Edge Functions, configurar tambem:

```text
RESEND_API_KEY=...
ADMIN_REGISTRATION_EMAIL=geral@leidomecenato.pt
ADMIN_NOTIFICATION_FROM=Lei do Mecenato <geral@leidomecenato.pt>
SITE_ORIGIN=https://leidomecenato.pt
```

A function `registration-notification` deve ficar com verificacao de JWT ativa. Assim so utilizadores autenticados conseguem disparar notificacoes de registo, e o email enviado tem de corresponder ao email da sessao.
