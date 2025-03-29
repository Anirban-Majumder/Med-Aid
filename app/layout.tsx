import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { CopilotKit } from "@copilotkit/react-core";
import { SessionProvider } from "@/providers/session";
import { QueryProvider } from "@/providers/query";
import { ToasterProvider } from "@/providers/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Pharma AI",
  description: "World's first AI-powered Pharmacy",
  appleWebApp: {
    title: "Pharma-AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  


  return (
    <html suppressHydrationWarning={true} lang='en'>
      <meta name="apple-mobile-web-app-title" content="Pharma-AI" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} background text-foreground h-full flex flex-col justify-between antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem>
          <SessionProvider>
          <CopilotKit
            forwardedParameters={{ temperature: 0.2 }}
            showDevConsole={false}
            runtimeUrl="/api/copilotkit">
              {children}
              <ToasterProvider/>
          </CopilotKit>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
