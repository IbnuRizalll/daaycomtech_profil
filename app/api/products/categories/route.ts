import { prisma } from "@/lib/prisma"
import { unstable_noStore as noStore } from "next/cache"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  noStore()

  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    })

    const map = new Map<string, string>()
    for (const item of categories) {
      const raw = String(item.category || "").trim()
      if (!raw) continue
      const key = raw.toLowerCase()
      if (!map.has(key)) map.set(key, raw)
    }

    const result = Array.from(map.values()).sort((a, b) =>
      a.localeCompare(b, "id", { sensitivity: "base" })
    )

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json([])
  }
}
