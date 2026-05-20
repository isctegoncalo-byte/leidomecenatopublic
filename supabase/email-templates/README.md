# Templates de email do Supabase Auth

Estes ficheiros são a versão de referência dos emails transacionais da autenticação.
Nos projetos hosted do Supabase, estes templates devem ser colados no Dashboard em:

`Authentication` > `Emails` > `Templates`

## Templates

| Fluxo no Supabase | Ficheiro | Assunto sugerido |
| --- | --- | --- |
| Confirm sign up | `confirm-signup.html` | `Confirme a sua conta | Lei do Mecenato` |
| Reset password | `reset-password.html` | `Recuperar palavra-passe | Lei do Mecenato` |
| Invite user | `invite-user.html` | `Convite para aceder à Lei do Mecenato` |
| Magic link | `magic-link.html` | `Acesso seguro à Lei do Mecenato` |
| Change email address | `change-email.html` | `Confirme a alteração de email | Lei do Mecenato` |

## Variáveis usadas

O Supabase Auth usa Go Templates. Estes templates usam apenas variáveis oficiais:

- `{{ .ConfirmationURL }}`: link de confirmação, convite, recuperação ou acesso.
- `{{ .SiteURL }}`: URL base configurado em Authentication settings.
- `{{ .Email }}`: email da conta.
- `{{ .NewEmail }}`: novo email, apenas no fluxo de alteração de email.

## Configuração a confirmar

- `Site URL`: `https://leidomecenato.pt`
- `Redirect URLs`: incluir `https://leidomecenato.pt/*` e, para testes locais, `http://127.0.0.1:5173/*`.
- Desativar tracking de links no fornecedor de email/SMTP, porque pode invalidar links de confirmação do Supabase.
- Configurar SMTP próprio no Supabase antes de produção para melhorar entregabilidade e identidade visual do remetente.
