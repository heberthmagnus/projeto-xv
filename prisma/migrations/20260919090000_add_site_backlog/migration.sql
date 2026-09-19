CREATE TYPE "SiteBacklogStatus" AS ENUM ('BACKLOG', 'PRIORIZADO', 'EM_ANDAMENTO', 'EM_VALIDACAO', 'CONCLUIDO');

CREATE TABLE "SiteBacklogItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "status" "SiteBacklogStatus" NOT NULL DEFAULT 'BACKLOG',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteBacklogItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteBacklogItem_status_sortOrder_idx" ON "SiteBacklogItem"("status", "sortOrder");

INSERT INTO "SiteBacklogItem" ("id", "title", "description", "area", "status", "sortOrder", "updatedAt") VALUES
  ('752f742e-5014-4c64-9e3d-f56a2ef78a01', 'Acesso por perfil e área do clube', 'Definir perfis como Secretaria, Comissão do Campeonato e Administração. Cada perfil verá apenas as páginas e ações necessárias ao seu trabalho.', 'Segurança e operação', 'PRIORIZADO', 1, CURRENT_TIMESTAMP),
  ('752f742e-5014-4c64-9e3d-f56a2ef78a02', 'Painel da Secretaria para sócios', 'Cadastro e consulta de sócios, com situação ativo/inativo, dados cadastrais e filtros. O acesso ficará restrito ao perfil da Secretaria.', 'Secretaria', 'PRIORIZADO', 2, CURRENT_TIMESTAMP),
  ('752f742e-5014-4c64-9e3d-f56a2ef78a03', 'Permissões detalhadas', 'Permitir autorizar ações específicas por perfil, como visualizar, cadastrar, editar ou administrar uma frente do clube.', 'Segurança e operação', 'BACKLOG', 3, CURRENT_TIMESTAMP),
  ('752f742e-5014-4c64-9e3d-f56a2ef78a04', 'Histórico de alterações', 'Registrar quem alterou informações relevantes, quando e o que foi atualizado, para dar rastreabilidade à operação.', 'Segurança e operação', 'BACKLOG', 4, CURRENT_TIMESTAMP),
  ('752f742e-5014-4c64-9e3d-f56a2ef78a05', 'Comunicados recorrentes do site', 'Manter uma visão rápida das novidades liberadas para facilitar a divulgação aos associados pelo WhatsApp.', 'Comunicação', 'BACKLOG', 5, CURRENT_TIMESTAMP);
