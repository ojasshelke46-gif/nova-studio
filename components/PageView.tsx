"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

export default function PageView() {
  useEffect(() => {
    track("page_view", { path: "/" });
  }, []);

  return null;
}
