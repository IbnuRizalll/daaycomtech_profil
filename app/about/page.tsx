import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Award, Target, Eye, Users, FileText, Trophy, Medal } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Reveal } from "@/components/motion/reveal"

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Pelajari lebih lanjut tentang DaayComTech, visi, misi, dan nilai-nilai perusahaan kami dalam menyediakan solusi teknologi terbaik.",
}

export const revalidate = 3600

const values = [
  {
    icon: Target,
    title: "Inovasi",
    description: "Kami selalu mencari cara baru dan lebih baik untuk melayani pelanggan kami dengan teknologi terkini."
  },
  {
    icon: Award,
    title: "Kualitas",
    description: "Komitmen kami adalah menyediakan produk dan layanan dengan standar kualitas tertinggi."
  },
  {
    icon: Users,
    title: "Kolaborasi",
    description: "Kami percaya bahwa kesuksesan adalah hasil dari kerja sama yang baik dengan mitra dan pelanggan."
  },
  {
    icon: Eye,
    title: "Transparansi",
    description: "Kejujuran dan keterbukaan adalah fondasi dalam setiap interaksi kami dengan pelanggan."
  }
]

const defaultArticles = [
  {
    id: "",
    category: "Artikel",
    title: "Strategi Optimasi Infrastruktur IT untuk UMKM",
    date: "Jan 2025",
    excerpt: "Panduan praktis untuk meningkatkan performa jaringan dan keamanan data dengan biaya efisien.",
    imageUrl: ""
  },
  {
    id: "",
    category: "Berita",
    title: "Kolaborasi DaayComTech untuk Modernisasi Data Center",
    date: "Mar 2025",
    excerpt: "Kolaborasi dengan mitra lokal untuk meningkatkan ketersediaan layanan bisnis di Jawa Tengah.",
    imageUrl: ""
  },
  {
    id: "",
    category: "Studi Kasus",
    title: "Implementasi Sistem Monitoring 24/7",
    date: "Nov 2024",
    excerpt: "Bagaimana sistem monitoring real-time membantu klien meminimalkan downtime operasional.",
    imageUrl: ""
  }
]

const defaultAchievements = [
  {
    id: "",
    icon: Trophy,
    title: "Top Partner Teknologi 2024",
    year: "2024",
    description: "Pengakuan atas konsistensi layanan dan kepuasan pelanggan.",
    imageUrl: ""
  },
  {
    id: "",
    icon: Medal,
    title: "Sertifikasi Keamanan Informasi",
    year: "2023",
    description: "Standar proses kerja yang selaras dengan praktik terbaik keamanan data.",
    imageUrl: ""
  },
  {
    id: "",
    icon: Award,
    title: "1000+ Implementasi Sukses",
    year: "2022",
    description: "Pencapaian proyek dengan deliverable tepat waktu dan kualitas terjaga.",
    imageUrl: ""
  }
]

const achievementIcons = [Trophy, Medal, Award]

const formatMonthYear = (value: Date) => {
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(value)
}

async function getArticles() {
  try {
    return await prisma.article.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    })
  } catch (error) {
    console.error("Error fetching articles:", error)
    return []
  }
}

async function getAchievements() {
  try {
    return await prisma.achievement.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    })
  } catch (error) {
    console.error("Error fetching achievements:", error)
    return []
  }
}

export default async function AboutPage() {
  const [articleItems, achievementItems] = await Promise.all([
    getArticles(),
    getAchievements(),
  ])

  const articleCards = articleItems.length
    ? articleItems.map((item) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        date: formatMonthYear(item.publishedAt ?? item.createdAt),
        excerpt: item.excerpt,
        imageUrl: item.imageUrl ?? "",
      }))
    : defaultArticles

  const achievementCards = achievementItems.length
    ? achievementItems.map((item, index) => ({
        id: item.id,
        icon: achievementIcons[index % achievementIcons.length],
        title: item.title,
        year: item.year,
        description: item.description,
        imageUrl: item.imageUrl ?? "",
      }))
    : defaultAchievements

  const articleCategories = Array.from(new Set(articleCards.map((item) => item.category))).filter(Boolean)
  const latestArticleTitle = articleCards[0]?.title ?? ""
  const latestArticleDate = articleCards[0]?.date ?? ""

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-black via-red-900 to-red-700 text-white py-20 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 right-6 h-40 w-40 rounded-full bg-red-500/30 blur-2xl float-slow" />
        <div className="site-container">
          <Reveal className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-6">Tentang DaayComTech</h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Kami adalah perusahaan teknologi yang berdedikasi untuk menyediakan solusi inovatif dan berkualitas tinggi untuk membantu bisnis berkembang di era digital.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Cerita Kami</h2>
              <div className="prose prose-lg text-gray-600">
                <p className="mb-4">
                  DaayComTech dimulai dari sebuah visi sederhana: membuat teknologi lebih mudah diakses dan dimanfaatkan oleh berbagai bisnis di Indonesia. Sejak didirikan, kami telah berkembang dari tim kecil menjadi perusahaan yang melayani ratusan klien di berbagai industri.
                </p>
                <p className="mb-4">
                  Perjalanan kami dipenuhi dengan pembelajaran, inovasi, dan komitmen yang kuat untuk memberikan nilai terbaik kepada pelanggan. Kami percaya bahwa kesuksesan pelanggan adalah kesuksesan kami.
                </p>
                <p>
                  Hari ini, DaayComTech terus berinovasi dan berkembang, selalu dengan fokus pada kualitas, layanan, dan kepuasan pelanggan.
                </p>
              </div>
            </Reveal>
            <Reveal className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100" delayMs={150}>
              <Image
                src="/images/team/team.png"
                alt="Tim DaayComTech"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-neutral-950">
        <div className="site-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Reveal className="bg-white/95 p-8 rounded-lg shadow-lg border border-white/10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
                <Eye className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Visi</h2>
              <p className="text-gray-600 leading-relaxed">
                Menjadi penyedia solusi teknologi terdepan dan terpercaya di Indonesia, yang membantu bisnis bertransformasi dan berkembang melalui inovasi teknologi.
              </p>
            </Reveal>
            <Reveal className="bg-white/95 p-8 rounded-lg shadow-lg border border-white/10" delayMs={150}>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
                <Target className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Misi</h2>
              <ul className="text-gray-600 space-y-2">
                <li>• Menyediakan produk teknologi berkualitas tinggi</li>
                <li>• Memberikan layanan pelanggan yang responsif dan profesional</li>
                <li>• Terus berinovasi mengikuti perkembangan teknologi</li>
                <li>• Membangun partnership jangka panjang dengan klien</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20">
        <div className="site-container">
          <Reveal className="text-center mb-12">
            <div className="section-accent mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Profil Pencapaian</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Rekam jejak pencapaian yang membuktikan konsistensi kami dalam kualitas layanan dan inovasi.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievementCards.map((item, index) => {
              const card = (
                <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  {item.imageUrl ? (
                    <div className="mb-4">
                      <div className="relative w-full aspect-[16/10] rounded bg-gray-50 overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-contain p-1.5"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg mb-3">
                      <item.icon className="h-5 w-5 text-red-600" />
                    </div>
                  )}
                  <div className="text-[11px] uppercase tracking-wide text-red-600 font-semibold mb-1">
                    {item.year}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                </div>
              )

              return item.id ? (
                <Link key={item.id} href={`/achievements/${item.id}`} className="block">
                  <Reveal delayMs={index * 100}>{card}</Reveal>
                </Link>
              ) : (
                <Reveal key={index} delayMs={index * 100}>{card}</Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-20 bg-neutral-950">
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 items-start">
            <Reveal>
              <h2 className="text-3xl font-bold text-white mb-4">Penulisan Berita & Artikel</h2>
              <p className="text-white/70 leading-relaxed">
                Menampilkan {articleCards.length} tulisan terbaru{articleCategories.length ? ` dari kategori ${articleCategories.join(", ")}.` : "."}
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-white/80">
                <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/10 p-4">
                  <FileText className="h-5 w-5 text-red-400 mt-1" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/60">Total Tulisan</p>
                    <p className="text-sm font-semibold text-white">{articleCards.length}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/10 p-4">
                  <FileText className="h-5 w-5 text-red-400 mt-1" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/60">Kategori</p>
                    <p className="text-sm font-semibold text-white">
                      {articleCategories.length ? articleCategories.join(", ") : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/10 p-4">
                  <FileText className="h-5 w-5 text-red-400 mt-1" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/60">Update Terbaru</p>
                    <p className="text-sm font-semibold text-white">
                      {latestArticleTitle ? `${latestArticleTitle} (${latestArticleDate})` : "-"}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {articleCards.map((article, index) => {
                const card = (
                  <div className="bg-white/95 p-4 rounded-lg shadow-lg border border-white/10 hover:shadow-xl transition-shadow">
                    <div className="flex gap-3">
                      {article.imageUrl && (
                        <div className="relative h-20 w-28 sm:h-24 sm:w-32 flex-shrink-0 rounded bg-gray-50 overflow-hidden">
                          <Image
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            className="object-contain p-1.5"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                          <span className="uppercase tracking-wide text-red-600 font-semibold">{article.category}</span>
                          <span>{article.date}</span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">{article.title}</h3>
                        <p className="text-xs text-gray-600 line-clamp-2">{article.excerpt}</p>
                      </div>
                    </div>
                  </div>
                )

                return article.id ? (
                  <Link key={article.id} href={`/articles/${article.id}`} className="block">
                    <Reveal delayMs={index * 100}>{card}</Reveal>
                  </Link>
                ) : (
                  <Reveal key={index} delayMs={index * 100}>{card}</Reveal>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="site-container">
          <Reveal className="text-center mb-12">
            <div className="section-accent mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nilai-Nilai Kami</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nilai-nilai yang menjadi fondasi dalam setiap keputusan dan tindakan kami
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Reveal key={index} delayMs={index * 100} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <value.icon className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Founded */}
      <section className="py-16 bg-neutral-950">
        <div className="site-container">
          <Reveal className="text-center text-white">
            <div className="section-accent mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-3">Berdiri Sejak 2019</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              DaayComTech hadir sejak 2019 untuk membantu bisnis mengadopsi teknologi yang tepat dan berkelanjutan.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  )
}



