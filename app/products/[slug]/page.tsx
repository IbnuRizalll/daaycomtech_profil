import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { ArrowLeft, MessageCircle, Package, Shield, Truck } from "lucide-react"
import ImageCarouselClient from "@/components/image-carousel-client"
import type { Metadata } from "next"
import { Reveal } from "@/components/motion/reveal"
import { ProductSections } from "@/components/sections/product-sections"

interface PageProps {
  params: {
    slug: string
  }
}

async function getProduct(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug }
    })
    return product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug)

  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan'
    }
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.imageUrl],
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  const parsedSections = (() => {
    const raw = (product as any)?.sections
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === "string") {
      try {
        const data = JSON.parse(raw)
        return Array.isArray(data) ? data : []
      } catch {
        return []
      }
    }
    return []
  })()

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '628123456789'
  const whatsappMessage = encodeURIComponent(
    `Halo, saya tertarik dengan produk ${product.name}. Bisa tolong berikan informasi lebih lanjut?`
  )
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  const features = [
    {
      icon: Package,
      title: "Produk Original",
      description: "Garansi keaslian produk 100%"
    },
    {
      icon: Truck,
      title: "Gratis Ongkir",
      description: "Untuk pembelian minimal tertentu"
    },
    {
      icon: Shield,
      title: "Garansi Resmi",
      description: "Garansi resmi dari distributor"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="site-container py-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/products" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Katalog
            </Link>
          </Button>
        </div>
      </div>

      <div className="site-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image - with Carousel */}
          <Reveal>
            {product.images ? (
              <ImageCarouselClient images={JSON.parse(product.images)} />
            ) : (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white shadow-sm">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain p-8"
                  priority
                />
              </div>
            )}
          </Reveal>

          {/* Product Info */}
          <Reveal delayMs={100}>
            <div className="mb-2">
              <span className="inline-block bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
                {product.category}
              </span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            <div className="text-4xl font-bold text-red-600 mb-2">
              {formatPrice(product.price)}
            </div>
            <div className="mb-6">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {product.inStock ? 'Tersedia' : 'Tidak Tersedia'}
              </span>
            </div>

            <div className="prose prose-gray mb-8">
              <h3 className="text-lg font-semibold mb-2">Deskripsi Produk</h3>
              <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
            </div>

            {/* CTA */}
            <div className="space-y-4 mb-8">
              <Button asChild size="lg" className="w-full">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Hubungi Sales via WhatsApp
                </a>
              </Button>
              <p className="text-sm text-gray-500 text-center">
                Tim sales kami akan membantu Anda dengan senang hati
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="p-4 text-center">
                    <feature.icon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Additional Info */}
        {parsedSections.length > 0 && (
          <ProductSections sections={parsedSections} />
        )}

        {/* Order Instructions */}
        <Reveal className="mt-16 bg-white rounded-lg shadow-sm p-8 border border-black/5">
          <div className="section-accent mb-4" />
          <h2 className="text-2xl font-bold mb-6">Cara Pemesanan</h2>
          <ol className="space-y-2 text-gray-600">
            <li>1. Klik tombol "Hubungi Sales via WhatsApp"</li>
            <li>2. Diskusikan detail produk dengan tim sales</li>
            <li>3. Lakukan pembayaran sesuai instruksi</li>
            <li>4. Produk akan dikirim ke alamat Anda</li>
          </ol>
        </Reveal>
      </div>
    </div>
  )
}

