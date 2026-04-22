import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../styles/tailwind.css";
import "../styles/theme.scss";

import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { SWRegistration } from "@/components/providers/SWRegistration";
import AIChatbox from "@/components/client/AIChatbox";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "InvestPro | AI-Powered Investment Crowdfunding Platform",
  description:
    "InvestPro (SmartVest AI) - The leading crowdfunding platform in Vietnam. Leverage Google Gemini AI to analyze investment risks, track project funding, and manage your portfolio with transparency and data-driven insights.",
  keywords: [
    "InvestPro",
    "SmartVest AI",
    "Investment Platform",
    "Crowdfunding Vietnam",
    "AI Financial Analysis",
    "AI Investment Assistant",
    "Gemini AI Financial Insights",
    "Project Risk Assessment",
    "Automated Due Diligence",
    "Real-time Funding Tracker",
    "Investment Portfolio Management",
    "Next.js Investment App",
    "NestJS Fintech Backend",
    "Blockchain Transparency",
    "Secure Payment Disbursement",
    "Crowdfunding for Startups",
    "Safe Investing for Beginners",
    "AI-Driven Venture Capital",
    "Startup Funding Portal",
  ].join(", "),
  authors: [{ name: "Huynh Viet Loi", url: "https://investpro.site/" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "InvestPro",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#002B5B",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head />

      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <QueryProvider>
              <NotificationProvider>
                <SWRegistration />
                {children}
                <AIChatbox />
                <Toaster position="top-right" richColors closeButton />
              </NotificationProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
