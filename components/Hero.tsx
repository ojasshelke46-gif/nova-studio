"use client";

import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { colors } from "@/lib/theme";
import { track } from "@/lib/track";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const metrics = ["150+ Projects", "50+ Clients", "5 Yrs Experience"];

export default function Hero() {
  const handleStart = () => {
    track("cta_click", { section: "hero", label: "Start a Project" });
    scrollTo("contact");
  };

  return (
    <Box
      component="section"
      id="hero"
      sx={{
        position: "relative",
        minHeight: "calc(100vh - 64px)",
        mt: "64px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        px: { xs: "24px", md: "48px" },
      }}
    >
      {/* Decorative gradient orb (desktop only) */}
      <Box
        component={motion.div}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        sx={{
          display: { xs: "none", md: "block" },
          position: "absolute",
          right: "-120px",
          top: "50%",
          transform: "translateY(-50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: { xs: "100%", md: "55%" },
          textAlign: { xs: "center", md: "left" },
          mx: { xs: "auto", md: 0 },
        }}
      >
        {/* Overline */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          sx={{
            fontSize: 11,
            letterSpacing: "4px",
            color: colors.accent,
            textTransform: "uppercase",
            mb: "24px",
          }}
        >
          Digital Agency
        </Box>

        {/* Heading */}
        <Box
          component={motion.h1}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
          sx={{
            m: 0,
            fontSize: { xs: "36px", md: "68px" },
            fontWeight: 600,
            lineHeight: 1.08,
            color: colors.textPrimary,
          }}
        >
          We build{" "}
          <Box
            component="span"
            sx={{
              background: "linear-gradient(135deg, #7C5CFC, #B794F6)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            digital
          </Box>{" "}
          experiences that matter
        </Box>

        {/* Subheading */}
        <Box
          component={motion.p}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.45 }}
          sx={{
            fontSize: 17,
            lineHeight: 1.7,
            color: colors.textSecondary,
            maxWidth: 500,
            mt: "28px",
            mx: { xs: "auto", md: 0 },
          }}
        >
          Design and engineering studio crafting high-performance websites,
          brands, and products for ambitious companies.
        </Box>

        {/* CTAs */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.55 }}
          sx={{
            mt: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "center", md: "flex-start" },
          }}
        >
          <Box
            component="button"
            onClick={handleStart}
            sx={{
              background: colors.accent,
              color: "#FFFFFF",
              padding: "14px 32px",
              borderRadius: "6px",
              fontSize: 15,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "none",
              transition: "background-color 0.2s ease",
              "&:hover": { background: colors.accentHover },
            }}
          >
            Start a Project
          </Box>
          <Box
            component="span"
            onClick={() => scrollTo("portfolio")}
            sx={{
              ml: "32px",
              fontSize: 15,
              color: colors.textSecondary,
              cursor: "pointer",
              transition: "color 0.2s ease",
              "&:hover": { color: "#FFFFFF" },
            }}
          >
            View Our Work →
          </Box>
        </Box>

        {/* Trust metrics */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.75 }}
          sx={{
            mt: "64px",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: { xs: "center", md: "flex-start" },
            gap: { xs: "8px", md: "12px" },
            fontSize: 13,
            color: "#333333",
          }}
        >
          {metrics.map((m, i) => (
            <Box key={m} sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span>{m}</span>
              {i < metrics.length - 1 && (
                <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                  ·
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
