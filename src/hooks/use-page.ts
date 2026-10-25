import { useState, useEffect, useCallback, useRef } from 'react'
import { Page, Visibility } from '@/types/page'
import { getPage, updatePage as updatePageApi } from '@/lib/client-api'

interface UsePageReturn {
  page: Page | null
  loading: boolean
  error: string | null
  updatePage: (updates: Partial<Page>) => Promise<Page>
  updatePageVisibility: (visibility: Visibility) => Promise<Page>
  refreshPage: () => Promise<void>
}

function getCachedDoc(id: string): Page | null {
  if (typeof window === 'undefined' || !id) return null
  try {
    const raw = sessionStorage.getItem(`notebase_doc_${id}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setCachedDoc(id: string, page: Page) {
  if (typeof window === 'undefined' || !id || !page) return
  try {
    sessionStorage.setItem(`notebase_doc_${id}`, JSON.stringify(page))
  } catch {
    // Ignore quota errors
  }
}

export function usePage(pageId: string): UsePageReturn {
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Instant render from session cache if available
  useEffect(() => {
    if (!pageId) return
    const cached = getCachedDoc(pageId)
    if (cached) {
      setPage(cached)
      setLoading(false)
    }
  }, [pageId])

  const fetchPage = useCallback(async (isManual = false) => {
    if (!pageId) return

    if (isManual) {
      retryCountRef.current = 0
    }

    try {
      if (!page) setLoading(true)
      setError(null)
      const data = await getPage(pageId)
      setPage(data)
      setCachedDoc(pageId, data)
      setError(null)
      retryCountRef.current = 0
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch page'
      console.warn('[usePage] Fetch failed:', msg)

      // Auto-retry up to 3 times
      if (retryCountRef.current < 3) {
        retryCountRef.current += 1
        const delay = retryCountRef.current * 1500
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = setTimeout(() => {
          fetchPage()
        }, delay)
        return
      }

      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [pageId, page])

  const handleUpdatePage = async (updates: Partial<Page>): Promise<Page> => {
    try {
      setError(null)
      const updatedPage = await updatePageApi(pageId, updates)
      setPage(updatedPage)
      setCachedDoc(pageId, updatedPage)
      return updatedPage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update page'
      setError(errorMessage)
      throw err
    }
  }

  const handleUpdatePageVisibility = async (visibility: Visibility): Promise<Page> => {
    return await handleUpdatePage({ visibility })
  }

  useEffect(() => {
    fetchPage()
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    }
  }, [fetchPage])

  return {
    page,
    loading,
    error,
    updatePage: handleUpdatePage,
    updatePageVisibility: handleUpdatePageVisibility,
    refreshPage: () => fetchPage(true),
  }
}