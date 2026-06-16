"use client";

import { Box } from "@mui/material";

const LINKS = [
  { label: "Services", id: "services" },
  { label: "Work", id: "portfolio" },
  { label: "Contact", id: "contact" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: { xs: "32px 20px", md: "40px 48px" },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        gap: { xs: "16px", md: 0 },
      }}
    >
      <Box sx={{ fontSize: 13, color: "#333333" }}>© 2025 Nova Studio</Box>

      <Box
        sx={{
          display: "flex",
          gap: "32px",
          justifyContent: "center",
        }}
      >
        {LINKS.map((link) => (
          <Box
            key={link.id}
            component="span"
            onClick={() => scrollTo(link.id)}
            sx={{
              fontSize: 13,
              color: "#333333",
              cursor: "pointer",
              transition: "color 0.2s ease",
              "&:hover": { color: "#FFFFFF" },
            }}
          >
            {link.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
