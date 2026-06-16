"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import Image from "next/image";
import { colors } from "@/lib/theme";
import { track } from "@/lib/track";

export interface Project {
  id: number;
  title: string;
  category: string;
  image_url: string;
  created_at: string;
}

const FILTERS = ["All", "Web Design", "Branding", "Development"];
const ease = [0.25, 0.46, 0.45, 0.94] as const;

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

export default function PortfolioGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <>
      {/* Filter bar */}
      <Box sx={{ display: "flex", flexWrap: "wrap", mb: "48px" }}>
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Box
              key={f}
              component="button"
              onClick={() => {
                setFilter(f);
                track("filter_click", { category: f });
              }}
              sx={{
                fontSize: 14,
                color: active ? "#FFFFFF" : colors.textSecondary,
                padding: "8px 0",
                mr: "32px",
                background: "none",
                border: "none",
                borderBottom: active ? `2px solid ${colors.accent}` : "2px solid transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "color 0.2s ease",
              }}
            >
              {f}
            </Box>
          );
        })}
      </Box>

      {/* Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: "24px",
          }}
        >
        {filtered.map((project) => (
          <motion.div key={project.id} variants={item} style={{ overflow: "hidden" }}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 10",
                overflow: "hidden",
                "&:hover .portfolio-image": { transform: "scale(1.05)" },
              }}
            >
              <Image
                src={project.image_url}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="portfolio-image"
                style={{ objectFit: "cover", transition: "transform 0.5s ease" }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "20px 0",
              }}
            >
              <Box component="span" sx={{ fontSize: 17, fontWeight: 600, color: "#FFFFFF" }}>
                {project.title}
              </Box>
              <Box component="span" sx={{ fontSize: 13, color: colors.textSecondary }}>
                {project.category}
              </Box>
            </Box>
          </motion.div>
        ))}
        </Box>
      </motion.div>
    </>
  );
}
