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
  if (typeof window === 'undefined' || !id) return
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
  const hasInitialized = useRef(false)

  // Instant render from session cache if available
  useEffect(() => {
    if (hasInitialized.current || !pageId) return
    hasInitialized.current = true

    const cached = getCachedDoc(pageId)
    if (cached) {
      setPage(cached)
      setLoading(false)
    }
  }, [pageId])

  const fetchPage = useCallback(async () => {
    if (!pageId) return
    try {
      setPage((current) => {
        if (!current) setLoading(true)
        return current
      })
      setError(null)
      const data = await getPage(pageId)
      setPage(data)
      setCachedDoc(pageId, data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch page')
    } finally {
      setLoading(false)
    }
  }, [pageId])

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
  }, [fetchPage])

  return {
    page,
    loading,
    error,
    updatePage: handleUpdatePage,
    updatePageVisibility: handleUpdatePageVisibility,
    refreshPage: fetchPage,
  }
}