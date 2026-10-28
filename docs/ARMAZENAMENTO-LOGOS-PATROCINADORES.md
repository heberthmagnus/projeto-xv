# Logos de patrocinadores no Supabase Storage

O cadastro de patrocinadores usa o bucket público `sponsor-logos`. A imagem é enviada exclusivamente por uma Server Action autorizada; a chave `SUPABASE_SECRET_KEY` nunca é exposta ao navegador. A variável legada `SUPABASE_SERVICE_ROLE_KEY` continua aceita temporariamente.

O campo existente `Sponsor.logoUrl` continua sendo a referência canônica da logo. Assim, times e páginas públicas já podem reutilizar a mesma imagem sem mudança de modelo Prisma.

## Ativação por ambiente

Antes de disponibilizar o upload em um ambiente, configure nele:

```text
SUPABASE_SECRET_KEY=<chave secreta do projeto Supabase>
```

Crie o bucket `sponsor-logos` no Supabase Storage com estas propriedades:

- Público: sim — logos são conteúdo institucional exibido no site público.
- Limite de arquivo: `2097152` bytes (2 MB).
- Tipos permitidos: `image/png`, `image/jpeg`, `image/webp`.
- Sem políticas de `INSERT`, `UPDATE` ou `DELETE` para `anon`/`authenticated`: o upload deve ocorrer apenas pelo servidor do Clube XV.

O código usa nomes aleatórios e não sobrescreve objetos existentes. Ao trocar uma logo salva pelo sistema, a imagem anterior é removida somente após a atualização do patrocinador no banco.

## Verificação manual

1. No ambiente configurado, entre como administrador e abra `/admin/patrocinadores`.
2. Cadastre um patrocinador com uma imagem PNG, JPG ou WebP menor que 2 MB.
3. Confirme que a URL gravada no patrocinador aponta para `sponsor-logos` e que a logo aparece no cartão e na página pública do time associado.
4. Edite o patrocinador, selecione outra imagem e confirme que a nova é exibida.
5. Tente um PDF, uma imagem maior que 2 MB e uma ação sem sessão administrativa; todos devem ser rejeitados.

O bucket foi criado no projeto de produção em 28/10/2026. A variável de ambiente continua exigindo configuração explícita no Vercel.
