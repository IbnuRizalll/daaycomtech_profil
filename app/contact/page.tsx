import type { Metadata } from 'next';
import { ContactForm } from './contact-form';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';

export const metadata: Metadata = {
  title: 'Hubungi Kami',
  description:
    'Hubungi tim DaayComTech untuk konsultasi, pertanyaan, atau dukungan. Kami siap membantu Anda.',
};

const contactInfo = [
  {
    icon: MapPin,
    title: 'Alamat',
    content:
      process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
      'Jl. DI Panjaitan No.128, Karangreja, Purwokerto Kidul, Kec. Purwokerto Sel., Kabupaten Banyumas, Jawa Tengah',
  },
  {
    icon: Phone,
    title: 'Telepon',
    content: '+62 831-1626-6988',
    link: 'tel:+6283116266988',
  },
  {
    icon: Mail,
    title: 'Email',
    content: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'info@daaycomtech.com',
    link: `mailto:${process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'info@daaycomtech.com'}`,
  },
  {
    icon: Clock,
    title: 'Jam Operasional',
    content: 'Senin - Jumat: 08:00 - 17:00 WIB',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-black via-red-900 to-red-700 text-white py-20 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 right-6 h-40 w-40 rounded-full bg-red-500/30 blur-2xl float-slow" />
        <div className="site-container">
          <Reveal className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-6">Hubungi Kami</h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Ada pertanyaan atau butuh bantuan? Tim kami siap membantu Anda
              dengan senang hati.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="py-16 bg-white border-y border-black/5">
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-8">
              <Reveal>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Informasi Kontak
                </h2>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <info.icon className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {info.title}
                        </h3>
                        {info.link ? (
                          <a
                            href={info.link}
                            className="text-gray-600 hover:text-red-600 transition-colors"
                          >
                            {info.content}
                          </a>
                        ) : (
                          <p className="text-gray-600">{info.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>

              {/* Map */}
              <Reveal
                delayMs={150}
                className="rounded-lg overflow-hidden shadow-sm"
              >
                <div className="aspect-square w-full bg-gray-200">
                  <iframe
                    src="https://maps.google.com/maps?hl=id&q=-7.4352631,109.2490926&z=17&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="DaayComTech Location"
                  />
                </div>
              </Reveal>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Reveal
                className="bg-white rounded-lg shadow-sm p-8 border border-black/5"
                delayMs={100}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Kirim Pesan
                </h2>
                <ContactForm />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-16 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 left-10 h-40 w-40 rounded-full bg-red-500/20 blur-2xl float-slower" />
        <div className="site-container text-center">
          <Reveal>
            <h2 className="text-3xl font-bold mb-4">Butuh Respon Cepat?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Hubungi kami langsung via WhatsApp untuk mendapatkan respon yang
              lebih cepat dari tim sales kami.
            </p>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '6283116266988'}?text=${encodeURIComponent('Halo, saya ingin bertanya tentang produk DaayComTech.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-red-700 transition-colors"
            >
              <Phone className="h-5 w-5" />
              Hubungi via WhatsApp
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
