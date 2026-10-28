import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { GlobalFeedbackToast } from "./global-feedback-toast";
import { ScrollRestoration } from "./scroll-restoration";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { WhatsAppFloatingButton } from "./whatsapp-floating-button";
import { canAccessAdministration, getAuthenticatedUser } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clube Quinze Veranistas",
  description: "Sistema de gestão do futebol do Clube Quinze Veranistas.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let isLoggedIn = false;
  let accountHref: string | null = null;
  let accountLabel = "";
  try {
    const user = await getAuthenticatedUser();
    isLoggedIn = Boolean(user);
    if (user) {
      accountHref = canAccessAdministration(user) ? "/acesso" : "/minha-conta";
      accountLabel = canAccessAdministration(user) ? "Área administrativa" : "Minha conta";
    }
  } catch {
    // The public site must remain available if the authentication database is down.
  }

  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full overflow-x-hidden flex flex-col">
        <Suspense fallback={null}>
          <ScrollRestoration />
        </Suspense>
        <Suspense fallback={null}>
          <GlobalFeedbackToast />
        </Suspense>
        <WhatsAppFloatingButton />
        <SiteHeader isLoggedIn={isLoggedIn} accountHref={accountHref} accountLabel={accountLabel} />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
