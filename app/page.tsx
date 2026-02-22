import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/sections/product-card"
import { ClientSection } from "@/components/sections/client-section"
import { ArrowRight, Shield, Zap, Users } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Reveal } from "@/components/motion/reveal"

export const revalidate = 3600 // Revalidate every hour

async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { featured: true },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        imageUrl: true,
        category: true,
      },
    })
    return products
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

async function getClients() {
  try {
    const clients = await prisma.client.findMany({
      where: { isShow: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    })
    return clients
  } catch (error) {
    console.error('Error fetching clients:', error)
    return []
  }
}

const features = [
  {
    icon: Shield,
    title: "Produk Berkualitas",
    description: "Semua produk kami telah melalui quality control ketat untuk memastikan performa terbaik."
  },
  {
    icon: Zap,
    title: "Layanan Cepat",
    description: "Tim support kami siap membantu Anda 24/7 dengan respon time yang sangat cepat."
  },
  {
    icon: Users,
    title: "Dipercaya Ribuan Klien",
    description: "Lebih dari 1000+ perusahaan telah mempercayai solusi teknologi dari DaayComTech."
  }
]

const fallbackNewsHighlights = [
  {
    id: "",
    title: "DaayComTech Perkuat Layanan Monitoring 24/7",
    meta: "Berita • Jan 2025",
    excerpt: "Peningkatan sistem monitoring untuk menjaga kestabilan operasional klien.",
    imageUrl: "",
  },
  {
    id: "",
    title: "Panduan Optimasi Infrastruktur IT untuk Bisnis Tumbuh",
    meta: "Artikel • Nov 2024",
    excerpt: "Langkah praktis mengurangi downtime dan meningkatkan efisiensi biaya IT.",
    imageUrl: "",
  },
  {
    id: "",
    title: "Studi Kasus Implementasi Keamanan Jaringan",
    meta: "Studi Kasus • Aug 2024",
    excerpt: "Penerapan zero trust yang membantu klien memperkuat keamanan data.",
    imageUrl: "",
  },
  {
    id: "",
    title: "Kolaborasi Modernisasi Data Center Regional",
    meta: "Berita • May 2024",
    excerpt: "Kolaborasi dengan mitra lokal untuk memperluas kapasitas layanan.",
    imageUrl: "",
  },
]

const fallbackAchievementHighlights = [
  {
    id: "",
    title: "Top Partner Teknologi 2024",
    meta: "Penghargaan",
    excerpt: "Pengakuan atas kualitas layanan dan kepuasan pelanggan.",
    imageUrl: "",
  },
  {
    id: "",
    title: "1000+ Implementasi Berhasil",
    meta: "Pencapaian",
    excerpt: "Rangkaian proyek selesai tepat waktu dan sesuai kebutuhan.",
    imageUrl: "",
  },
  {
    id: "",
    title: "Sertifikasi Keamanan Informasi",
    meta: "Standar",
    excerpt: "Proses kerja mengikuti praktik terbaik keamanan data.",
    imageUrl: "",
  },
  {
    id: "",
    title: "Kepuasan Klien 4.9/5",
    meta: "Testimoni",
    excerpt: "Skor kepuasan tinggi dari berbagai sektor industri.",
    imageUrl: "",
  },
]

const formatMonthYear = (value: Date) => {
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(value)
}

async function getHighlightArticles() {
  try {
    return await prisma.article.findMany({
      where: { isHighlight: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 4,
      select: {
        id: true,
        title: true,
        category: true,
        excerpt: true,
        imageUrl: true,
        publishedAt: true,
        createdAt: true,
      },
    })
  } catch (error) {
    console.error("Error fetching article highlights:", error)
    return []
  }
}

async function getHighlightAchievements() {
  try {
    return await prisma.achievement.findMany({
      where: { isHighlight: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 4,
      select: {
        id: true,
        title: true,
        year: true,
        description: true,
        imageUrl: true,
      },
    })
  } catch (error) {
    console.error("Error fetching achievement highlights:", error)
    return []
  }
}

export default async function HomePage() {
  const [featuredProducts, clients, articleHighlights, achievementHighlightsRaw] = await Promise.all([
    getFeaturedProducts(),
    getClients(),
    getHighlightArticles(),
    getHighlightAchievements(),
  ])

  const newsHighlights = articleHighlights.length
    ? articleHighlights.map((item) => ({
      id: item.id,
      title: item.title,
      meta: `${item.category} • ${formatMonthYear(item.publishedAt ?? item.createdAt)}`,
      excerpt: item.excerpt,
      imageUrl: item.imageUrl ?? "",
    }))
    : fallbackNewsHighlights

  const achievementHighlights = achievementHighlightsRaw.length
    ? achievementHighlightsRaw.map((item) => ({
      id: item.id,
      title: item.title,
      meta: item.year || "Achievement",
      excerpt: item.description,
      imageUrl: item.imageUrl ?? "",
    }))
    : fallbackAchievementHighlights

  const newsDuration = Math.max(newsHighlights.length, 1) * 5
  const achievementDuration = Math.max(achievementHighlights.length, 1) * 5

  return (
    <div>
      {/* Hero Section */}
      <section className="relative text-white overflow-hidden">
        <Image
          src="/images/backgound.jpeg"
          alt="Background DaayComTech"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/60 to-red-900/30" />
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-red-500/30 blur-3xl float-slow" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl float-slower" />
        <div className="relative site-container py-24 sm:py-32">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
              Solusi Teknologi untuk
              <span className="block bg-gradient-to-r from-red-200 via-white to-blue-200 bg-clip-text text-transparent">
                Masa Depan Bisnis Anda
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/80">
              DaayComTech menyediakan produk dan layanan teknologi terbaik untuk membantu bisnis Anda berkembang di era digital.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg" className="bg-red-600 text-white hover:bg-red-700 shadow">
                <Link href="/products" className="flex items-center gap-2">
                  Lihat Produk
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="border border-white/60 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/about">Tentang Kami</Link>
              </Button>
            </div>
          </Reveal>
        </div>

      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white border-t border-black/5">
        <div className="site-container">
          <Reveal className="text-center mb-12">
            <div className="section-accent mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-3">
              Produk Unggulan
            </h2>
            <p className="text-gray-600">
              Pilihan terbaik dari katalog produk kami
            </p>
          </Reveal>

          {featuredProducts.length > 0 ? (
            <>
              <Reveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" delayMs={100}>
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </Reveal>
              <div className="text-center mt-12">
                <Button
                  asChild
                  size="lg"
                  className="border border-gray-300 text-gray-900 hover:bg-gray-100 hover:text-gray-900"
                  variant="outline"
                >
                  <Link href="/products" className="flex items-center gap-2">
                    Lihat Semua Produk
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Produk unggulan akan segera hadir.</p>
              <Button asChild className="mt-4">
                <Link href="/products">Lihat Katalog Produk</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 border-y border-black/10">
        <div className="site-container">
          <Reveal className="text-center mb-12 text-white">
            <div className="section-accent mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-3">
              Highlight Berita & Achievement
            </h2>
            <p className="text-white/70">
              Pembaruan terbaru dan pencapaian terbaik DaayComTech dalam satu tampilan.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Reveal className="bg-white/95 rounded-xl border border-white/10 shadow-lg p-6" delayMs={100}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Berita & Artikel</h3>
                <span className="text-xs text-red-600 font-semibold uppercase tracking-wide">Highlight</span>
              </div>
              <div className="relative h-64 overflow-hidden">
                {newsHighlights.map((item, index) => {
                  const card = (
                    <div className="h-full flex flex-col rounded-lg border border-black/5 bg-white p-5 shadow-sm">
                      {item.imageUrl && (
                        <div className="mb-4">
                          <div className="relative w-full aspect-[16/9] rounded bg-gray-50 overflow-hidden">
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">{item.meta}</p>
                        <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{item.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{item.excerpt}</p>
                      </div>
                    </div>
                  )

                  return (
                    <div
                      key={index}
                      className="absolute inset-0 highlight-cycle opacity-0"
                      style={{
                        animationDelay: `${index * 4}s`,
                        animationDuration: `${newsDuration}s`,
                      }}
                    >
                      {item.id ? (
                        <Link href={`/articles/${item.id}`} className="block h-full">
                          {card}
                        </Link>
                      ) : (
                        card
                      )}
                    </div>
                  )
                })}
              </div>
            </Reveal>

            <Reveal className="bg-white/95 rounded-xl border border-white/10 shadow-lg p-6" delayMs={200}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Achievement</h3>
                <span className="text-xs text-red-600 font-semibold uppercase tracking-wide">Highlight</span>
              </div>
              <div className="relative h-64 overflow-hidden">
                {achievementHighlights.map((item, index) => {
                  const card = (
                    <div className="h-full flex flex-col rounded-lg border border-black/5 bg-white p-5 shadow-sm">
                      {item.imageUrl && (
                        <div className="mb-4">
                          <div className="relative w-full aspect-[16/9] rounded bg-gray-50 overflow-hidden">
                            <Image
                              src={item.imageUrl}
                              alt={item.title}
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">{item.meta}</p>
                        <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{item.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">{item.excerpt}</p>
                      </div>
                    </div>
                  )

                  return (
                    <div
                      key={index}
                      className="absolute inset-0 highlight-cycle opacity-0"
                      style={{
                        animationDelay: `${index * 4}s`,
                        animationDuration: `${achievementDuration}s`,
                      }}
                    >
                      {item.id ? (
                        <Link href={`/achievements/${item.id}`} className="block h-full">
                          {card}
                        </Link>
                      ) : (
                        card
                      )}
                    </div>
                  )
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Client Section */}
      {clients.length > 0 && (
        <Reveal>
          <ClientSection clients={clients} />
        </Reveal>
      )}

      {/* CTA Section */}
      <section className="bg-black text-white py-16 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 right-10 h-44 w-44 rounded-full bg-red-500/20 blur-2xl float-slower" />
        <div className="site-container text-center">
          <Reveal>
            <h2 className="text-3xl font-bold mb-4">
              Siap Memulai?
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Hubungi tim kami untuk konsultasi gratis dan temukan solusi teknologi yang tepat untuk bisnis Anda.
            </p>
            <Button asChild size="lg" className="bg-red-600 text-white hover:bg-red-700">
              <Link href="/contact">Hubungi Kami Sekarang</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
