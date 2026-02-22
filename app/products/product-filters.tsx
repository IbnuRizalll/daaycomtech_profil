"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

interface ProductFiltersProps {
  categories: string[]
  search: string
  category: string
  isPending?: boolean
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onClear: () => void
}

interface Suggestion {
  id: string
  name: string
  slug: string
  category: string
}

export function ProductFilters({
  categories,
  search,
  category,
  isPending,
  onSearchChange,
  onCategoryChange,
  onClear,
}: ProductFiltersProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)

  const highlightSuggestion = useCallback((text: string, keyword: string) => {
    const terms = keyword.trim().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return text
    const escaped = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    const pattern = new RegExp(`(${escaped.join("|")})`, "gi")
    const parts = text.split(pattern)
    const termSet = new Set(terms.map((term) => term.toLowerCase()))
    return parts.map((part, index) =>
      termSet.has(part.toLowerCase()) ? (
        <mark key={index} className="rounded bg-red-100 px-1 text-red-900">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    )
  }, [])

  const showSuggestions = useMemo(() => search.trim().length >= 2, [search])

  useEffect(() => {
    const trimmed = search.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setIsSuggesting(false)
      return
    }

    const controller = new AbortController()
    setIsSuggesting(true)
    const handler = setTimeout(async () => {
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        if (response.ok) {
          const data = await response.json()
          setSuggestions(Array.isArray(data) ? data : [])
        } else {
          setSuggestions([])
        }
      } catch {
        setSuggestions([])
      } finally {
        setIsSuggesting(false)
      }
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(handler)
    }
  }, [search])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(search.trim())
  }

  const handleCategoryChange = (nextCategory: string) => {
    onCategoryChange(nextCategory)
  }

  const clearFilters = () => {
    setSuggestions([])
    onClear()
  }

  const hasActiveFilters = search || category !== "all"

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Filter</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-sm"
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Cari Produk</label>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Search className="h-5 w-5" />
          </button>
          {showSuggestions && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-md border border-black/10 bg-white shadow-lg z-20">
              {isSuggesting && (
                <div className="px-4 py-2 text-xs text-gray-500">Mencari...</div>
              )}
              {!isSuggesting && suggestions.length === 0 && (
                <div className="px-4 py-2 text-xs text-gray-500">Tidak ada rekomendasi.</div>
              )}
              {!isSuggesting && suggestions.length > 0 && (
                <ul className="max-h-64 overflow-auto py-1">
                  {suggestions.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          onSearchChange(item.name)
                          setSuggestions([])
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50"
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          {highlightSuggestion(item.name, search)}
                        </div>
                        <div className="text-xs text-gray-500">{item.category}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-semibold mb-2">Kategori</label>
        <div className="space-y-2">
          <button
            onClick={() => handleCategoryChange("all")}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              category === "all"
                ? "bg-red-100 text-red-900 font-semibold"
                : "hover:bg-gray-100"
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => handleCategoryChange(item)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                category === item
                  ? "bg-red-100 text-red-900 font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {isPending && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Memuat...
        </div>
      )}
    </div>
  )
}
