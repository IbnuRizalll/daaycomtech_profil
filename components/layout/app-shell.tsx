"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  return (
    <>
      {!isAdmin && <Navbar />}
      <main className={isAdmin ? "min-h-screen" : "pt-16 min-h-screen"}>
        {children}
      </main>
      {!isAdmin && <Footer />}
    </>
  )
}
