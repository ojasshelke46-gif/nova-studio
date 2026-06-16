"use client";

import { useState } from "react";
import { Box, Dialog, IconButton, useMediaQuery, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { colors } from "@/lib/theme";
import { track } from "@/lib/track";
import IntakeFlow from "./IntakeFlow";

export default function ContactPanel() {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const openFlow = () => {
    track("cta_click", { section: "contact", label: "Get Started" });
    setOpen(true);
  };

  return (
    <>
      <Box
        sx={{
          p: { xs: "28px 24px", md: "36px 32px" },
          borderRadius: "10px",
          border: `1px solid ${colors.border}`,
          background:
            "linear-gradient(135deg, rgba(124,92,252,0.08), rgba(124,92,252,0.02))",
        }}
      >
        <Box
          sx={{
            fontSize: 11,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: colors.accent,
            mb: "12px",
          }}
        >
          Project Planner
        </Box>
        <Box
          component="h3"
          sx={{
            m: 0,
            mb: "10px",
            fontSize: { xs: 22, md: 26 },
            fontWeight: 600,
            color: colors.textPrimary,
            lineHeight: 1.25,
          }}
        >
          Tell us what you&apos;re building
        </Box>
        <Box
          sx={{
            mb: "28px",
            fontSize: 14,
            lineHeight: 1.75,
            color: colors.textSecondary,
          }}
        >
          Answer a few quick questions and book a call — our AI maps your project
          and preps the team before you even speak.
        </Box>

        <Box
          component="button"
          onClick={openFlow}
          sx={{
            width: "100%",
            height: 52,
            background: colors.accent,
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 500,
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.02em",
            transition: "background-color 0.2s ease",
            "&:hover": { background: colors.accentHover },
          }}
        >
          Get Started →
        </Box>
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullScreen={fullScreen}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: colors.background,
              backgroundImage: "none",
              border: fullScreen ? "none" : `1px solid ${colors.border}`,
              borderRadius: fullScreen ? 0 : "12px",
            },
          },
        }}
      >
        <Box sx={{ position: "relative", py: { xs: "56px", md: "72px" } }}>
          <IconButton
            onClick={() => setOpen(false)}
            aria-label="Close"
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: colors.textSecondary,
              "&:hover": { color: colors.textPrimary },
            }}
          >
            <CloseIcon />
          </IconButton>
          <IntakeFlow />
        </Box>
      </Dialog>
    </>
  );
}
