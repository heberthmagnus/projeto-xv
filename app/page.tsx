import { prisma } from "@/lib/prisma";

export default async function Home() {
  const users = await prisma.user.findMany();

  return (
    <main>
      <h1>Projeto XV</h1>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </main>
  );
}
