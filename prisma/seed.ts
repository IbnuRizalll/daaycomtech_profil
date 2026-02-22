import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const products = [
  {
    name: 'Server Dell PowerEdge R740',
    slug: 'server-dell-poweredge-r740',
    description: 'Server rack 2U dengan performa tinggi, ideal untuk data center dan virtualisasi. Dilengkapi dengan Intel Xeon Scalable processors, memori hingga 3TB, dan storage yang dapat dikonfigurasi sesuai kebutuhan.',
    price: 85000000,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    images: '[]',
    category: 'Hardware',
    featured: true,
  },
  {
    name: 'Microsoft Office 365 Business Premium',
    slug: 'microsoft-office-365-business-premium',
    description: 'Solusi produktivitas lengkap untuk bisnis dengan Word, Excel, PowerPoint, Teams, dan OneDrive. Lisensi 1 tahun untuk 1 user dengan 1TB cloud storage.',
    price: 2500000,
    imageUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=800&q=80',
    images: '[]',
    category: 'Software',
    featured: true,
  },
  {
    name: 'Cisco Catalyst 9300 Switch',
    slug: 'cisco-catalyst-9300-switch',
    description: 'Enterprise-class network switch 48 port dengan kecepatan 1Gbps per port. Dilengkapi dengan advanced security features dan StackWise-480 technology untuk high availability.',
    price: 125000000,
    imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
    images: '[]',
    category: 'Networking',
    featured: true,
  },
  {
    name: 'Laptop HP EliteBook 840 G9',
    slug: 'laptop-hp-elitebook-840-g9',
    description: 'Laptop bisnis premium dengan Intel Core i7 Gen 12, RAM 16GB, SSD 512GB, layar 14 inch FHD. Desain tipis dan ringan dengan keamanan enterprise-grade.',
    price: 22000000,
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
    images: '[]',
    category: 'Hardware',
    featured: false,
  },
  {
    name: 'Adobe Creative Cloud All Apps',
    slug: 'adobe-creative-cloud-all-apps',
    description: 'Akses ke semua aplikasi Adobe Creative Cloud termasuk Photoshop, Illustrator, Premiere Pro, After Effects, dan lainnya. Lisensi 1 tahun untuk 1 user.',
    price: 8500000,
    imageUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80',
    images: '[]',
    category: 'Software',
    featured: false,
  },
  {
    name: 'UPS APC Smart-UPS 3000VA',
    slug: 'ups-apc-smart-ups-3000va',
    description: 'Uninterruptible Power Supply dengan kapasitas 3000VA/2700W. LCD display, automatic voltage regulation, dan battery backup untuk melindungi perangkat kritis.',
    price: 18500000,
    imageUrl: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80',
    images: '[]',
    category: 'Hardware',
    featured: false,
  },
]

const clients = [
  {
    name: 'Bank Mandiri',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/320px-Bank_Mandiri_logo_2016.svg.png',
    isShow: true,
  },
  {
    name: 'Telkom Indonesia',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Telkom_Indonesia_2013.svg/320px-Telkom_Indonesia_2013.svg.png',
    isShow: true,
  },
  {
    name: 'Pertamina',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Pertamina_Logo.svg/320px-Pertamina_Logo.svg.png',
    isShow: true,
  },
  {
    name: 'Garuda Indonesia',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Garuda_Indonesia_Logo.svg/320px-Garuda_Indonesia_Logo.svg.png',
    isShow: true,
  },
  {
    name: 'BCA',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/320px-Bank_Central_Asia.svg.png',
    isShow: true,
  },
]

async function main() {
  console.log('Start seeding...')

  // Clear existing data
  await prisma.product.deleteMany()
  await prisma.client.deleteMany()
  await prisma.admin.deleteMany()
  console.log('Cleared existing data')

  // Seed admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.admin.create({
    data: {
      username: 'admin',
      email: 'ibnurizal.m22@gmail.com',
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
  })
  console.log('Created default admin user:', admin.email)

  // Seed products
  for (const product of products) {
    await prisma.product.create({
      data: product,
    })
  }
  console.log(`Created ${products.length} products`)

  // Seed clients
  for (const client of clients) {
    await prisma.client.create({
      data: client,
    })
  }
  console.log(`Created ${clients.length} clients`)

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
