import { Box, Container, Skeleton } from "@mui/material";

export function ServicesSkeleton() {
  return (
    <Box component="section" sx={{ py: 12 }}>
      <Container maxWidth="lg">
        <Skeleton variant="text" width={200} height={60} sx={{ mx: "auto", mb: 8 }} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 4,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ p: 4, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2 }}>
              <Skeleton variant="rounded" width={56} height={56} sx={{ mb: 3 }} />
              <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1.5 }} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="80%" />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export function PortfolioSkeleton() {
  return (
    <Box component="section" sx={{ py: 12 }}>
      <Container maxWidth="lg">
        <Skeleton variant="text" width={200} height={60} sx={{ mx: "auto", mb: 8 }} />
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" width={90} height={36} />
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 4,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box key={i}>
              <Skeleton variant="rectangular" sx={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 1 }} />
              <Skeleton variant="text" width="70%" height={32} sx={{ mt: 2 }} />
              <Skeleton variant="rounded" width={80} height={24} sx={{ mt: 1 }} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

export function StatsSkeleton() {
  return (
    <Box component="section" sx={{ py: 12, backgroundColor: "rgba(124, 92, 252, 0.08)" }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 4,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ textAlign: "center" }}>
              <Skeleton variant="text" width={120} height={64} sx={{ mx: "auto" }} />
              <Skeleton variant="text" width={160} height={28} sx={{ mx: "auto", mt: 1 }} />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
