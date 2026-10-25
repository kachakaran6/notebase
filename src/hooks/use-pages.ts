import { useState, useEffect, useCallback, useRef } from 'react'
import { Page, NewPage } from '@/types/page'
import {
  getPages as getPagesApi,
  createPage as createPageApi,
  updatePage as updatePageApi,
  deletePage as deletePageApi,
  duplicatePage as duplicatePageApi
} from '@/lib/client-api'

const PAGES_CACHE_KEY = 'notebase_pages_cache_v1'

interface UsePagesReturn {
  pages: Page[]
  loading: boolean
  isRevalidating: boolean
  isSlowConnection: boolean
  error: string | null
  createPage: (pageData: Partial<NewPage> & { title: string }) => Promise<Page>
  updatePage: (id: string, updates: Partial<Page>) => Promise<Page>
  deletePage: (id: string) => Promise<void>
  duplicatePage: (id: string) => Promise<Page>
  searchPages: (query: string) => Promise<Page[]>
  refreshPages: () => Promise<void>
}

// Helper to safely read from localStorage
function getLocalCache(): Page[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PAGES_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

// Helper to safely write to localStorage
function setLocalCache(pages: Page[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PAGES_CACHE_KEY, JSON.stringify(pages))
  } catch {
    // Ignore storage quota errors
  }
}

export function usePages(): UsePagesReturn {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [isRevalidating, setIsRevalidating] = useState(false)
  const [isSlowConnection, setIsSlowConnection] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasInitialized = useRef(false)

  // Initial load: instant cached data if available (Stale-While-Revalidate)
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const cached = getLocalCache()
    if (cached && cached.length > 0) {
      setPages(cached)
      setLoading(false)
      setIsRevalidating(true)
    }
  }, [])

  const fetchPages = useCallback(async () => {
    // Timer to detect slow connections (> 3500ms)
    const slowTimer = setTimeout(() => {
      setIsSlowConnection(true)
    }, 3500)

    try {
      // If we don't have pages yet, show loading skeleton
      setPages((current) => {
        if (current.length === 0) {
          setLoading(true)
        } else {
          setIsRevalidating(true)
        }
        return current
      })
      setError(null)

      const data = await getPagesApi()
      setPages(data)
      setLocalCache(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pages'
      setError(errorMessage)
      // If we have cached pages, keep them in place so the screen is never blank!
    } finally {
      clearTimeout(slowTimer)
      setIsSlowConnection(false)
      setLoading(false)
      setIsRevalidating(false)
    }
  }, [])

  const handleCreatePage = async (pageData: Partial<NewPage> & { title: string }): Promise<Page> => {
    try {
      setError(null)
      const newPage = await createPageApi(pageData)
      setPages((prev) => {
        const next = [newPage, ...prev]
        setLocalCache(next)
        return next
      })
      return newPage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create page'
      setError(errorMessage)
      throw err
    }
  }

  const handleUpdatePage = async (id: string, updates: Partial<Page>): Promise<Page> => {
    try {
      setError(null)
      const updatedPage = await updatePageApi(id, updates)
      setPages((prev) => {
        const next = prev.map((page) => (page.id === id ? updatedPage : page))
        setLocalCache(next)
        return next
      })
      return updatedPage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update page'
      setError(errorMessage)
      throw err
    }
  }

  const handleDeletePage = async (id: string): Promise<void> => {
    try {
      setError(null)
      await deletePageApi(id)
      setPages((prev) => {
        const next = prev.filter((page) => page.id !== id)
        setLocalCache(next)
        return next
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete page'
      setError(errorMessage)
      throw err
    }
  }

  const handleDuplicatePage = async (id: string): Promise<Page> => {
    try {
      setError(null)
      const duplicated = await duplicatePageApi(id)
      setPages((prev) => {
        const next = [duplicated, ...prev]
        setLocalCache(next)
        return next
      })
      return duplicated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate page'
      setError(errorMessage)
      throw err
    }
  }

  const handleSearchPages = async (query: string): Promise<Page[]> => {
    try {
      setError(null)
      const searchResults = await getPagesApi(query)
      setPages(searchResults)
      return searchResults
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search pages'
      setError(errorMessage)
      throw err
    }
  }

  useEffect(() => {
    fetchPages()
  }, [fetchPages])

  return {
    pages,
    loading,
    isRevalidating,
    isSlowConnection,
    error,
    createPage: handleCreatePage,
    updatePage: handleUpdatePage,
    deletePage: handleDeletePage,
    duplicatePage: handleDuplicatePage,
    searchPages: handleSearchPages,
    refreshPages: fetchPages,
  }
}