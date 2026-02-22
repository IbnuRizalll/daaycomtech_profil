import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const revalidate = 1800

export async function GET() {
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
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json([])
  }
}
