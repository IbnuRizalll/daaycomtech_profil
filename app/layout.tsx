import type { Metadata } from "next"
import "./globals.css"
import { AppShell } from "@/components/layout/app-shell"

export const metadata: Metadata = {
  title: {
    default: "DaayComTech - Solusi Teknologi Terpercaya",
    template: "%s | DaayComTech"
  },
  description: "DaayComTech menyediakan solusi teknologi terbaik untuk kebutuhan bisnis Anda. Produk berkualitas tinggi dengan layanan profesional.",
  keywords: ["teknologi", "IT solutions", "software", "hardware", "DaayComTech"],
  authors: [{ name: "DaayComTech" }],
  creator: "DaayComTech",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "DaayComTech",
    title: "DaayComTech - Solusi Teknologi Terpercaya",
    description: "DaayComTech menyediakan solusi teknologi terbaik untuk kebutuhan bisnis Anda.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DaayComTech - Solusi Teknologi Terpercaya",
    description: "DaayComTech menyediakan solusi teknologi terbaik untuk kebutuhan bisnis Anda.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
