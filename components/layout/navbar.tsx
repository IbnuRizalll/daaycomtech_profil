"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Beranda", href: "/" },
  { name: "Tentang Kami", href: "/about" },
  { name: "Kontak", href: "/contact" },
]

const CATEGORY_CACHE_TTL_MS = 30 * 60 * 1000

let categoryCache: { value: string[]; updatedAt: number } | null = null
let categoryPromise: Promise<string[]> | null = null

const normalizeCategories = (data: unknown) => {
  if (!Array.isArray(data)) return []
  const cleaned = data.map((item) => String(item || "").trim()).filter(Boolean)
  return Array.from(new Set(cleaned))
}

const isCategoryCacheFresh = () =>
  Boolean(categoryCache && Date.now() - categoryCache.updatedAt < CATEGORY_CACHE_TTL_MS)

const fetchCategoryList = async (): Promise<string[] | null> => {
  if (isCategoryCacheFresh()) {
    return categoryCache?.value ?? []
  }

  if (categoryPromise) {
    return categoryPromise
  }

  categoryPromise = (async () => {
    const response = await fetch("/api/products/categories", { cache: "no-store" })
    if (!response.ok) {
      throw new Error("Failed to fetch product categories")
    }

    const result = normalizeCategories(await response.json())
    categoryCache = { value: result, updatedAt: Date.now() }
    return result
  })()

  try {
    return await categoryPromise
  } catch {
    return categoryCache?.value ?? null
  } finally {
    categoryPromise = null
  }
}

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [productMenuOpen, setProductMenuOpen] = useState(false)
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>(() =>
    isCategoryCacheFresh() ? categoryCache?.value ?? [] : []
  )
  const [hasLoadedCategories, setHasLoadedCategories] = useState(() => isCategoryCacheFresh())
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const productMenuRef = useRef<HTMLDivElement | null>(null)
  const closeMenuTimeoutRef = useRef<number | null>(null)
  const productMenuId = "desktop-product-menu"
  const mobileProductMenuId = "mobile-product-menu"

  const ensureCategoriesLoaded = useCallback(async () => {
    if (hasLoadedCategories || isLoadingCategories) return

    setIsLoadingCategories(true)
    try {
      const nextCategories = await fetchCategoryList()
      if (!nextCategories) return
      setCategories(nextCategories)
      setHasLoadedCategories(true)
    } finally {
      setIsLoadingCategories(false)
    }
  }, [hasLoadedCategories, isLoadingCategories])

  const openProductMenu = () => {
    if (closeMenuTimeoutRef.current) {
      window.clearTimeout(closeMenuTimeoutRef.current)
      closeMenuTimeoutRef.current = null
    }
    void ensureCategoriesLoaded()
    setProductMenuOpen(true)
  }

  const closeProductMenu = () => {
    if (closeMenuTimeoutRef.current) {
      window.clearTimeout(closeMenuTimeoutRef.current)
      closeMenuTimeoutRef.current = null
    }
    setProductMenuOpen(false)
  }

  const scheduleCloseProductMenu = (delayMs = 180) => {
    if (closeMenuTimeoutRef.current) {
      window.clearTimeout(closeMenuTimeoutRef.current)
    }
    closeMenuTimeoutRef.current = window.setTimeout(() => {
      setProductMenuOpen(false)
      closeMenuTimeoutRef.current = null
    }, delayMs)
  }

  useEffect(() => {
    if (!productMenuOpen) return
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!productMenuRef.current?.contains(event.target as Node)) {
        closeProductMenu()
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProductMenu()
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown, { passive: true })
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [productMenuOpen])

  useEffect(() => {
    return () => {
      if (closeMenuTimeoutRef.current) {
        window.clearTimeout(closeMenuTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (hasLoadedCategories) return

    const prefetchTimer = window.setTimeout(() => {
      void ensureCategoriesLoaded()
    }, 1000)

    return () => {
      window.clearTimeout(prefetchTimer)
    }
  }, [ensureCategoriesLoaded, hasLoadedCategories])

  useEffect(() => {
    if (mobileMenuOpen) {
      closeProductMenu()
      return
    }
    setMobileProductsOpen(false)
  }, [mobileMenuOpen])

  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileProductsOpen(false)
    setProductMenuOpen(false)
  }, [pathname])

  const toggleMobileProducts = () => {
    setMobileProductsOpen((prev) => {
      const next = !prev
      if (next) {
        void ensureCategoriesLoaded()
      }
      return next
    })
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[120] bg-white/90 backdrop-blur-md border-b border-black/10 shadow-sm">
      <nav className="site-container flex items-center justify-between py-3 sm:py-4" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-red-600 via-red-500 to-blue-600 bg-clip-text text-transparent">
              DaayComTech
            </span>
          </Link>
        </div>
        
        <div className="flex lg:hidden">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-black/10 text-gray-900 transition-colors hover:bg-gray-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Tutup menu utama" : "Buka menu utama"}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-8">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm font-semibold leading-6 text-gray-900 transition-colors hover:bg-gray-50 hover:text-red-600"
          >
            Beranda
          </Link>
          <div
            className="relative"
            onMouseEnter={openProductMenu}
            onMouseLeave={() => scheduleCloseProductMenu()}
            onFocusCapture={openProductMenu}
            onBlurCapture={(event) => {
              if (!productMenuRef.current?.contains(event.relatedTarget as Node | null)) {
                closeProductMenu()
              }
            }}
            ref={productMenuRef}
          >
            <div className="inline-flex items-center gap-0.5 rounded-lg">
              <Link
                href="/products"
                className="inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm font-semibold leading-6 text-gray-900 transition-colors hover:bg-gray-50 hover:text-red-600"
                onMouseEnter={openProductMenu}
              >
                Produk
              </Link>
              <button
                type="button"
                aria-label="Buka kategori produk"
                aria-controls={productMenuId}
                aria-haspopup="menu"
                aria-expanded={productMenuOpen}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 hover:text-red-600"
                onClick={() => setProductMenuOpen((prev) => !prev)}
                onMouseEnter={openProductMenu}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault()
                    openProductMenu()
                  }
                }}
              >
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", productMenuOpen && "rotate-180")}
                />
              </button>
            </div>
            <div
              id={productMenuId}
              role="menu"
              className={cn(
                "absolute left-0 top-full z-[130] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-xl border border-black/10 bg-white p-2 shadow-lg transition-all duration-150 max-h-[min(70vh,24rem)]",
                productMenuOpen
                  ? "opacity-100 translate-y-0 scale-100"
                  : "pointer-events-none opacity-0 -translate-y-1 scale-95"
              )}
              onMouseEnter={openProductMenu}
              onMouseLeave={() => scheduleCloseProductMenu()}
            >
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Jelajahi Produk
              </p>
              <Link
                href="/products"
                role="menuitem"
                className="block min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                onClick={() => scheduleCloseProductMenu()}
              >
                Semua Produk
              </Link>
              {isLoadingCategories && (
                <span className="block px-3 py-2 text-xs text-gray-500">Memuat kategori...</span>
              )}
              {hasLoadedCategories && !isLoadingCategories && categories.length === 0 && (
                <span className="block px-3 py-2 text-xs text-gray-500">Kategori belum tersedia.</span>
              )}
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/products?category=${encodeURIComponent(category)}`}
                  role="menuitem"
                  className="block min-h-[44px] truncate rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => scheduleCloseProductMenu()}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
          {navigation
            .filter((item) => item.href !== "/")
            .map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="inline-flex min-h-[44px] items-center rounded-lg px-2 text-sm font-semibold leading-6 text-gray-900 transition-colors hover:bg-gray-50 hover:text-red-600"
              >
                {item.name}
              </Link>
            ))}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Button asChild className="rounded-full px-5 shadow-sm">
            <Link href="/contact">Hubungi Kami</Link>
          </Button>
        </div>
      </nav>
      
      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden border-t border-black/5 bg-white/95 transition-[max-height,opacity] duration-300 ease-out",
          mobileMenuOpen ? "max-h-[calc(100dvh-4.5rem)] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="site-container max-h-[calc(100dvh-5rem)] space-y-2 overflow-y-auto pb-4 pt-2">
          <Link
            href="/"
            className="block min-h-[44px] rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
            onClick={() => setMobileMenuOpen(false)}
          >
            Beranda
          </Link>
          <div>
            <button
              type="button"
              aria-controls={mobileProductMenuId}
              aria-haspopup="menu"
              aria-expanded={mobileProductsOpen}
              className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
              onClick={toggleMobileProducts}
            >
              <span>Produk</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", mobileProductsOpen && "rotate-180")} />
            </button>
            <div
              id={mobileProductMenuId}
              className={cn(
                "pl-3 pr-2 transition-[max-height,opacity] duration-300 ease-out",
                mobileProductsOpen ? "max-h-[50vh] opacity-100 overflow-y-auto" : "max-h-0 opacity-0 overflow-hidden"
              )}
            >
              <Link
                href="/products"
                className="block min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setMobileProductsOpen(false)
                }}
              >
                Semua Produk
              </Link>
              {isLoadingCategories && (
                <span className="block px-3 py-2 text-xs text-gray-500">Memuat kategori...</span>
              )}
              {hasLoadedCategories && !isLoadingCategories && categories.length === 0 && (
                <span className="block px-3 py-2 text-xs text-gray-500">Kategori belum tersedia.</span>
              )}
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/products?category=${encodeURIComponent(category)}`}
                  className="block min-h-[44px] truncate rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setMobileProductsOpen(false)
                  }}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
          {navigation
            .filter((item) => item.href !== "/")
            .map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block min-h-[44px] rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          <div className="pt-2">
            <Button asChild className="w-full rounded-full">
              <Link href="/contact">Hubungi Kami</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
