"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Tabs, Tab } from "@mui/material";
import { colors } from "@/lib/theme";
import InquiriesTab from "./InquiriesTab";
import ProjectsTab from "./ProjectsTab";
import AnalyticsTab from "./AnalyticsTab";

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState(0);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <Box sx={{ minHeight: "100vh", px: { xs: "20px", md: "48px" }, py: "32px" }}>
      {/* Top bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: "32px",
        }}
      >
        <Box sx={{ fontSize: 18, fontWeight: 600, color: colors.textPrimary }}>
          Nova Studio Admin
        </Box>
        <Box
          component="button"
          onClick={handleLogout}
          sx={{
            background: "none",
            border: "none",
            fontFamily: "inherit",
            fontSize: 14,
            color: colors.textSecondary,
            cursor: "pointer",
            transition: "color 0.2s ease",
            "&:hover": { color: "#FFFFFF" },
          }}
        >
          Logout
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          mb: "24px",
          "& .MuiTab-root": { color: colors.textSecondary, textTransform: "none", fontSize: 14 },
          "& .MuiTab-root.Mui-selected": { color: "#FFFFFF" },
          "& .MuiTabs-indicator": { backgroundColor: colors.accent },
        }}
      >
        <Tab label="Inquiries" />
        <Tab label="Projects" />
        <Tab label="Analytics" />
      </Tabs>

      {tab === 0 && <InquiriesTab />}
      {tab === 1 && <ProjectsTab />}
      {tab === 2 && <AnalyticsTab />}
    </Box>
  );
}
