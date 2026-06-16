import { createTheme } from "@mui/material/styles";

export const colors = {
  background: "#050505",
  surface: "#0A0A0A",
  border: "rgba(255, 255, 255, 0.06)",
  accent: "#7C5CFC",
  accentHover: "#6A4CE0",
  textPrimary: "#E2E2E2",
  textSecondary: "#555555",
};

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    primary: {
      main: colors.accent,
      dark: colors.accentHover,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
    divider: colors.border,
  },
  typography: {
    fontFamily: "var(--font-inter), 'Inter', sans-serif",
    button: { textTransform: "none" },
  },
  shape: {
    borderRadius: 6,
  },
  shadows: Array(25).fill("none") as unknown as ReturnType<
    typeof createTheme
  >["shadows"],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: "smooth",
          // avoid horizontal jiggle from scrollbar appearing/disappearing
          scrollbarGutter: "stable",
        },
        body: {
          backgroundColor: colors.background,
          overflowX: "hidden",
        },
      },
    },
  },
});

export default theme;
