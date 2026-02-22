"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

interface ProductCardProps {
  id: string
  name: string
  slug: string
  description: string
  price: number
  imageUrl: string
  category: string
  highlightTerms?: string[]
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const highlightText = (text: string, terms?: string[]) => {
  if (!terms || terms.length === 0) return text
  const filtered = terms.map((term) => term.trim()).filter(Boolean)
  if (filtered.length === 0) return text
  const pattern = new RegExp(`(${filtered.map(escapeRegExp).join("|")})`, "gi")
  const parts = text.split(pattern)
  const termSet = new Set(filtered.map((term) => term.toLowerCase()))
  return parts.map((part, index) =>
    termSet.has(part.toLowerCase()) ? (
      <mark key={index} className="rounded bg-red-100 px-1 text-red-900">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  )
}

export function ProductCard({ name, slug, description, price, imageUrl, category, highlightTerms }: ProductCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative h-56 sm:h-64 overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4">
          <span className="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {category}
          </span>
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
          {highlightText(name, highlightTerms)}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {highlightText(description, highlightTerms)}
        </p>
        <p className="text-2xl font-bold text-red-600">{formatPrice(price)}</p>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Button
          asChild
          variant="outline"
          className="w-full border-black/15 text-black hover:bg-black/5 transition-colors"
        >
          <Link href={`/products/${slug}`} className="flex items-center justify-center gap-2">
            Lihat Detail
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
