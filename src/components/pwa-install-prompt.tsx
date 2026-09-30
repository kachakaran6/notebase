"use client"

import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PwaInstallPrompt({ className = '' }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }

  if (!isInstallable) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstallClick}
      className={`text-xs gap-1.5 h-8 cursor-pointer ${className}`}
      title="Install Notebase as a desktop or mobile application"
    >
      <Download className="w-3.5 h-3.5 text-primary" />
      <span>Install App</span>
    </Button>
  )
}
