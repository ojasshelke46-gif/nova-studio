import { Box } from "@mui/material";
import { colors } from "@/lib/theme";
import ContactPanel from "./ContactPanel";

export default function Contact() {
  return (
    <Box
      component="section"
      id="contact"
      sx={{ px: { xs: "20px", md: "48px" }, py: { xs: "60px", md: "120px" } }}
    >
      <Box
        sx={{
          fontSize: 11,
          letterSpacing: "4px",
          color: colors.accent,
          textTransform: "uppercase",
          mb: "40px",
        }}
      >
        Contact
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: "48px", md: "0" },
        }}
      >
        {/* Left column */}
        <Box sx={{ width: { xs: "100%", md: "55%" } }}>
          <Box
            component="h2"
            sx={{ m: 0, fontSize: 42, fontWeight: 600, color: colors.textPrimary }}
          >
            Let&apos;s work together
          </Box>
          <Box
            component="p"
            sx={{
              m: 0,
              mt: "20px",
              fontSize: 16,
              lineHeight: 1.7,
              color: colors.textSecondary,
              maxWidth: 400,
            }}
          >
            Got a project in mind? Drop us a message and we&apos;ll get back to you
            within 24 hours.
          </Box>

          <Box sx={{ mt: "48px" }}>
            <Box
              component="a"
              href="mailto:hello@novastudio.com"
              sx={{
                fontSize: 15,
                color: colors.accent,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              hello@novastudio.com
            </Box>
            <Box sx={{ mt: "8px", fontSize: 13, color: "#333333" }}>
              Based in Bangalore, India
            </Box>
          </Box>
        </Box>

        {/* Right column */}
        <Box sx={{ width: { xs: "100%", md: "45%" } }}>
          <ContactPanel />
        </Box>
      </Box>
    </Box>
  );
}
