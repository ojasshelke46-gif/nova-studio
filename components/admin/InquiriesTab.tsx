"use client";

import { useEffect, useState, Fragment } from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Collapse,
  CircularProgress,
} from "@mui/material";
import { colors } from "@/lib/theme";
import { formatDate } from "@/lib/formatDate";

interface Contact {
  id: number;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

const cellSx = { borderBottom: "1px solid rgba(255,255,255,0.06)", color: colors.textPrimary };
const headSx = { ...cellSx, color: colors.textSecondary, fontSize: 13 };

function truncate(text: string, n: number) {
  return text.length > n ? `${text.slice(0, n)}…` : text;
}

export default function InquiriesTab() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/contacts");
        setContacts(res.ok ? await res.json() : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const markRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "read" }),
    });
    if (res.ok) {
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "read" } : c))
      );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress sx={{ color: colors.accent }} />
      </Box>
    );
  }

  if (contacts.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8, color: colors.textSecondary }}>
        No inquiries yet
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: colors.surface, overflowX: "auto" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={headSx}>Status</TableCell>
            <TableCell sx={headSx}>Name</TableCell>
            <TableCell sx={headSx}>Email</TableCell>
            <TableCell sx={headSx}>Message</TableCell>
            <TableCell sx={headSx}>Date</TableCell>
            <TableCell sx={headSx} align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contacts.map((c) => (
            <Fragment key={c.id}>
              <TableRow
                hover
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell sx={cellSx}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: c.status === "new" ? "#059669" : "#555555",
                    }}
                  />
                </TableCell>
                <TableCell sx={cellSx}>{c.name}</TableCell>
                <TableCell sx={cellSx}>{c.email}</TableCell>
                <TableCell sx={cellSx}>{truncate(c.message, 80)}</TableCell>
                <TableCell sx={cellSx}>{formatDate(c.created_at)}</TableCell>
                <TableCell sx={cellSx} align="right">
                  {c.status === "new" && (
                    <Box
                      component="button"
                      onClick={(e) => markRead(c.id, e)}
                      sx={{
                        background: "none",
                        border: "none",
                        color: colors.accent,
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Mark read
                    </Box>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ ...cellSx, py: 0 }} colSpan={6}>
                  <Collapse in={expanded === c.id} timeout="auto" unmountOnExit>
                    <Box sx={{ py: 2, color: colors.textSecondary, fontSize: 14, lineHeight: 1.7 }}>
                      {c.message}
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
