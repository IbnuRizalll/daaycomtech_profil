import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
      <div className="text-center px-6">
        <div className="mb-8">
          <h1 className="text-7xl sm:text-9xl font-bold text-red-600">404</h1>
          <p className="text-2xl font-semibold text-gray-900 mt-4">
            Halaman Tidak Ditemukan
          </p>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Maaf, halaman yang Anda cari tidak dapat ditemukan atau mungkin telah dipindahkan.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" variant="outline">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Kembali
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Ke Halaman Utama
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
