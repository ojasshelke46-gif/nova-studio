import { getBaseUrl } from "@/lib/getBaseUrl";
import StatsGrid, { type Stat } from "./StatsGrid";

async function getStats(): Promise<Stat[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/stats`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function Stats() {
  const stats = await getStats();

  if (stats.length === 0) return null;

  return <StatsGrid stats={stats} />;
}
