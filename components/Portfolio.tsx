import { Box } from "@mui/material";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { colors } from "@/lib/theme";
import PortfolioGrid, { type Project } from "./PortfolioGrid";

async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/projects`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function Portfolio() {
  const projects = await getProjects();

  return (
    <Box
      component="section"
      id="portfolio"
      sx={{ px: { xs: "20px", md: "48px" }, py: { xs: "60px", md: "120px" } }}
    >
      <Box
        sx={{
          fontSize: 11,
          letterSpacing: "4px",
          color: colors.accent,
          textTransform: "uppercase",
        }}
      >
        Portfolio
      </Box>
      <Box
        component="h2"
        sx={{ m: 0, mt: "16px", mb: "40px", fontSize: 42, fontWeight: 600, color: colors.textPrimary }}
      >
        Selected work
      </Box>

      <PortfolioGrid projects={projects} />
    </Box>
  );
}
