import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/theme.scss";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import AIChatbox from "@/components/client/AIChatbox";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "InvestPro | AI-Powered Investment Crowdfunding Platform",
  description:
    "InvestPro (SmartVest AI) - The leading crowdfunding platform in Vietnam. Leverage Google Gemini AI to analyze investment risks, track project funding, and manage your portfolio with transparency and data-driven insights.",
  keywords: [
    // --- Brand & Core Identity ---
    "InvestPro",
    "SmartVest AI",
    "Investment Platform",
    "Crowdfunding Vietnam",
    "AI Financial Analysis",

    // --- Features & AI Capabilities (Key for your Graduation Project) ---
    "AI Investment Assistant",
    "Gemini AI Financial Insights",
    "Project Risk Assessment",
    "Automated Due Diligence",
    "Real-time Funding Tracker",
    "Investment Portfolio Management",

    // --- Technologies ---
    "Next.js Investment App",
    "NestJS Fintech Backend",
    "Blockchain Transparency", // Nếu bạn có kế hoạch dùng Blockchain
    "Secure Payment Disbursement",

    // --- Target Audience & Niche ---
    "Crowdfunding for Startups",
    "Safe Investing for Beginners",
    "AI-Driven Venture Capital",
    "Startup Funding Portal",
  ].join(", "),
  authors: [{ name: "Huynh Viet Loi", url: "https://investpro.site/" }],
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            <NotificationProvider>
              {children}
              <AIChatbox />
              <Toaster position="top-right" richColors closeButton />
            </NotificationProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
