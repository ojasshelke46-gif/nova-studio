"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { colors } from "@/lib/theme";

interface Slot {
  id: number;
  slot_time: string;
  is_booked: boolean;
}

type DayGroup = { label: string; slots: Slot[] };

function buildGroups(slots: Slot[]): DayGroup[] {
  const map = new Map<string, Slot[]>();
  for (const slot of slots) {
    const label = new Date(slot.slot_time).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(slot);
  }
  return Array.from(map.entries()).map(([label, slots]) => ({ label, slots }));
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatFullDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
}

function CheckIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" stroke={colors.accent} strokeWidth="2" />
      <path
        d="M20 32 L28 41 L44 23"
        stroke={colors.accent}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BookingCalendar({ contactId }: { contactId: number }) {
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [bookedSlot, setBookedSlot] = useState<Slot | null>(null);

  useEffect(() => {
    fetch("/api/slots")
      .then((r) => r.json())
      .then((data: Slot[]) => {
        const g = buildGroups(data);
        setGroups(g);
        if (g.length > 0) setActiveDate(g[0].label);
      })
      .catch(() => setError("Failed to load available times."))
      .finally(() => setLoading(false));
  }, []);

  function handleDateClick(label: string) {
    if (label === activeDate) return;
    setActiveDate(label);
    setSelectedSlot(null);
  }

  function handleSlotClick(slot: Slot) {
    setSelectedSlot((prev) => (prev?.id === slot.id ? null : slot));
    setError(null);
  }

  async function handleConfirm() {
    if (!selectedSlot || confirming) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: contactId, slot_id: selectedSlot.id }),
      });
      if (res.status === 409) {
        setError("That slot was just taken. Please choose another time.");
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            slots: g.slots.filter((s) => s.id !== selectedSlot.id),
          })).filter((g) => g.slots.length > 0)
        );
        setSelectedSlot(null);
        return;
      }
      if (!res.ok) throw new Error();
      setBookedSlot(selectedSlot);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setConfirming(false);
    }
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", gap: "12px", alignItems: "center", py: "32px", color: colors.textSecondary, fontSize: 14 }}>
        <CircularProgress size={18} sx={{ color: colors.accent }} />
        Loading available times...
      </Box>
    );
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (bookedSlot) {
    const { date, time } = formatFullDate(bookedSlot.slot_time);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            py: "48px",
            px: "32px",
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: "6px",
          }}
        >
          <Box sx={{ mb: "24px" }}>
            <CheckIcon />
          </Box>
          <Box
            component="h3"
            sx={{ m: 0, mb: "12px", fontSize: 24, fontWeight: 600, color: colors.textPrimary }}
          >
            You&apos;re all set!
          </Box>
          <Box sx={{ mb: "24px", fontSize: 15, color: colors.textSecondary, lineHeight: 1.7 }}>
            Check your email for confirmation. We&apos;ll see you on{" "}
            <Box component="span" sx={{ color: colors.textPrimary }}>
              {date}
            </Box>{" "}
            at{" "}
            <Box component="span" sx={{ color: colors.textPrimary }}>
              {time}
            </Box>
            .
          </Box>
          <Box
            sx={{
              px: "24px",
              py: "10px",
              borderRadius: "6px",
              border: `1px solid rgba(124,92,252,0.3)`,
              backgroundColor: "rgba(124,92,252,0.06)",
              fontSize: 14,
              color: colors.accent,
            }}
          >
            {date} · {time}
          </Box>
        </Box>
      </motion.div>
    );
  }

  // ── EMPTY ─────────────────────────────────────────────────────────────────
  if (groups.length === 0) {
    return (
      <Box sx={{ fontSize: 15, color: colors.textSecondary, py: "16px" }}>
        No available times right now. Email us at{" "}
        <Box
          component="a"
          href="mailto:hello@novastudio.com"
          sx={{ color: colors.accent, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
        >
          hello@novastudio.com
        </Box>
        .
      </Box>
    );
  }

  const activeGroup = groups.find((g) => g.label === activeDate);

  // ── CALENDAR ──────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Date tabs */}
      <Box
        sx={{
          display: "flex",
          gap: "4px",
          overflowX: "auto",
          pb: "1px",
          mb: "24px",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {groups.map(({ label }) => {
          const active = label === activeDate;
          return (
            <Box
              key={label}
              onClick={() => handleDateClick(label)}
              sx={{
                flexShrink: 0,
                px: "16px",
                py: "12px",
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? colors.textPrimary : colors.textSecondary,
                cursor: "pointer",
                borderBottom: `2px solid ${active ? colors.accent : "transparent"}`,
                mb: "-1px",
                whiteSpace: "nowrap",
                transition: "color 0.15s ease, border-color 0.15s ease",
                userSelect: "none",
                "&:hover": { color: active ? colors.textPrimary : "rgba(226,226,226,0.6)" },
              }}
            >
              {label}
            </Box>
          );
        })}
      </Box>

      {/* Time slots for active date */}
      <AnimatePresence mode="wait">
        {activeGroup && (
          <motion.div
            key={activeDate ?? ""}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))",
                gap: "8px",
                mb: "24px",
              }}
            >
              {activeGroup.slots.map((slot) => {
                const selected = selectedSlot?.id === slot.id;
                return (
                  <Box
                    key={slot.id}
                    onClick={() => handleSlotClick(slot)}
                    sx={{
                      py: "12px",
                      px: "8px",
                      textAlign: "center",
                      borderRadius: "6px",
                      border: `1px solid ${selected ? colors.accent : colors.border}`,
                      backgroundColor: selected ? "rgba(124,92,252,0.1)" : colors.surface,
                      color: selected ? colors.accent : colors.textPrimary,
                      fontSize: 14,
                      fontWeight: selected ? 500 : 400,
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: colors.accent,
                        backgroundColor: selected ? "rgba(124,92,252,0.1)" : "rgba(124,92,252,0.05)",
                        color: colors.accent,
                      },
                    }}
                  >
                    {formatTime(slot.slot_time)}
                  </Box>
                );
              })}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Box sx={{ color: "#EF4444", fontSize: 14, mb: "16px" }}>{error}</Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm button */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              component="button"
              onClick={handleConfirm}
              disabled={confirming}
              sx={{
                width: "100%",
                height: 52,
                background: colors.accent,
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: 500,
                border: "none",
                borderRadius: "6px",
                cursor: confirming ? "default" : "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "background-color 0.2s ease",
                "&:hover": { background: confirming ? colors.accent : colors.accentHover },
                "&:disabled": { opacity: 0.8 },
              }}
            >
              {confirming && <CircularProgress size={18} sx={{ color: "#FFFFFF" }} />}
              {confirming
                ? "Confirming..."
                : `Confirm ${formatTime(selectedSlot.slot_time)}`}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
