import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui";

export const metadata: Metadata = {
  title: "PingNote - Partilha de Notas Instantâneas",
  description: "Partilha notas instantâneas entre dispositivos de forma rápida, simples e segura. Suporte para QR codes, códigos curtos e encriptação E2EE.",
  keywords: ["notas", "partilha", "qr code", "encriptação", "privacidade"],
  robots: "noindex, nofollow",
  openGraph: {
    title: "PingNote",
    description: "Partilha notas instantâneas entre dispositivos",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0f" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <div className="nebula-bg">
          <div className="nebula-blob blob-1" />
          <div className="nebula-blob blob-2" />
          <div className="nebula-blob blob-3" />
        </div>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
