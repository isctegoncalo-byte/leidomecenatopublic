# Deploy para dominios.pt

Este projeto já está preparado para upload como website estático.

## O que enviar

Envia o conteúdo da pasta `dist/` para a raiz pública do alojamento, normalmente `public_html/` ou `www/`.

Se o alojamento pedir um único ficheiro inicial, basta enviar o `dist/index.html` como `index.html`.

## Passos

1. Fazer o build local.
2. Abrir a pasta `dist/`.
3. Enviar todos os ficheiros dessa pasta por FTP/gestor de ficheiros da dominios.pt.
4. Garantir que `index.html` fica na raiz do domínio.

## Ficheiros importantes

- `dist/index.html` - aplicação pronta a servir.
- `public/.htaccess` - fallback útil para alojamento Apache.
- `public/favicon.svg` - favicon do site.

## Notas

- O site não depende de backend para funcionar no front-end.
- O build atual gera um ficheiro único de saída, o que facilita upload em alojamentos partilhados.
- A plataforma comunica que é uma iniciativa privada independente e não um organismo público.
