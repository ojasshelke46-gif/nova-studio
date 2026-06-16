"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
} from "@mui/material";
import { colors } from "@/lib/theme";

interface AnalyticsEvent {
  _id: string;
  type: string;
  page?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const cellSx = { borderBottom: "1px solid rgba(255,255,255,0.06)", color: colors.textPrimary };
const headSx = { ...cellSx, color: colors.textSecondary, fontSize: 13 };

export default function AnalyticsTab() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/analytics");
        setEvents(res.ok ? await res.json() : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress sx={{ color: colors.accent }} />
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8, color: colors.textSecondary }}>
        No events yet
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: colors.surface, overflowX: "auto" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={headSx}>Type</TableCell>
            <TableCell sx={headSx}>Metadata</TableCell>
            <TableCell sx={headSx}>Timestamp</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((ev) => (
            <TableRow key={ev._id}>
              <TableCell sx={cellSx}>{ev.type}</TableCell>
              <TableCell sx={{ ...cellSx, fontFamily: "monospace", fontSize: 12 }}>
                {JSON.stringify(ev.metadata ?? {})}
              </TableCell>
              <TableCell sx={cellSx}>{new Date(ev.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
