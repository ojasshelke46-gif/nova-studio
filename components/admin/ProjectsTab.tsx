"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
} from "@mui/material";
import Image from "next/image";
import { colors } from "@/lib/theme";
import { formatDate } from "@/lib/formatDate";

interface Project {
  id: number;
  title: string;
  category: string;
  image_url: string;
  created_at: string;
}

const CATEGORIES = ["Web Design", "Branding", "Development"];
const cellSx = { borderBottom: "1px solid rgba(255,255,255,0.06)", color: colors.textPrimary };
const headSx = { ...cellSx, color: colors.textSecondary, fontSize: 13 };

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "#FFFFFF",
    fontSize: 14,
    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&.Mui-focused fieldset": { borderColor: colors.accent },
  },
  "& .MuiInputLabel-root": { color: "#555555", "&.Mui-focused": { color: colors.accent } },
};

export default function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", category: "Web Design", image_url: "" });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/projects");
      setProjects(res.ok ? await res.json() : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.image_url) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ title: "", category: "Web Design", image_url: "" });
        await load();
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this project?")) return;
    const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  return (
    <Box>
      {/* Inline add form */}
      <Box
        component="form"
        onSubmit={handleAdd}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: "12px",
          mb: "24px",
        }}
      >
        <TextField
          label="Title"
          size="small"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          sx={{ ...fieldSx, flex: 1 }}
        />
        <Select
          size="small"
          value={form.category}
          onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          sx={{
            minWidth: 160,
            color: "#FFFFFF",
            fontSize: 14,
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: colors.accent },
            "& .MuiSvgIcon-root": { color: colors.textSecondary },
          }}
        >
          {CATEGORIES.map((cat) => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
        <TextField
          label="Image URL"
          size="small"
          value={form.image_url}
          onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
          sx={{ ...fieldSx, flex: 2 }}
        />
        <Box
          component="button"
          type="submit"
          disabled={adding}
          sx={{
            background: colors.accent,
            color: "#FFFFFF",
            border: "none",
            borderRadius: "6px",
            px: "24px",
            height: 40,
            fontSize: 14,
            cursor: adding ? "default" : "pointer",
            fontFamily: "inherit",
            "&:hover": { background: colors.accentHover },
            "&:disabled": { opacity: 0.8 },
          }}
        >
          {adding ? "Adding..." : "Add"}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: colors.accent }} />
        </Box>
      ) : (
        <Box sx={{ backgroundColor: colors.surface, overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headSx}>Image</TableCell>
                <TableCell sx={headSx}>Title</TableCell>
                <TableCell sx={headSx}>Category</TableCell>
                <TableCell sx={headSx}>Date</TableCell>
                <TableCell sx={headSx} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell sx={cellSx}>
                    <Box
                      sx={{
                        position: "relative",
                        width: 40,
                        height: 40,
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={p.image_url}
                        alt={p.title}
                        fill
                        sizes="40px"
                        style={{ objectFit: "cover" }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={cellSx}>{p.title}</TableCell>
                  <TableCell sx={cellSx}>{p.category}</TableCell>
                  <TableCell sx={cellSx}>{formatDate(p.created_at)}</TableCell>
                  <TableCell sx={cellSx} align="right">
                    <Box
                      component="button"
                      onClick={() => handleDelete(p.id)}
                      sx={{
                        background: "none",
                        border: "none",
                        color: "#DC2626",
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Delete
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell sx={{ ...cellSx, textAlign: "center", color: colors.textSecondary }} colSpan={5}>
                    No projects yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
