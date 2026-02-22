"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ProductCard } from "@/components/sections/product-card"
import { ProductFilters } from "./product-filters"
import { Reveal } from "@/components/motion/reveal"

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  imageUrl: string
  category: string
}

interface ProductsClientProps {
  initialProducts: Product[]
  categories: string[]
  initialSearch: string
  initialCategory: string
}

const buildSearchTerms = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)

export function ProductsClient({
  initialProducts,
  categories,
  initialSearch,
  initialCategory,
}: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState(initialCategory || "all")
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch.trim())
  const [isFetching, setIsFetching] = useState(false)

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.localeCompare(b, "id", { sensitivity: "base" })),
    [categories]
  )

  const searchTerms = useMemo(() => buildSearchTerms(debouncedSearch), [debouncedSearch])

  const didInit = useRef(false)
  const lastParams = useRef({ search: debouncedSearch, category })
  const fetchController = useRef<AbortController | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)

    return () => clearTimeout(handler)
  }, [search])

  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true
      return
    }

    const nextSearch = debouncedSearch
    const nextCategory = category || "all"

    if (
      lastParams.current.search === nextSearch &&
      lastParams.current.category === nextCategory
    ) {
      return
    }

    lastParams.current = { search: nextSearch, category: nextCategory }
    const params = new URLSearchParams()
    if (nextSearch) params.set("search", nextSearch)
    if (nextCategory && nextCategory !== "all") params.set("category", nextCategory)

    if (typeof window !== "undefined") {
      const query = params.toString()
      const url = query ? `/products?${query}` : "/products"
      window.history.replaceState(null, "", url)
    }

    const fetchProducts = async () => {
      fetchController.current?.abort()
      const controller = new AbortController()
      fetchController.current = controller
      requestId.current += 1
      const currentRequest = requestId.current
      params.set("view", "card")

      setIsFetching(true)
      try {
        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error("Failed to fetch products")
        const data = await response.json()
        if (currentRequest === requestId.current) {
          setProducts(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Error fetching products:", error)
      } finally {
        if (currentRequest === requestId.current) {
          setIsFetching(false)
        }
      }
    }

    fetchProducts()
  }, [debouncedSearch, category])

  const handleClear = () => {
    setSearch("")
    setCategory("all")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-black via-red-900 to-red-700 text-white py-16 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-12 right-10 h-36 w-36 rounded-full bg-red-500/30 blur-2xl float-slow" />
        <div className="site-container">
          <Reveal>
            <h1 className="text-4xl font-bold mb-4">Katalog Produk</h1>
            <p className="text-white/80 text-lg">
              Temukan produk teknologi terbaik untuk kebutuhan bisnis Anda
            </p>
          </Reveal>
        </div>
      </div>

      <section className="py-12 bg-white border-t border-black/5">
        <div className="site-container">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <Reveal>
              <ProductFilters
                categories={sortedCategories}
                search={search}
                category={category}
                isPending={isFetching}
                onSearchChange={setSearch}
                onCategoryChange={setCategory}
                onClear={handleClear}
              />
            </Reveal>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <Reveal className="mb-6 text-sm text-gray-600">
              Menampilkan {products.length} produk
            </Reveal>

            <div
              className={`transition-opacity duration-300 ${
                isFetching ? "opacity-70" : "opacity-100"
              }`}
            >
              {products.length > 0 ? (
                <Reveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6" delayMs={100}>
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className="product-appear"
                      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
                    >
                      <ProductCard {...product} highlightTerms={searchTerms} />
                    </div>
                  ))}
                </Reveal>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg mb-2">Tidak ada produk ditemukan</p>
                  <p className="text-gray-500 text-sm">Coba ubah filter atau kata kunci pencarian</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </section>
    </div>
  )
}
