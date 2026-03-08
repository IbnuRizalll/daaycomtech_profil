import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { NextResponse, NextRequest } from "next/server"
import { productSchema } from "@/lib/validation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const normalizeSections = (value: unknown) => {
  if (!value) return []
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value)
          } catch {
            return []
          }
        })()
      : []

  if (!Array.isArray(source)) return []

  return source
    .map((section: any) => {
      const title = String(section?.title || "").trim()
      const blocksValue = Array.isArray(section?.blocks)
        ? section.blocks
        : Array.isArray(section?.contentBlocks)
          ? section.contentBlocks
          : typeof section?.content === "string" && section.content.trim()
            ? [{ type: "paragraph", text: String(section.content).trim() }]
            : []
      const blocks = normalizeBlocks(blocksValue)
      if (!title || blocks.length === 0) return null
      return { title, blocks }
    })
    .filter(Boolean)
}

const parsePipeList = (value: string) =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const parseTableRows = (value: string) =>
  value
    .split("\n")
    .map((row) => parsePipeList(row))
    .filter((row) => row.length > 0)

const safeParse = (value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

const normalizeBlocks = (value: unknown) => {
  if (!value) return []
  const source = Array.isArray(value) ? value : typeof value === "string" ? safeParse(value) : []
  if (!Array.isArray(source)) return []

  return source
    .map((item) => {
      if (item?.type === "paragraph") {
        const text = String(item?.text || "").trim()
        return text ? { type: "paragraph", text } : null
      }
      if (item?.type === "image") {
        const url = String(item?.url || "").trim()
        if (!url) return null
        const caption = String(item?.caption || "").trim()
        return caption ? { type: "image", url, caption } : { type: "image", url }
      }
      if (item?.type === "list") {
        const items = Array.isArray(item?.items)
          ? item.items.map((value: any) => String(value || "").trim()).filter(Boolean)
          : []
        return items.length ? { type: "list", items } : null
      }
      if (item?.type === "table") {
        const headersText = typeof item?.headersText === "string" ? item.headersText : ""
        const rowsText = typeof item?.rowsText === "string" ? item.rowsText : ""
        const headersFromText = headersText ? parsePipeList(headersText) : []
        const headersFromArray = Array.isArray(item?.headers)
          ? item.headers.map((value: any) => String(value || "").trim()).filter(Boolean)
          : typeof item?.headers === "string"
            ? parsePipeList(item.headers)
            : []
        const headers = headersFromText.length ? headersFromText : headersFromArray

        const rowsFromText = rowsText ? parseTableRows(rowsText) : []
        const rowsFromArray = Array.isArray(item?.rows)
          ? item.rows
              .map((row: any) =>
                Array.isArray(row)
                  ? row.map((cell: any) => String(cell || "").trim())
                  : []
              )
              .filter((row: string[]) => row.some((cell) => cell.trim()))
          : typeof item?.rows === "string"
            ? parseTableRows(item.rows)
            : []
        const rows = rowsFromText.length ? rowsFromText : rowsFromArray
        return headers.length || rows.length ? { type: "table", headers, rows } : null
      }
      return null
    })
    .filter(Boolean)
}

const toNumber = (value: unknown, fallback?: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toBoolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback

const toStringValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const publicListCacheHeaders = {
  "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
}

async function requireAdmin() {
  const session = (await getServerSession(authOptions as any)) as any
  const role = (session?.user as any)?.role
  if (!session?.user || (role !== "ADMIN" && role !== "SUPERADMIN")) {
    return null
  }
  return session
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim() || ""
    const category = searchParams.get("category") || "all"
    const view = searchParams.get("view")
    const hasPagination = searchParams.has("page") || searchParams.has("limit")
    const shouldUsePublicCache = view === "card"
    const pageRaw = toNumber(searchParams.get("page"), 1) ?? 1
    const limitDefault = view === "card" ? 24 : 50
    const limitRaw = toNumber(searchParams.get("limit"), limitDefault) ?? limitDefault
    const page = Math.max(1, Math.trunc(pageRaw))
    const limit = Math.min(100, Math.max(1, Math.trunc(limitRaw)))

    const where: any = {}

    if (search) {
      const terms = search.split(/\s+/).filter(Boolean).slice(0, 5)
      const buildVariants = (value: string) => {
        const lower = value.toLowerCase()
        const upper = value.toUpperCase()
        const title = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
        return Array.from(new Set([value, lower, upper, title])).filter(Boolean)
      }

      where.AND = terms.map((term) => ({
        OR: buildVariants(term).flatMap((variant) => [
          { name: { contains: variant } },
          { description: { contains: variant } },
          { category: { contains: variant } },
          { slug: { contains: variant } },
        ]),
      }))
    }

    if (category && category !== "all") {
      where.category = category
    }

    const query: Prisma.ProductFindManyArgs = {
      where,
      orderBy: { createdAt: "desc" },
    }

    if (view === "card") {
      query.select = {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        imageUrl: true,
        category: true,
      }
    }

    if (hasPagination) {
      const pagedQuery: Prisma.ProductFindManyArgs = {
        ...query,
        skip: (page - 1) * limit,
        take: limit,
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany(pagedQuery),
        prisma.product.count({ where }),
      ])

      return NextResponse.json({
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      }, shouldUsePublicCache ? { headers: publicListCacheHeaders } : undefined)
    }

    const products = await prisma.product.findMany(query)
    return NextResponse.json(products, shouldUsePublicCache ? { headers: publicListCacheHeaders } : undefined)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const payload = parsed.data
    const images = Array.isArray(payload.images)
      ? JSON.stringify(payload.images)
      : typeof payload.images === "string"
        ? payload.images
        : "[]"

    const cleanedSections = normalizeSections(payload.sections)
    const data: Prisma.ProductCreateInput = {
      name: payload.name,
      slug: payload.slug,
      description: payload.description,
      price: payload.price,
      imageUrl: payload.imageUrl,
      images,
      category: payload.category,
      featured: payload.featured ?? false,
      inStock: payload.inStock ?? true,
      sections: cleanedSections.length
        ? (cleanedSections as Prisma.InputJsonValue)
        : Prisma.DbNull,
    }

    const product = await prisma.product.create({
      data,
    })
    revalidatePath("/")
    revalidatePath("/products")
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
