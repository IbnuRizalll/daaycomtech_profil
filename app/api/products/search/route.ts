import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const publicSearchCacheHeaders = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
}

const buildQuery = (value: string) => {
  const terms = value.trim().split(/\s+/).filter(Boolean).slice(0, 5)
  if (terms.length === 0) return null
  const buildVariants = (term: string) => {
    const lower = term.toLowerCase()
    const upper = term.toUpperCase()
    const title = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()
    return Array.from(new Set([term, lower, upper, title])).filter(Boolean)
  }
  return {
    AND: terms.map((term) => ({
      OR: buildVariants(term).flatMap((variant) => [
        { name: { contains: variant } },
        { slug: { contains: variant } },
        { category: { contains: variant } },
      ]),
    })),
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || ''
  const where = buildQuery(q)

  if (!where) {
    return NextResponse.json([], { headers: publicSearchCacheHeaders })
  }

  try {
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
      },
    })
    return NextResponse.json(products, { headers: publicSearchCacheHeaders })
  } catch (error) {
    console.error('Error searching products:', error)
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 })
  }
}
