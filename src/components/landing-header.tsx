"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { BrandLogo } from '@/components/brand-logo'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 45
          setIsScrolled(scrolled)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-300 ease-out ${
          isScrolled ? 'pt-3 sm:pt-4 px-3 sm:px-6' : 'pt-2 sm:pt-4 px-4 sm:px-8 md:px-12'
        }`}
      >
        <div
          className={`pointer-events-auto flex items-center justify-between transition-all duration-300 ease-out ${
            isScrolled
              ? 'w-[calc(100%-16px)] sm:w-[92%] max-w-[960px] h-[52px] sm:h-[56px] px-3.5 sm:px-5 bg-white/95 dark:bg-[#1D1F1B]/95 backdrop-blur-md border border-[#E3E1DA] dark:border-[#34362F] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_6px_28px_rgba(0,0,0,0.45)] rounded-2xl'
              : 'w-full max-w-[1200px] h-16 sm:h-18 px-0 bg-transparent border-transparent shadow-none rounded-none'
          }`}
        >
          {/* Left: Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-foreground hover:opacity-90 transition shrink-0"
            aria-label="Notebase Home"
          >
            <BrandLogo size={isScrolled ? 22 : 26} className="transition-all duration-300" />
            <span className="font-semibold text-sm sm:text-base tracking-tight text-foreground">
              Notebase
            </span>
          </Link>

          {/* Right: Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle className="h-8 w-8" />
            <Link href="/auth/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-normal h-8 px-2.5 sm:px-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button
                size="sm"
                className="text-xs font-medium h-8 px-3.5 shadow-2xs hover:opacity-95 cursor-pointer"
              >
                Open Notebase
              </Button>
            </Link>
          </div>

          {/* Right: Mobile Controls (< sm) */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <ThemeToggle className="h-8 w-8" />

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg border border-border bg-card/80 text-foreground flex items-center justify-center hover:bg-muted transition cursor-pointer"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-xs p-6 flex flex-col justify-between">
                <div>
                  <SheetHeader className="pb-4 border-b border-border text-left">
                    <div className="flex items-center gap-2.5">
                      <BrandLogo size={24} />
                      <SheetTitle className="text-base font-semibold">Notebase</SheetTitle>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Your notes. Your ideas. One place.
                    </p>
                  </SheetHeader>

                  <div className="py-6 space-y-3">
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full block"
                    >
                      <Button className="w-full text-xs font-medium h-9.5 justify-between">
                        <span>Open Notebase</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>

                    <Link
                      href="/auth/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full block"
                    >
                      <Button variant="outline" className="w-full text-xs font-normal h-9.5">
                        <span>Sign In</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <a
                    href="https://karan-pms.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    <span>Made by Karan</span>
                    <ExternalLink className="w-3 h-3 text-subtle-foreground" />
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Spacing placeholder for document flow */}
      <div className="h-16 sm:h-20" aria-hidden="true" />
    </>
  )
}
