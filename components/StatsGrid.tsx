"use client";

import { Fragment, useRef } from "react";
import { Box } from "@mui/material";
import { useInView } from "framer-motion";
import { useCountUp } from "@/lib/useCountUp";
import { colors } from "@/lib/theme";

export interface Stat {
  id: number;
  label: string;
  value: number;
}

const DIVIDER = "rgba(255,255,255,0.06)";

function StatItem({ stat, inView }: { stat: Stat; inView: boolean }) {
  const count = useCountUp(stat.value, 2000, inView);

  return (
    <Box sx={{ textAlign: "center" }}>
      <Box component="span" sx={{ fontSize: 56, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>
        {count}+
      </Box>
      <Box sx={{ mt: "8px", fontSize: 14, color: colors.textSecondary }}>{stat.label}</Box>
    </Box>
  );
}

export default function StatsGrid({ stats }: { stats: Stat[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <Box
      ref={ref}
      component="section"
      id="stats"
      sx={{
        borderTop: `1px solid ${DIVIDER}`,
        borderBottom: `1px solid ${DIVIDER}`,
        padding: { xs: "80px 20px", md: "80px 48px" },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-around",
        alignItems: "center",
        gap: { xs: "40px", md: 0 },
      }}
    >
      {stats.map((stat, i) => (
        <Fragment key={stat.id}>
          <StatItem stat={stat} inView={inView} />
          {i < stats.length - 1 && (
            <Box
              sx={{
                backgroundColor: DIVIDER,
                width: { xs: "48px", md: "1px" },
                height: { xs: "1px", md: "48px" },
              }}
            />
          )}
        </Fragment>
      ))}
    </Box>
  );
}
