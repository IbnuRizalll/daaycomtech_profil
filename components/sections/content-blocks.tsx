"use client"

import Image from "next/image"

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; caption?: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }

export const normalizeContentBlocks = (raw: unknown): ContentBlock[] => {
  if (!raw) return []
  const source = Array.isArray(raw) ? raw : typeof raw === "string" ? safeParse(raw) : []
  if (!Array.isArray(source)) return []

  return source
    .map((item) => {
      const type = typeof item?.type === "string" ? item.type : ""
      if (type === "paragraph") {
        const text = String(item?.text || "").trim()
        return text ? { type: "paragraph" as const, text } : null
      }
      if (type === "image") {
        const url = String(item?.url || "").trim()
        if (!url) return null
        const caption = String(item?.caption || "").trim()
        return caption ? { type: "image" as const, url, caption } : { type: "image" as const, url }
      }
      if (type === "list") {
        const items = Array.isArray(item?.items)
          ? item.items.map((value: any) => String(value || "").trim()).filter(Boolean)
          : []
        return items.length ? { type: "list" as const, items } : null
      }
      if (type === "table") {
        const headers = Array.isArray(item?.headers)
          ? item.headers.map((value: any) => String(value || "").trim()).filter(Boolean)
          : []
        const rows = Array.isArray(item?.rows)
          ? item.rows
              .map((row: any) =>
                Array.isArray(row)
                  ? row.map((cell: any) => String(cell || "").trim())
                  : []
              )
              .filter((row: string[]) => row.some((cell) => cell.trim()))
          : []
        return headers.length || rows.length ? { type: "table" as const, headers, rows } : null
      }
      return null
    })
    .filter(Boolean) as ContentBlock[]
}

const safeParse = (value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

interface ContentBlocksProps {
  blocks: ContentBlock[]
}

export function ContentBlocks({ blocks }: ContentBlocksProps) {
  const cleaned = normalizeContentBlocks(blocks)

  if (cleaned.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {cleaned.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index} className="text-gray-700 leading-relaxed text-base sm:text-lg whitespace-pre-line">
              {block.text}
            </p>
          )
        }

        if (block.type === "image") {
          return (
            <figure key={index} className="space-y-2">
              <div className="relative w-full aspect-[16/9] rounded-lg bg-gray-50 overflow-hidden">
                <Image
                  src={block.url}
                  alt={block.caption || `Gambar ${index + 1}`}
                  fill
                  className="object-contain p-2"
                />
              </div>
              {block.caption && (
                <figcaption className="text-sm text-gray-500 text-center">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          )
        }

        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5 text-gray-700">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          )
        }

        if (block.type === "table") {
          return (
            <div key={index} className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                {block.headers.length > 0 && (
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      {block.headers.map((header, headerIndex) => (
                        <th key={headerIndex} className="px-4 py-2 text-left font-semibold">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 text-gray-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
