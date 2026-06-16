import { query } from "@/lib/db";
import StatsGrid, { type Stat } from "./StatsGrid";

async function getStats(): Promise<Stat[]> {
  try {
    return await query<Stat>("SELECT * FROM stats ORDER BY id ASC");
  } catch {
    return [];
  }
}

export default async function Stats() {
  const stats = await getStats();

  if (stats.length === 0) return null;

  return <StatsGrid stats={stats} />;
}
