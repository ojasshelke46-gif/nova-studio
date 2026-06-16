"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, TextField } from "@mui/material";
import { colors } from "@/lib/theme";

const fieldSx = {
  "& .MuiInput-root": {
    backgroundColor: "transparent",
    color: "#FFFFFF",
    fontSize: 15,
    padding: "12px 0",
    "&:before": { borderBottom: "1px solid rgba(255,255,255,0.1)" },
    "&:hover:not(.Mui-disabled):before": { borderBottom: "1px solid rgba(255,255,255,0.1)" },
    "&:after": { borderBottom: `1px solid ${colors.accent}` },
  },
  "& .MuiInputLabel-root": {
    color: "#333333",
    "&.Mui-focused": { color: colors.accent },
  },
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("Invalid credentials");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={submitLogin}
        sx={{
          width: "100%",
          maxWidth: 380,
          backgroundColor: colors.surface,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "40px",
          borderRadius: "8px",
        }}
      >
        <Box
          sx={{ fontSize: 24, fontWeight: 600, textAlign: "center", mb: "32px", color: colors.textPrimary }}
        >
          Admin
        </Box>

        <TextField
          variant="standard"
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          sx={fieldSx}
          autoFocus
        />
        <TextField
          variant="standard"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          sx={{ ...fieldSx, mt: "16px" }}
        />

        <Box
          component="button"
          type="submit"
          disabled={submitting}
          sx={{
            width: "100%",
            height: 48,
            mt: "24px",
            background: colors.accent,
            color: "#FFFFFF",
            fontSize: 15,
            border: "none",
            borderRadius: "6px",
            cursor: submitting ? "default" : "pointer",
            fontFamily: "inherit",
            transition: "background-color 0.2s ease",
            "&:hover": { background: colors.accentHover },
            "&:disabled": { opacity: 0.8 },
          }}
        >
          {submitting ? "Signing in..." : "Login"}
        </Box>

        {error && (
          <Box sx={{ mt: "16px", textAlign: "center", color: "#EF4444", fontSize: 13 }}>
            {error}
          </Box>
        )}
      </Box>
    </Box>
  );
}
