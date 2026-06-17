"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Collapse,
  Snackbar,
  TextField,
} from "@mui/material";
import { colors } from "@/lib/theme";

interface ScoreBreakdown {
  clarity: number;
  urgency: number;
  budget_signal: number;
  decision_authority: number;
}

interface Report {
  session_id: number;
  report_text: string;
  lead_score: number;
  score_breakdown: ScoreBreakdown | null;
  proposal_draft: string;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

function LeadBadge({ score }: { score: number }) {
  const color =
    score > 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#EF4444";
  const label = score > 70 ? "High" : score >= 40 ? "Medium" : "Low";
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        px: "10px",
        py: "3px",
        borderRadius: "4px",
        backgroundColor: `${color}18`,
        border: `1px solid ${color}44`,
        fontSize: 13,
        fontWeight: 500,
        color,
      }}
    >
      {label} · {score}/100
    </Box>
  );
}

const BREAKDOWN_LABELS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "clarity", label: "Clarity" },
  { key: "urgency", label: "Urgency" },
  { key: "budget_signal", label: "Budget" },
  { key: "decision_authority", label: "Authority" },
];

function ScoreBreakdownBars({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px",
        mt: "10px",
        maxWidth: 360,
      }}
    >
      {BREAKDOWN_LABELS.map(({ key, label }) => {
        const value = breakdown[key];
        const pct = Math.max(0, Math.min(100, (value / 25) * 100));
        return (
          <Box key={key}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: colors.textSecondary,
                mb: "4px",
              }}
            >
              <Box component="span">{label}</Box>
              <Box component="span" sx={{ color: colors.textPrimary }}>
                {value}/25
              </Box>
            </Box>
            <Box
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 2,
                  backgroundColor: colors.accent,
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

const dividerSx = {
  borderTop: "1px solid rgba(255,255,255,0.07)",
  my: "20px",
};

const sectionLabelSx = {
  fontSize: 11,
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
  color: colors.textSecondary,
  mb: "12px",
};

const chatInputSx = {
  "& .MuiInput-root": {
    color: colors.textPrimary,
    fontSize: 13,
    "&:before": { borderBottom: "1px solid rgba(255,255,255,0.12)" },
    "&:hover:not(.Mui-disabled):before": {
      borderBottom: "1px solid rgba(255,255,255,0.2)",
    },
    "&:after": { borderBottom: `1px solid ${colors.accent}` },
  },
  "& input::placeholder": { color: "#444", opacity: 1 },
};

const emailFieldSx = {
  "& .MuiOutlinedInput-root": {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 1.7,
    "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&.Mui-focused fieldset": { borderColor: colors.accent },
  },
};

export default function ContactAIPanel({ contact }: { contact: Contact }) {
  const [report, setReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [proposalOpen, setProposalOpen] = useState(false);

  // Chat
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Email draft
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailInstruction, setEmailInstruction] = useState("");
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/contacts/${contact.id}/report`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setReport(data ?? null))
      .catch(() => setReport(null))
      .finally(() => setReportLoading(false));
  }, [contact.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const q = chatInput.trim();
    if (!q || !report || chatLoading) return;
    setChatInput("");
    const userMsg: ChatMsg = { role: "user", content: q };
    const next = [...chatHistory, userMsg];
    setChatHistory(next);
    setChatLoading(true);
    try {
      const res = await fetch("/api/admin/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: report.session_id,
          question: q,
          history: chatHistory,
        }),
      });
      if (!res.ok) throw new Error();
      const { answer } = (await res.json()) as { answer: string };
      setChatHistory([...next, { role: "assistant", content: answer }]);
    } catch {
      setChatHistory([
        ...next,
        { role: "assistant", content: "Error reaching AI. Try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function draftEmail() {
    if (!report || emailLoading) return;
    setEmailLoading(true);
    setEmailDraft(null);
    setEmailError(null);
    try {
      const res = await fetch("/api/admin/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: report.session_id,
          instruction: emailInstruction.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      const { draft } = (await res.json()) as { draft: string };
      setEmailDraft(draft);
    } catch {
      setEmailError("Failed to generate draft. Try again.");
    } finally {
      setEmailLoading(false);
    }
  }

  async function sendEmail() {
    if (emailDraft === null || emailSending) return;
    setEmailSending(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/admin/send-prep-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: contact.id,
          email_body: emailDraft,
        }),
      });
      if (!res.ok) throw new Error();
      setToast(true);
      setEmailDraft(null);
    } catch {
      setEmailError("Failed to send. Check email config.");
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <Box sx={{ pt: "4px", pb: "20px" }}>
      {/* Full message */}
      <Box
        sx={{
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 1.7,
        }}
      >
        {contact.message}
      </Box>

      {reportLoading ? (
        <Box
          sx={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            mt: "16px",
            color: colors.textSecondary,
            fontSize: 13,
          }}
        >
          <CircularProgress size={14} sx={{ color: colors.accent }} />
          Checking for intake report...
        </Box>
      ) : !report ? (
        <Box sx={{ mt: "16px", fontSize: 13, color: "#444" }}>
          No intake report for this contact.
        </Box>
      ) : (
        <>
          {/* ── REPORT ── */}
          <Box sx={dividerSx} />
          <Box sx={sectionLabelSx}>AI Intake Report</Box>
          <Box sx={{ mb: "12px" }}>
            <LeadBadge score={report.lead_score} />
            {report.score_breakdown && (
              <ScoreBreakdownBars breakdown={report.score_breakdown} />
            )}
          </Box>
          <Box
            sx={{
              fontSize: 14,
              color: colors.textPrimary,
              lineHeight: 1.7,
              mb: "12px",
            }}
          >
            {report.report_text}
          </Box>

          {/* Proposal collapsible */}
          <Box
            onClick={() => setProposalOpen((o) => !o)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: 13,
              color: colors.accent,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <Box
              component="span"
              sx={{ fontSize: 10, display: "inline-block" }}
            >
              {proposalOpen ? "▲" : "▼"}
            </Box>
            Proposal Draft
          </Box>
          <Collapse in={proposalOpen}>
            <Box
              sx={{
                mt: "8px",
                p: "14px 16px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "4px",
                fontSize: 13,
                color: colors.textSecondary,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {report.proposal_draft}
            </Box>
          </Collapse>

          {/* ── AI CHAT ── */}
          <Box sx={dividerSx} />
          <Box sx={sectionLabelSx}>Ask AI about this client</Box>

          {chatHistory.length > 0 && (
            <Box
              sx={{
                maxHeight: 240,
                overflowY: "auto",
                mb: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                pr: "2px",
              }}
            >
              {chatHistory.map((m, i) => (
                <Box
                  key={i}
                  sx={{
                    alignSelf:
                      m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "82%",
                    px: "13px",
                    py: "9px",
                    borderRadius: "6px",
                    backgroundColor:
                      m.role === "user"
                        ? "rgba(124,92,252,0.12)"
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      m.role === "user"
                        ? "rgba(124,92,252,0.25)"
                        : "rgba(255,255,255,0.08)"
                    }`,
                    fontSize: 13,
                    color: colors.textPrimary,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.content}
                </Box>
              ))}
              {chatLoading && (
                <Box
                  sx={{
                    alignSelf: "flex-start",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    color: colors.textSecondary,
                    fontSize: 13,
                  }}
                >
                  <CircularProgress size={12} sx={{ color: colors.accent }} />
                  Thinking...
                </Box>
              )}
              <div ref={chatBottomRef} />
            </Box>
          )}

          <Box
            component="form"
            onSubmit={sendChat}
            sx={{ display: "flex", gap: "8px", alignItems: "flex-end" }}
          >
            <TextField
              variant="standard"
              placeholder="Ask a question about this client..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
              fullWidth
              size="small"
              sx={chatInputSx}
            />
            <Box
              component="button"
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              sx={{
                flexShrink: 0,
                px: "16px",
                py: "6px",
                mb: "2px",
                background: colors.accent,
                color: "#fff",
                fontSize: 13,
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                "&:disabled": { opacity: 0.35, cursor: "default" },
              }}
            >
              Send
            </Box>
          </Box>

          {/* ── EMAIL DRAFT ── */}
          <Box sx={dividerSx} />
          <Box sx={sectionLabelSx}>Pre-meeting Email</Box>

          {emailError && (
            <Box
              sx={{ mb: "10px", fontSize: 13, color: "#EF4444" }}
            >
              {emailError}
            </Box>
          )}

          {emailDraft === null ? (
            <>
            <Box sx={{ mb: "10px" }}>
              <TextField
                variant="standard"
                placeholder="Optional — tell the AI what to ask or focus on (e.g. 'ask about their timeline and budget range')"
                value={emailInstruction}
                onChange={(e) => setEmailInstruction(e.target.value)}
                disabled={emailLoading}
                fullWidth
                size="small"
                sx={chatInputSx}
              />
            </Box>
            <Box
              component="button"
              onClick={draftEmail}
              disabled={emailLoading}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                px: "14px",
                py: "8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                color: colors.textPrimary,
                fontSize: 13,
                cursor: emailLoading ? "default" : "pointer",
                fontFamily: "inherit",
                transition: "background-color 0.15s ease",
                "&:hover:not(:disabled)": {
                  backgroundColor: "rgba(255,255,255,0.08)",
                },
                "&:disabled": { opacity: 0.5 },
              }}
            >
              {emailLoading && (
                <CircularProgress size={12} sx={{ color: colors.accent }} />
              )}
              {emailLoading ? "Drafting..." : "Draft pre-meeting email"}
            </Box>
            </>
          ) : (
            <Box>
              <TextField
                multiline
                rows={5}
                fullWidth
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                variant="outlined"
                sx={{ ...emailFieldSx, mb: "10px" }}
              />
              <Box sx={{ display: "flex", gap: "8px" }}>
                <Box
                  component="button"
                  onClick={sendEmail}
                  disabled={emailSending}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    px: "16px",
                    py: "8px",
                    background: colors.accent,
                    border: "none",
                    borderRadius: "4px",
                    color: "#fff",
                    fontSize: 13,
                    cursor: emailSending ? "default" : "pointer",
                    fontFamily: "inherit",
                    "&:disabled": { opacity: 0.6 },
                  }}
                >
                  {emailSending && (
                    <CircularProgress size={12} sx={{ color: "#fff" }} />
                  )}
                  {emailSending ? "Sending..." : "Send"}
                </Box>
                <Box
                  component="button"
                  onClick={() => {
                    setEmailDraft(null);
                    setEmailError(null);
                  }}
                  sx={{
                    px: "14px",
                    py: "8px",
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    color: colors.textSecondary,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    "&:hover": { borderColor: "rgba(255,255,255,0.2)" },
                  }}
                >
                  Discard
                </Box>
              </Box>
            </Box>
          )}
        </>
      )}

      <Snackbar
        open={toast}
        autoHideDuration={3500}
        onClose={() => setToast(false)}
        message={`Email sent to ${contact.email}`}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        ContentProps={{
          sx: {
            backgroundColor: "#1a1a1a",
            border: "1px solid #10B981",
            color: "#10B981",
            fontSize: 13,
          },
        }}
      />
    </Box>
  );
}
