import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Reveal } from "@/components/motion/reveal"
import { ContentBlocks } from "@/components/sections/content-blocks"
import { normalizeContentBlocks } from "@/lib/content-blocks"

export const revalidate = 3600

const formatDate = (value: Date) => {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(value)
}

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
  })

  if (!article) {
    notFound()
  }

  const contentBlocks = normalizeContentBlocks((article as any)?.contentBlocks)

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gray-50 py-10">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Reveal>
            <Link href="/about" className="text-sm text-red-600 hover:text-red-800">
              &larr; Kembali ke Tentang Kami
            </Link>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-3">{article.category}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{article.title}</h1>
              <p className="mt-2 text-sm text-gray-500">
                {formatDate(article.publishedAt ?? article.createdAt)}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {article.imageUrl && (
            <Reveal className="mb-8">
              <div className="relative w-full aspect-[16/9] rounded-lg bg-gray-50 overflow-hidden">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-contain p-2"
                />
              </div>
            </Reveal>
          )}
          <Reveal className="prose prose-lg max-w-none text-gray-700">
            {contentBlocks.length > 0 ? (
              <ContentBlocks blocks={contentBlocks} />
            ) : (
              <>
                <p className="text-lg text-gray-700">{article.excerpt}</p>
                {article.content && (
                  <div className="mt-6 space-y-4">
                    {article.content.split("\n").map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  )
}
