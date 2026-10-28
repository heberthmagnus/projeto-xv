# Autenticação por perfil: implantação e limitações

## Transição para Supabase Auth em preparação

O vínculo opcional `User.supabaseAuthId` foi preparado em migração ainda não aplicada. A senha Supabase é validada no servidor somente para usuários explicitamente vinculados pelo identificador único; contas sem vínculo continuam com o login legado. O servidor valida a identidade Supabase a cada requisição autenticada de conta vinculada. Não vincular automaticamente por e-mail nem sobrescrever senhas existentes.

Este é apenas um passo inicial: o fluxo de aprovação ainda cria contas legadas, a criação e vinculação segura de contas Supabase não estão implementadas, a recuperação automática está desativada e não há renovação de sessão Supabase; a expiração do token exigirá novo login. Também são necessárias variáveis Supabase públicas, testes de integração e configuração de entrega de e-mails. Não implantar esta transição como implementação completa.

A sessão existente `xv_admin_session` e os hashes de senha são preservados. No código preparado, usuários com perfis explícitos usam apenas as permissões desses perfis; usuários sem perfis explícitos mantêm a compatibilidade com ADMIN, OWNER e SUPERADMIN. A versão implantada pode continuar usando as regras anteriores até o próximo deploy.

ROOT recebe todas as permissões; DIRETORIA recebe `sports.manage` e consulta de inscrições; SECRETARIA recebe permissões de cadastro de associados, consulta de inscrições e lançamento de placares; ASSOCIADO exige registro vinculado e situação ATIVO. Os papéis se somam. A verificação é feita no servidor para cada operação e a situação de associado não condiciona o acesso administrativo. A Secretaria utiliza a página de placares específica, sem acesso às operações esportivas de horários e times; as páginas antigas de inscrições continuam restritas.

`sports.manage` é uma permissão transitória ampla para as operações esportivas existentes. As permissões individuais, exceções por usuário, interfaces completas da Secretaria, cadastro e edição de associados, reconciliação com atletas, edição de contato, administração de papéis e consulta da auditoria ainda precisam ser implementados. Algumas operações já gravam auditoria; a cobertura não é completa. Não utilizar esta etapa como solução completa para o escopo original.

## Solicitação de conta

O fluxo preparado recebe nome, e-mail, telefone e senha e cria uma solicitação pendente, sem criar uma conta nem liberar acesso. A senha é armazenada como hash bcrypt até a decisão. ROOT, DIRETORIA e SECRETARIA podem consultar e decidir as solicitações. A aprovação exige confirmação explícita da identidade e da associação por contato independente e escolha da categoria pelo responsável; cria somente uma conta ASSOCIADO e um registro ativo, ou vincula um cadastro existente selecionado e conferido. Possíveis duplicidades bloqueiam a aprovação para conciliação. A decisão é transacional e auditada; o hash é apagado da solicitação depois da decisão.

A confirmação manual depende de o responsável conferir a identidade fora do site; o formulário não prova por si só a titularidade do e-mail ou do telefone. A limitação de tentativas foi preparada para ser compartilhada pelo PostgreSQL e depende da mesma migração. Não há notificações por e-mail. A migração deve ser testada em banco isolado e aplicada antes do deploy. A limpeza periódica dos contadores expirados e a validação dos cabeçalhos de IP no ambiente Vercel permanecem pendentes.

Antes da implantação, revisar a migração e testá-la em um banco isolado com cópia apropriada dos dados. Somente após autorização explícita para alterações no banco de produção: gerar o cliente, executar `npx prisma migrate deploy` no ambiente correto e implantar a aplicação compatível. A aplicação atualizada consulta as novas tabelas e exige que a migração tenha sido aplicada antes de receber tráfego. Não executar `prisma migrate dev` em produção.

## Mapeamento inicial confirmado pelo usuário

| Conta existente | Perfis solicitados |
| --- | --- |
| heberthmagnus@gmail.com | ROOT, DIRETORIA, ASSOCIADO |
| fabioedson.ra@gmail.com | DIRETORIA, ASSOCIADO |
| clubequinzeveranistas@yahoo.com.br | SECRETARIA |

As atribuições acima e dois cadastros de associado FAMILIAR e ATIVO foram aplicados ao Supabase em 28/10/2026, com auditoria. O papel legado `ADMIN` permanece no banco para preservar a versão implantada. O vínculo de associado ao perfil de atleta ainda não foi implementado.
