"use client"

import { useMemo, useState } from "react"
import { ContentBlocks, normalizeContentBlocks, type ContentBlock } from "@/components/sections/content-blocks"

export interface ProductSection {
  title: string
  blocks?: ContentBlock[]
  content?: string
}

interface ProductSectionsProps {
  sections: ProductSection[]
}

const normalizeSections = (sections: ProductSection[]) =>
  sections
    .map((section) => {
      const title = section.title?.trim() || ""
      let blocks: ContentBlock[] = []

      if (Array.isArray(section.blocks)) {
        blocks = normalizeContentBlocks(section.blocks)
      } else if (Array.isArray((section as any)?.contentBlocks)) {
        blocks = normalizeContentBlocks((section as any).contentBlocks)
      } else if (typeof section.content === "string" && section.content.trim()) {
        blocks = [{ type: "paragraph", text: section.content.trim() }]
      }

      return { title, blocks }
    })
    .filter((section) => section.title && section.blocks.length > 0)

export function ProductSections({ sections }: ProductSectionsProps) {
  const cleaned = useMemo(() => normalizeSections(sections), [sections])

  const [activeIndex, setActiveIndex] = useState(0)

  if (cleaned.length === 0) {
    return null
  }

  const active = cleaned[Math.min(activeIndex, cleaned.length - 1)]

  return (
    <section className="mt-12 bg-white rounded-lg shadow-sm p-6 sm:p-8 border border-black/5">
      <div className="section-accent mb-4" />
      <h2 className="text-2xl font-bold mb-6">Informasi Tambahan</h2>

      <div className="hidden md:block">
        <div className="flex flex-wrap gap-2 mb-6">
          {cleaned.map((section, index) => (
            <button
              key={`${section.title}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                index === activeIndex
                  ? "bg-red-600 text-white shadow"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{active.title}</h3>
          <ContentBlocks blocks={active.blocks} />
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {cleaned.map((section, index) => (
          <details
            key={`${section.title}-mobile-${index}`}
            className="rounded-lg border border-gray-200 bg-white p-4"
            open={index === 0}
          >
            <summary className="cursor-pointer font-semibold text-gray-900">
              {section.title}
            </summary>
            <div className="mt-3 text-sm text-gray-600">
              <ContentBlocks blocks={section.blocks} />
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
