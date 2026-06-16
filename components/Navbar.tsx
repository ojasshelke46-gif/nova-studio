"use client";

import { useEffect, useState } from "react";
import { Box, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { colors } from "@/lib/theme";

const LINKS = [
  { label: "Services", id: "services" },
  { label: "Work", id: "portfolio" },
  { label: "Contact", id: "contact" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // TODO: should throttle this — fires on every scroll frame
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (id: string) => {
    setMenuOpen(false);
    scrollTo(id);
  };

  return (
    <>
      <Box
        component="nav"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: 64,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: "20px", md: "48px" },
          backgroundColor: scrolled ? "rgba(5,5,5,0.9)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? `1px solid ${colors.border}` : "1px solid transparent",
          transition: "background-color 0.2s ease, border-color 0.2s ease, backdrop-filter 0.2s ease",
        }}
      >
        <Box
          component="span"
          sx={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF", cursor: "pointer" }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Nova Studio
        </Box>

        {/* Desktop links */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: "32px" }}>
          {LINKS.map((link) => (
            <Box
              key={link.id}
              component="span"
              onClick={() => handleNav(link.id)}
              sx={{
                fontSize: 14,
                color: colors.textSecondary,
                cursor: "pointer",
                transition: "color 0.2s ease",
                "&:hover": { color: "#FFFFFF" },
              }}
            >
              {link.label}
            </Box>
          ))}
          <Box
            component="button"
            onClick={() => handleNav("contact")}
            sx={{
              fontSize: 13,
              color: "#FFFFFF",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "20px",
              padding: "8px 20px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "border-color 0.2s ease, color 0.2s ease",
              "&:hover": { borderColor: colors.accent, color: colors.accent },
            }}
          >
            Start a Project
          </Box>
        </Box>

        {/* Mobile hamburger */}
        <IconButton
          onClick={() => setMenuOpen(true)}
          sx={{ display: { xs: "inline-flex", md: "none" }, color: "#FFFFFF" }}
          aria-label="Open menu"
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Mobile full-screen overlay */}
      {menuOpen && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: colors.background,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "32px",
          }}
        >
          <IconButton
            onClick={() => setMenuOpen(false)}
            sx={{ position: "absolute", top: 14, right: 16, color: "#FFFFFF" }}
            aria-label="Close menu"
          >
            <CloseIcon />
          </IconButton>

          {LINKS.map((link) => (
            <Box
              key={link.id}
              component="span"
              onClick={() => handleNav(link.id)}
              sx={{
                fontSize: 24,
                fontWeight: 500,
                color: colors.textPrimary,
                cursor: "pointer",
                "&:hover": { color: colors.accent },
              }}
            >
              {link.label}
            </Box>
          ))}
          <Box
            component="button"
            onClick={() => handleNav("contact")}
            sx={{
              mt: 2,
              fontSize: 15,
              color: "#FFFFFF",
              background: colors.accent,
              border: "none",
              borderRadius: "6px",
              padding: "14px 32px",
              cursor: "pointer",
              fontFamily: "inherit",
              "&:hover": { background: colors.accentHover },
            }}
          >
            Start a Project
          </Box>
        </Box>
      )}
    </>
  );
}
