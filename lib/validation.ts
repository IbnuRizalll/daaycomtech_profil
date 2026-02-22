import { z } from "zod"

const trimmedString = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, { message: `Minimal ${min} karakter` })
    .max(max, { message: `Maksimal ${max} karakter` })

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  captchaAnswer: z.string().trim().optional(),
})

export const contactSchema = z.object({
  name: trimmedString(2, 80),
  email: z.string().trim().email().max(254),
  phone: trimmedString(6, 20),
  subject: trimmedString(3, 120),
  content: trimmedString(5, 2000),
})

const booleanFromString = z.preprocess((value) => {
  if (value === "true") return true
  if (value === "false") return false
  return value
}, z.boolean())

export const productSchema = z.object({
  name: trimmedString(2, 160),
  slug: trimmedString(2, 160),
  description: trimmedString(5, 5000),
  price: z.preprocess((value) => Number(value), z.number().nonnegative().max(1_000_000_000)),
  imageUrl: z.string().trim().min(1),
  images: z
    .union([z.array(z.string().trim().min(1)), z.string().trim().min(2)])
    .optional(),
  category: trimmedString(2, 80),
  featured: booleanFromString.optional(),
  inStock: booleanFromString.optional(),
  sections: z.any().optional(),
})

export const productUpdateSchema = productSchema.partial()
