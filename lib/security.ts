import { randomUUID } from "crypto"
import sharp from "sharp"

const MAX_IMAGE_SIZE = 1600
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 // 2MB

type ImageType = "image/jpeg" | "image/png" | "image/webp"

const isJpeg = (buffer: Buffer) =>
  buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff

const isPng = (buffer: Buffer) =>
  buffer.length >= 8 &&
  buffer[0] === 0x89 &&
  buffer[1] === 0x50 &&
  buffer[2] === 0x4e &&
  buffer[3] === 0x47 &&
  buffer[4] === 0x0d &&
  buffer[5] === 0x0a &&
  buffer[6] === 0x1a &&
  buffer[7] === 0x0a

const isWebp = (buffer: Buffer) =>
  buffer.length >= 12 &&
  buffer.toString("ascii", 0, 4) === "RIFF" &&
  buffer.toString("ascii", 8, 12) === "WEBP"

const detectImageType = (buffer: Buffer): ImageType | null => {
  if (isJpeg(buffer)) return "image/jpeg"
  if (isPng(buffer)) return "image/png"
  if (isWebp(buffer)) return "image/webp"
  return null
}

export const processImageUpload = async (file: File) => {
  if (!file) {
    throw new Error("File tidak ditemukan")
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Ukuran file melebihi 2MB")
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes as ArrayBuffer)
  const detected = detectImageType(buffer)

  if (!detected) {
    throw new Error("File bukan gambar yang valid (JPG/PNG/WEBP)")
  }

  const outputBuffer = await sharp(buffer)
    .resize({
      width: MAX_IMAGE_SIZE,
      height: MAX_IMAGE_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer()

  return {
    buffer: outputBuffer,
    filename: `${randomUUID()}.webp`,
    optimized: true,
    mime: "image/webp",
  }
}
