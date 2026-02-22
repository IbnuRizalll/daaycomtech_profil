export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "image"; url: string; caption?: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }

const safeParse = (value: string) => {
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

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
          : typeof item?.headers === "string"
            ? item.headers
                .split("|")
                .map((value: string) => value.trim())
                .filter(Boolean)
            : []
        const rows = Array.isArray(item?.rows)
          ? item.rows
              .map((row: any) =>
                Array.isArray(row)
                  ? row.map((cell: any) => String(cell || "").trim())
                  : []
              )
              .filter((row: string[]) => row.some((cell) => cell.trim()))
          : typeof item?.rows === "string"
            ? item.rows
                .split("\n")
                .map((row: string) =>
                  row
                    .split("|")
                    .map((cell) => cell.trim())
                    .filter(Boolean)
                )
                .filter((row: string[]) => row.length > 0)
            : []
        return headers.length || rows.length ? { type: "table" as const, headers, rows } : null
      }
      return null
    })
    .filter(Boolean) as ContentBlock[]
}
