export function track(type: string, metadata?: Record<string, unknown>) {
  try {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, page: "home", metadata }),
    }).catch(() => {});
  } catch {
    // never block the UI on analytics
  }
}
