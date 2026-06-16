"use client";

import { useState } from "react";
import { Box, TextField, Snackbar, Alert, CircularProgress } from "@mui/material";
import { colors } from "@/lib/theme";
import { track } from "@/lib/track";

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERROR_RED = "#EF4444";

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!EMAIL_REGEX.test(form.email)) errors.email = "Enter a valid email";
  if (form.message.trim().length < 10)
    errors.message = "Message must be at least 10 characters";
  return errors;
}

const fieldSx = {
  "& .MuiInput-root": {
    backgroundColor: "transparent",
    color: "#FFFFFF",
    fontSize: 15,
    padding: "16px 0",
    "&:before": { borderBottom: "1px solid rgba(255,255,255,0.1)" },
    "&:hover:not(.Mui-disabled):before": { borderBottom: "1px solid rgba(255,255,255,0.1)" },
    "&:after": { borderBottom: `1px solid ${colors.accent}` },
  },
  "& .MuiInputLabel-root": {
    color: "#333333",
    "&.Mui-focused": { color: colors.accent },
  },
};

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
    bg: string;
  }>({ open: false, severity: "success", message: "", bg: "" });

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");

      setForm({ name: "", email: "", message: "" });
      setErrors({});
      track("contact_submit");
      setSnackbar({
        open: true,
        severity: "success",
        message: "Message sent — we'll be in touch.",
        bg: "#059669",
      });
    } catch {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Something went wrong. Try again.",
        bg: "#DC2626",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const errorText = (msg?: string) =>
    msg ? (
      <Box sx={{ color: ERROR_RED, fontSize: 12, mt: "6px" }}>{msg}</Box>
    ) : null;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box>
        <TextField
          variant="standard"
          label="Name"
          value={form.name}
          onChange={handleChange("name")}
          fullWidth
          sx={fieldSx}
        />
        {errorText(errors.name)}
      </Box>

      <Box>
        <TextField
          variant="standard"
          label="Email"
          value={form.email}
          onChange={handleChange("email")}
          fullWidth
          sx={fieldSx}
        />
        {errorText(errors.email)}
      </Box>

      <Box>
        <TextField
          variant="standard"
          label="Message"
          value={form.message}
          onChange={handleChange("message")}
          multiline
          rows={4}
          fullWidth
          sx={fieldSx}
        />
        {errorText(errors.message)}
      </Box>

      <Box
        component="button"
        type="submit"
        disabled={submitting}
        sx={{
          width: "100%",
          height: 52,
          mt: "32px",
          background: colors.accent,
          color: "#FFFFFF",
          fontSize: 15,
          border: "none",
          borderRadius: "6px",
          cursor: submitting ? "default" : "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          transition: "background-color 0.2s ease",
          "&:hover": { background: colors.accentHover },
          "&:disabled": { opacity: 0.8 },
        }}
      >
        {submitting && <CircularProgress size={20} sx={{ color: "#FFFFFF" }} />}
        {submitting ? "Sending..." : "Send Message"}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ backgroundColor: snackbar.bg, color: "#FFFFFF" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
