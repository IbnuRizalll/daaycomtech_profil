import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { ProductsClient } from "./products-client"

export const metadata: Metadata = {
  title: "Katalog Produk",
  description: "Jelajahi katalog produk teknologi terlengkap dari DaayComTech. Temukan solusi yang tepat untuk kebutuhan bisnis Anda.",
}

export const revalidate = 1800 // Revalidate every 30 minutes

async function getProducts(searchParams: { search?: string; category?: string }) {
  try {
    const { search, category } = searchParams
    
    const where: any = {}

    const normalizedSearch = search?.trim()
    if (normalizedSearch) {
      const terms = normalizedSearch.split(/\s+/).filter(Boolean).slice(0, 5)
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
    
    if (category && category !== 'all') {
      where.category = category
    }
    
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        imageUrl: true,
        category: true,
      },
    })
    
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

async function getCategories() {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: "asc" },
    })

    return categories
      .map(c => c.category)
      .sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" }))
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

interface PageProps {
  searchParams: {
    search?: string
    category?: string
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const [products, categories] = await Promise.all([
    getProducts(searchParams),
    getCategories()
  ])

  return (
    <ProductsClient
      initialProducts={products}
      categories={categories}
      initialSearch={searchParams.search || ""}
      initialCategory={searchParams.category || "all"}
    />
  )
}
