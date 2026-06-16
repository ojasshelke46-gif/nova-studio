import { Box } from "@mui/material";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { colors } from "@/lib/theme";

interface Service {
  id: number;
  title: string;
  description: string;
}

async function getServices(): Promise<Service[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/services`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

const overline = {
  fontSize: 11,
  letterSpacing: "4px",
  color: colors.accent,
  textTransform: "uppercase" as const,
};

export default async function Services() {
  const services = await getServices();

  if (services.length === 0) return null;

  return (
    <Box
      component="section"
      id="services"
      sx={{ px: { xs: "20px", md: "48px" }, py: { xs: "60px", md: "120px" } }}
    >
      <Box sx={overline}>Services</Box>
      <Box
        component="h2"
        sx={{ m: 0, mt: "16px", mb: "64px", fontSize: 42, fontWeight: 600, color: colors.textPrimary }}
      >
        What we do
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: "1px",
        }}
      >
        {services.map((service, i) => (
          <Box
            key={service.id}
            sx={{
              position: "relative",
              overflow: "hidden",
              backgroundColor: colors.surface,
              padding: "48px 40px",
              transition: "background-color 0.3s ease",
              "&:hover": { backgroundColor: "#0E0E0E" },
              "&:hover .learn-more": { opacity: 1, transform: "translateX(0)" },
            }}
          >
            <Box
              component="span"
              sx={{
                position: "absolute",
                top: 24,
                right: 32,
                fontSize: 64,
                fontWeight: 700,
                color: "rgba(124,92,252,0.08)",
                lineHeight: 1,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </Box>

            <Box
              component="h3"
              sx={{ m: 0, mb: "16px", fontSize: 22, fontWeight: 600, color: colors.textPrimary }}
            >
              {service.title}
            </Box>
            <Box
              component="p"
              sx={{ m: 0, mb: "32px", fontSize: 15, lineHeight: 1.7, color: colors.textSecondary }}
            >
              {service.description}
            </Box>
            <Box
              className="learn-more"
              sx={{
                fontSize: 13,
                color: colors.accent,
                opacity: 0,
                transform: "translateX(-8px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              Learn more →
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
