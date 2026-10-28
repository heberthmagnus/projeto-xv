# Integração de e-mail para autenticação

## Objetivo

Usar temporariamente `heberthmagnus@gmail.com` como remetente de mensagens de autenticação do Clube XV. Cada associado pode cadastrar o e-mail de sua escolha. A confirmação da identidade e da associação continua sujeita à aprovação por ROOT, DIRETORIA ou SECRETARIA.

O projeto Google Cloud `positive-tempo-513004-p4` tem a API Gmail habilitada e um cliente OAuth em teste. O conector `google/projeto-xv` foi vinculado na Vercel com o escopo `gmail.send`. Em 28/10/2026, o sujeito utilizado pela aplicação foi autorizado no ambiente de desenvolvimento e o SDK obteve um token. A autorização equivalente em produção ainda precisa ser verificada. O responsável aceita provisoriamente reautorizar a conta semanalmente; se essa autorização expirar, confirmações e recuperações deixarão de ser enviadas até a reautorização. Uma chave anterior exposta ainda precisa ser desativada com segurança. A renovação semanal não substitui os testes de ponta a ponta.

As tabelas de solicitações, limitação de tentativas e entrega de e-mail e a coluna opcional de identidade foram aplicadas ao Supabase de produção em 28/10/2026. Seus registros correspondentes foram alinhados no histórico do Prisma. As novas tabelas têm RLS ativo e não concedem acesso direto aos papéis `anon` e `authenticated`; não houve alteração de senha ou papel nessa operação.

## Situação atual

- O Supabase Auth usa atualmente o serviço de e-mail padrão, limitado a endereços da equipe do projeto e inadequado para todos os associados.
- O código local prepara cadastro, confirmação, login e recuperação com Supabase Auth para novas identidades, preservando o login legado. As migrações e a integração completa ainda não foram ativadas nem testadas de ponta a ponta. Não habilitar cadastro ou recuperação em produção antes dessa validação.
- A conta Outlook.com exige autenticação moderna OAuth2 para SMTP; não presumir que uma senha de aplicativo possa ser usada como substituto. O Supabase documenta SMTP personalizado com usuário e senha e também oferece um Send Email Hook autenticado.
- O endpoint local verifica a assinatura com `standardwebhooks`, limita o corpo e os destinos, e usa um registro persistente por ID do webhook para impedir reenvio automático. Uma resposta aceita pelo Gmail não comprova entrega. Em falhas ambíguas o registro permanece para análise; é necessário estabelecer um procedimento operacional seguro de reconciliação.
- O endpoint local usa Gmail API e o SDK oficial `@vercel/connect`. A identidade configurada foi autorizada no ambiente de desenvolvimento e o SDK obteve um token; em 28/10/2026 o Gmail aceitou uma mensagem real de teste para o Hotmail autorizado. O recebimento ainda não foi confirmado, nem a autorização para o ambiente de produção ou a renovação após a troca da chave. O hook permanece desabilitado.
- Foram configurados na Vercel de produção a URL e chave publicável do Supabase, a origem do site, o identificador do conector e o identificador do sujeito. As variáveis de ativação e o segredo do hook ainda não foram configurados. Essas mudanças só entram em uma nova implantação.
- Uma implantação protegida de produção foi compilada com sucesso sem promover o domínio `clube-xv-bh.vercel.app`; o login retornou HTTP 200 e o hook desabilitado retornou HTTP 503. Essa verificação não comprova o envio nem o cadastro completo. A Vercel também associou um endereço técnico do projeto à implantação isolada.
- O cadastro agora registra primeiro a solicitação. Se a identidade for criada e a vinculação falhar, a administração pode reconciliá-la pelo e-mail exatamente correspondente e confirmado no Supabase, após verificar a identidade por outro meio. Esse caminho ainda precisa ser testado com banco e autenticação reais antes da ativação.

## Caminho a implementar e validar

1. Autorizar o aplicativo Google com o escopo mínimo `gmail.send` para o sujeito e ambiente usados pela aplicação. Não registrar senhas ou tokens em arquivos de código ou logs.
2. Validar o endpoint do Send Email Hook do Supabase, incluindo assinatura, validade temporal e destinos, e testar o envio pelo Gmail como a conta autorizada, com gestão segura e renovação de credenciais.
3. Tratar falhas e repetição sem revelar códigos, senhas, links ou tokens em logs. Delimitar as URLs de redirecionamento. Não usar metadados alteráveis pelo usuário para conceder permissões do clube.
4. Implementar a criação e vinculação de identidades Supabase por ID, a aprovação de associado e a recuperação da senha usada no login. Preservar as contas legadas até que cada migração seja validada.
5. Testar em ambiente isolado a confirmação, recuperação, expiração e reutilização de links, rejeição de webhooks não autenticados, autorização por papel e indisponibilidade do serviço de e-mail. Só então configurar o hook de produção e publicar.

Esta integração depende de autorização Google e de armazenamento seguro de credenciais. O plano da Vercel apresentou 500 solicitações de token por 30 dias; confirmar limites antes de ativar. A conta pessoal também está sujeita a limites do Gmail. A configuração do hook e os testes reais dos links ainda estão pendentes.

Referências: [Send Email Hook do Supabase](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook), [Gmail: enviar mensagens](https://developers.google.com/workspace/gmail/api/guides/sending), [permissões do Gmail](https://developers.google.com/workspace/gmail/api/auth/scopes).
