"use client"

import Image from "next/image"

interface Client {
  id: string
  name: string
  logoUrl: string
}

interface ClientSectionProps {
  clients: Client[]
}

export function ClientSection({ clients }: ClientSectionProps) {
  return (
    <section className="py-16 bg-white overflow-hidden border-y border-black/5">
      <div className="site-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Dipercaya Oleh
          </h2>
          <p className="text-gray-600">
            Perusahaan-perusahaan terkemuka yang telah mempercayai produk kami
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
          <div className="marquee group">
            <div className="marquee-track group-hover:[animation-play-state:paused]">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex-shrink-0 w-28 h-16 sm:w-36 sm:h-20 lg:w-40 lg:h-24 relative grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110"
                >
                  <Image
                    src={client.logoUrl}
                    alt={client.name}
                    fill
                    className="object-contain p-4"
                  />
                </div>
              ))}
            </div>
            <div
              className="marquee-track group-hover:[animation-play-state:paused]"
              aria-hidden="true"
            >
              {clients.map((client) => (
                <div
                  key={`${client.id}-duplicate`}
                  className="flex-shrink-0 w-28 h-16 sm:w-36 sm:h-20 lg:w-40 lg:h-24 relative grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110"
                >
                  <Image
                    src={client.logoUrl}
                    alt={client.name}
                    fill
                    className="object-contain p-4"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
