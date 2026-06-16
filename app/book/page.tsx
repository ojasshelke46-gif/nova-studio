import { Box } from "@mui/material";
import IntakeFlow from "@/components/IntakeFlow";

export const metadata = {
  title: "Book a Call — Nova Studio",
  description: "Tell us about your project and pick a time to talk.",
};

export default function BookPage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        pt: { xs: "100px", md: "120px" },
        pb: { xs: "80px", md: "120px" },
        px: { xs: "20px", md: "48px" },
      }}
    >
      <IntakeFlow />
    </Box>
  );
}
