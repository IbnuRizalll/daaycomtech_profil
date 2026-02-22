import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Reveal } from "@/components/motion/reveal"
import { ContentBlocks } from "@/components/sections/content-blocks"
import { normalizeContentBlocks } from "@/lib/content-blocks"

export const revalidate = 3600

export default async function AchievementDetailPage({ params }: { params: { id: string } }) {
  const achievement = await prisma.achievement.findUnique({
    where: { id: params.id },
  })

  if (!achievement) {
    notFound()
  }

  const contentBlocks = normalizeContentBlocks((achievement as any)?.contentBlocks)

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gray-50 py-10">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Reveal>
            <Link href="/about" className="text-sm text-red-600 hover:text-red-800">
              &larr; Kembali ke Tentang Kami
            </Link>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-3">
                Achievement {achievement.year}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{achievement.title}</h1>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {achievement.imageUrl && (
            <Reveal className="mb-8">
              <div className="relative w-full aspect-[16/9] rounded-lg bg-gray-50 overflow-hidden">
                <Image
                  src={achievement.imageUrl}
                  alt={achievement.title}
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
              <p className="text-lg text-gray-700">{achievement.description}</p>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  )
}
