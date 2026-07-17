import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { Analytics } from "@vercel/analytics/next";
import { ErrorReporter } from "@/components/ErrorReporter";

// Configure base application fonts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "MyResume",
  description: "Build ATS-Friendly Resumes in Minutes",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <head>
      </head>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen flex flex-col font-sans"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <Navbar />
            <div className="flex-1 flex flex-col">
              <main className="flex-1 flex flex-col">
                {children}
              </main>
            </div>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
        <ErrorReporter />
        <Analytics />
      </body>
    </html>
  );
}
