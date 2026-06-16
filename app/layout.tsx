import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeRegistry from "@/components/ThemeRegistry";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
  title: "Nova Studio — Digital Agency",
  description: "Design and engineering studio building websites, brands, and digital products.",
  openGraph: {
    title: "Nova Studio — Digital Agency",
    description: "Design and engineering studio building websites, brands, and digital products.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
