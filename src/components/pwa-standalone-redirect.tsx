"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function PwaStandaloneRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Detect if launched from installed PWA or iOS standalone
    if (typeof window === 'undefined') return
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    if (isStandalone) {
      router.replace('/dashboard')
    }
  }, [router])

  return null
}
