# Deploy para dominios.pt

Este projeto já está preparado para upload como website estático.

## O que enviar

Envia o conteúdo da pasta `dist/` para a raiz pública do alojamento, normalmente `public_html/` ou `www/`.

Enviar a pasta `dist/` completa, incluindo recursos, rotas e páginas pré-renderizadas. O build atual não gera um único ficheiro HTML.

## Passos

1. Fazer o build local.
2. Abrir a pasta `dist/`.
3. Enviar todos os ficheiros dessa pasta por FTP/gestor de ficheiros da dominios.pt.
4. Garantir que `index.html`, `_redirects` e os diretórios gerados ficam na raiz do domínio.

## Ficheiros importantes

- `dist/index.html` e `dist/assets/` - aplicação e recursos compilados.
- `public/.htaccess` - fallback útil para alojamento Apache.
- `public/favicon.svg` - favicon do site.

## Notas

- O site não depende de backend para funcionar no front-end.
- O deploy estático no Netlify está configurado em `netlify.toml`; este guia FTP destina-se apenas ao alojamento da dominios.pt.
- A plataforma comunica que é uma iniciativa privada independente e não um organismo público.
