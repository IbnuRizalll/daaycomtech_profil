"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { contactSchema } from "@/lib/validation"

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const setFieldValue = (field: keyof typeof formValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
    const errorKey = field === "message" ? "content" : field
    if (fieldErrors[errorKey]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[errorKey]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsSuccess(false)
    setErrorMessage(null)
    setFieldErrors({})

    const showSuccess = () => {
      setIsSuccess(true)
      setErrorMessage(null)
      setFormValues({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      })
      setTimeout(() => setIsSuccess(false), 5000)
    }

    const showError = (message: string) => {
      setIsSuccess(false)
      setErrorMessage(message)
    }

    const payload = {
      name: formValues.name.trim(),
      email: formValues.email.trim(),
      phone: formValues.phone.trim(),
      subject: formValues.subject.trim(),
      content: formValues.message.trim(),
    }

    const parsed = contactSchema.safeParse(payload)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => {
        const rawKey = String(issue.path[0] || "")
        const key = rawKey === "content" ? "message" : rawKey
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message
        }
      })
      setFieldErrors(nextErrors)
      showError("Periksa kembali input Anda.")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => null)
        const serverError =
          typeof errJson?.error === 'string' && errJson.error.trim()
            ? errJson.error
            : 'Gagal mengirim pesan. Silakan coba lagi.'
        console.error('Server error submitting form:', serverError)
        showError(serverError)
      } else {
        console.log('Form submitted:', payload)
        showSuccess()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      showError('Gagal mengirim pesan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Agus Santoso"
            disabled={isSubmitting}
            value={formValues.name}
            onChange={(e) => setFieldValue("name", e.target.value)}
          />
          {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="agus@example.com"
            disabled={isSubmitting}
            value={formValues.email}
            onChange={(e) => setFieldValue("email", e.target.value)}
          />
          {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
            No. HP <span className="text-red-500">*</span>
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="08xxxxxxxxxx"
            disabled={isSubmitting}
            value={formValues.phone}
            onChange={(e) => setFieldValue("phone", e.target.value)}
          />
          {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2">
            Subjek <span className="text-red-500">*</span>
          </label>
          <Input
            id="subject"
            name="subject"
            type="text"
            required
            placeholder="Pertanyaan tentang produk"
            disabled={isSubmitting}
            value={formValues.subject}
            onChange={(e) => setFieldValue("subject", e.target.value)}
          />
          {fieldErrors.subject && <p className="text-xs text-red-600 mt-1">{fieldErrors.subject}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
          Pesan <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="message"
          name="message"
          required
          rows={6}
          placeholder="Tulis pesan Anda di sini..."
          disabled={isSubmitting}
          value={formValues.message}
          onChange={(e) => setFieldValue("message", e.target.value)}
        />
        {fieldErrors.message && <p className="text-xs text-red-600 mt-1">{fieldErrors.message}</p>}
      </div>

      {isSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          Terima kasih! Pesan Anda telah terkirim. Kami akan segera menghubungi Anda.
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {errorMessage}
        </div>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto">
        {isSubmitting ? (
          "Mengirim..."
        ) : (
          <>
            Kirim Pesan
            <Send className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  )
}
