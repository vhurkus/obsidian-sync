import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { RealtimeProvider } from "@/components/providers/realtime-provider";
import { ServiceWorkerProvider } from "@/components/providers/service-worker-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ObsidianSync - Free Multi-Device Notes App",
  description: "A free Obsidian-like markdown note-taking app with multi-device synchronization",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ObsidianSync",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="light">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-tap-highlight" content="no" />
        {/* Preload script to reduce theme flashing */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Only run on client side to avoid hydration mismatches
                  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                    var storedSettings = localStorage.getItem('settings-store');
                    var parsedSettings = storedSettings ? JSON.parse(storedSettings) : null;
                    var storedTheme = parsedSettings && parsedSettings.state ? parsedSettings.state.theme : null;
                    
                    // Important: Only change the class if it's different from the server-rendered one
                    if (storedTheme && storedTheme !== 'light') {
                      document.documentElement.classList.remove('light', 'dark');
                      document.documentElement.classList.add(storedTheme);
                    }
                  }
                } catch (e) {
                  console.error('Error in theme preload script:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerProvider>
          <ThemeProvider>
            <AuthProvider>
              <RealtimeProvider>
                {children}
              </RealtimeProvider>
            </AuthProvider>
          </ThemeProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
