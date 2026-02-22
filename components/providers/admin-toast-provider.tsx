"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { CheckCircle2, X, XCircle } from "lucide-react"

type ToastType = "success" | "error"

interface ToastItem {
  id: string
  message: string
  type: ToastType
  state: "enter" | "exit"
}

interface AdminToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
}

const AdminToastContext = createContext<AdminToastContextValue | null>(null)

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const enqueue = useCallback((message: string, type: ToastType) => {
    if (!message) return
    const id = createId()
    const duration = 2400
    const exitDelay = 200

    setToasts((prev) => [...prev.slice(-3), { id, message, type, state: "enter" }])

    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, state: "exit" } : toast))
      )
    }, duration - exitDelay)

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, duration)
  }, [])

  const value = useMemo(
    () => ({
      success: (message: string) => enqueue(message, "success"),
      error: (message: string) => enqueue(message, "error"),
    }),
    [enqueue]
  )

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-xs flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
              toast.type === "success"
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-red-200 bg-red-50 text-red-900"
            } ${toast.state === "exit" ? "toast-exit" : "toast-enter"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 text-red-600" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  )
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext)
  if (!ctx) {
    throw new Error("useAdminToast must be used within AdminToastProvider")
  }
  return ctx
}
