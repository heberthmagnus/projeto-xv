-- All application data is accessed by Prisma from the server. The Supabase
-- browser client is used only for Auth, so no public table policy is needed.
-- Keep the Data API closed for anonymous and authenticated browser roles.

ALTER TABLE public."AthleteProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Championship" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChampionshipPlayer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChampionshipStage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChampionshipTeam" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MatchEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MatchPlayerParticipation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Pelada" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PeladaArrival" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PeladaConfirmation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PeladaRound" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PeladaRoundGoal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PeladaRoundPlayer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PeladaTeamAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Registration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Standing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Suspension" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeamRelationship" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeamSimulation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
