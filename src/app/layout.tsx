import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { PwaRegister } from '@/components/pwa-register'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F6F2' },
    { media: '(prefers-color-scheme: dark)', color: '#171815' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://notebase.samast.pro'),
  title: {
    default: 'Notebase — Personal Knowledge & Notebook',
    template: '%s | Notebase',
  },
  description: 'A calm, personal knowledge base and document editor. Write, organize, and share notes, prompts, and ideas.',
  applicationName: 'Notebase',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Notebase',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/notebase.png',
    shortcut: '/notebase.png',
    apple: '/notebase.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground font-inter antialiased selection:bg-primary/20 selection:text-primary">
        <PwaRegister />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              className:
                'border border-border bg-card text-foreground text-xs shadow-md rounded-lg',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}