"use client";

import { useState } from "react";
import { Box, TextField, CircularProgress } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { colors } from "@/lib/theme";
import BookingCalendar from "./BookingCalendar";

type Phase = "intro" | "questions" | "finalizing" | "done";

interface CurrentQuestion {
  question: string;
  options: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERROR_RED = "#EF4444";

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
    color: "#444444",
    "&.Mui-focused": { color: colors.accent },
  },
  "& .MuiInput-input::placeholder": {
    color: "rgba(255,255,255,0.18)",
    opacity: 1,
  },
};

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};
const fadeTrans = { duration: 0.25, ease: "easeInOut" as const };

function ProgressDots({ current }: { current: number }) {
  // The total number of questions is decided adaptively by the AI, so we show a
  // simple step counter rather than a fixed "X of N" with a known total.
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "40px" }}>
      <motion.div
        animate={{ width: 24, backgroundColor: colors.accent }}
        transition={{ duration: 0.3 }}
        style={{ height: 8, borderRadius: 4 }}
      />
      <Box sx={{ ml: "4px", fontSize: 12, color: colors.textSecondary }}>
        Question {current + 1}
      </Box>
    </Box>
  );
}

function SubmitButton({
  loading,
  label,
  loadingLabel,
}: {
  loading: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <Box
      component="button"
      type="submit"
      disabled={loading}
      sx={{
        width: "100%",
        height: 52,
        mt: "8px",
        background: colors.accent,
        color: "#FFFFFF",
        fontSize: 15,
        border: "none",
        borderRadius: "6px",
        cursor: loading ? "default" : "pointer",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        transition: "background-color 0.2s ease",
        "&:hover": { background: loading ? colors.accent : colors.accentHover },
        "&:disabled": { opacity: 0.8 },
      }}
    >
      {loading && <CircularProgress size={18} sx={{ color: "#FFFFFF" }} />}
      {loading ? loadingLabel : label}
    </Box>
  );
}

export default function IntakeFlow() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [contactId, setContactId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState<CurrentQuestion>({ question: "", options: [] });
  const [questionNum, setQuestionNum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Intro fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [introErrors, setIntroErrors] = useState<{ name?: string; email?: string; query?: string }>({});

  // Custom answer
  const [customText, setCustomText] = useState("");

  function validateIntro() {
    const e: typeof introErrors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!EMAIL_REGEX.test(email)) e.email = "Enter a valid email";
    if (!query.trim()) e.query = "Tell us what you're looking to build";
    return e;
  }

  async function handleIntroSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateIntro();
    setIntroErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setError(null);
    try {
      const contactRes = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: query.trim() }),
      });
      if (!contactRes.ok) throw new Error();
      const contact = (await contactRes.json()) as { id: number };
      setContactId(contact.id);

      const startRes = await fetch("/api/intake/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: contact.id, query: query.trim() }),
      });
      if (!startRes.ok) throw new Error();
      const startData = (await startRes.json()) as {
        session_id: number;
        question: string;
        options: string[];
      };

      setSessionId(startData.session_id);
      setCurrentQ({ question: startData.question, options: startData.options });
      setQuestionNum(0);
      setPhase("questions");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer(answer: string) {
    if (!sessionId || loading) return;
    setLoading(true);
    setError(null);
    setCustomText("");

    try {
      const res = await fetch("/api/intake/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answer }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as {
        session_id: number;
        question?: string;
        options?: string[];
        done: boolean;
      };

      if (data.done) {
        setPhase("finalizing");
        const finalRes = await fetch("/api/intake/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (!finalRes.ok) throw new Error();
        setPhase("done");
      } else {
        setQuestionNum((n) => n + 1);
        setCurrentQ({ question: data.question!, options: data.options! });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = customText.trim();
    if (!text) return;
    handleAnswer(text);
  }

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", px: { xs: "20px", md: 0 } }}>
      <AnimatePresence mode="wait">

        {/* ── INTRO ── */}
        {phase === "intro" && (
          <motion.div key="intro" {...fade} transition={fadeTrans}>
            <Box
              component="h2"
              sx={{ m: 0, mb: "8px", fontSize: { xs: 28, md: 36 }, fontWeight: 600, color: colors.textPrimary }}
            >
              Tell us about your project
            </Box>
            <Box sx={{ mb: "40px", fontSize: 15, color: colors.textSecondary, lineHeight: 1.7 }}>
              A few quick questions, then pick a time to chat.
            </Box>

            <Box component="form" onSubmit={handleIntroSubmit} noValidate>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: "0 24px" }}>
                <Box sx={{ mb: "24px" }}>
                  <TextField
                    variant="standard"
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    sx={fieldSx}
                  />
                  {introErrors.name && (
                    <Box sx={{ color: ERROR_RED, fontSize: 12, mt: "6px" }}>{introErrors.name}</Box>
                  )}
                </Box>

                <Box sx={{ mb: "24px" }}>
                  <TextField
                    variant="standard"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    sx={fieldSx}
                  />
                  {introErrors.email && (
                    <Box sx={{ color: ERROR_RED, fontSize: 12, mt: "6px" }}>{introErrors.email}</Box>
                  )}
                </Box>
              </Box>

              <Box sx={{ mb: "32px" }}>
                <TextField
                  variant="standard"
                  label="What are you looking to build?"
                  placeholder="e.g. I want a website for my clothing brand"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={fieldSx}
                />
                {introErrors.query && (
                  <Box sx={{ color: ERROR_RED, fontSize: 12, mt: "6px" }}>{introErrors.query}</Box>
                )}
              </Box>

              {error && (
                <Box sx={{ color: ERROR_RED, fontSize: 14, mb: "16px" }}>{error}</Box>
              )}

              <SubmitButton loading={loading} label="Continue →" loadingLabel="Setting up..." />
            </Box>
          </motion.div>
        )}

        {/* ── QUESTIONS ── */}
        {phase === "questions" && (
          <motion.div key="questions" {...fade} transition={fadeTrans}>
            <ProgressDots current={questionNum} />

            <AnimatePresence mode="wait">
              <motion.div
                key={questionNum}
                {...fade}
                transition={fadeTrans}
              >
                <Box
                  component="h2"
                  sx={{
                    m: 0,
                    mb: "32px",
                    fontSize: { xs: 22, md: 28 },
                    fontWeight: 600,
                    color: colors.textPrimary,
                    lineHeight: 1.35,
                  }}
                >
                  {currentQ.question}
                </Box>

                {/* Option cards */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: "12px",
                    mb: "32px",
                    opacity: loading ? 0.45 : 1,
                    pointerEvents: loading ? "none" : "auto",
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {currentQ.options.map((option, i) => (
                    <Box
                      key={i}
                      onClick={() => handleAnswer(option)}
                      sx={{
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "6px",
                        padding: "20px 24px",
                        fontSize: 15,
                        color: colors.textPrimary,
                        cursor: "pointer",
                        userSelect: "none",
                        lineHeight: 1.5,
                        transition: "border-color 0.2s ease, background-color 0.2s ease",
                        "&:hover": {
                          borderColor: colors.accent,
                          backgroundColor: "rgba(124,92,252,0.06)",
                        },
                      }}
                    >
                      {option}
                    </Box>
                  ))}
                </Box>

                {/* Custom text input */}
                <Box
                  component="form"
                  onSubmit={handleCustomSubmit}
                  sx={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-end",
                    opacity: loading ? 0.45 : 1,
                    pointerEvents: loading ? "none" : "auto",
                    transition: "opacity 0.2s ease",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      variant="standard"
                      label="Something else?"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      fullWidth
                      sx={fieldSx}
                    />
                  </Box>
                  <Box
                    component="button"
                    type="submit"
                    disabled={!customText.trim() || loading}
                    sx={{
                      flexShrink: 0,
                      height: 46,
                      px: "20px",
                      mb: "3px",
                      background: colors.accent,
                      color: "#FFFFFF",
                      fontSize: 14,
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "background-color 0.2s ease, opacity 0.2s ease",
                      "&:hover": { background: colors.accentHover },
                      "&:disabled": { opacity: 0.35, cursor: "default" },
                    }}
                  >
                    Submit
                  </Box>
                </Box>

                {/* Thinking indicator */}
                {loading && (
                  <Box
                    sx={{
                      mt: "24px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: colors.textSecondary,
                      fontSize: 14,
                    }}
                  >
                    <CircularProgress size={16} sx={{ color: colors.accent }} />
                    Thinking...
                  </Box>
                )}

                {error && !loading && (
                  <Box sx={{ color: ERROR_RED, fontSize: 14, mt: "16px" }}>{error}</Box>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── FINALIZING ── */}
        {phase === "finalizing" && (
          <motion.div key="finalizing" {...fade} transition={fadeTrans}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: "80px",
                gap: "20px",
              }}
            >
              <CircularProgress sx={{ color: colors.accent }} />
              <Box sx={{ color: colors.textSecondary, fontSize: 15 }}>
                Putting together your summary...
              </Box>
            </Box>
          </motion.div>
        )}

        {/* ── DONE ── */}
        {phase === "done" && contactId !== null && (
          <motion.div key="done" {...fade} transition={fadeTrans}>
            <Box
              sx={{
                fontSize: 11,
                letterSpacing: "4px",
                color: colors.accent,
                textTransform: "uppercase",
                mb: "12px",
              }}
            >
              All done
            </Box>
            <Box
              component="h2"
              sx={{
                m: 0,
                mb: "12px",
                fontSize: { xs: 28, md: 36 },
                fontWeight: 600,
                color: colors.textPrimary,
              }}
            >
              Thanks! We&apos;ve got what we need.
            </Box>
            <Box sx={{ mb: "48px", fontSize: 15, color: colors.textSecondary, lineHeight: 1.7 }}>
              Pick a time that works for you below.
            </Box>
            <BookingCalendar contactId={contactId} />
          </motion.div>
        )}

      </AnimatePresence>
    </Box>
  );
}
