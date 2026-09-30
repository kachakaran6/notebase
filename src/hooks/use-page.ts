import { useState, useEffect, useCallback } from 'react'
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

export function usePage(pageId: string): UsePageReturn {
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = useCallback(async () => {
    if (!pageId) return
    try {
      setLoading(true)
      setError(null)
      const data = await getPage(pageId)
      setPage(data)
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