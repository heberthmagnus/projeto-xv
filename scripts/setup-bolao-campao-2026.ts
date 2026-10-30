import { PrismaClient } from "@prisma/client";
import { setupCampaoPredictionPools } from "../lib/bolao-setup";

const prisma = new PrismaClient();

void (async () => {
  try {
    const report = await setupCampaoPredictionPools(prisma);
    console.log(JSON.stringify({ ok: true, ...report }));
  } finally {
    await prisma.$disconnect();
  }
})();
