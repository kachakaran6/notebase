import { useState, useEffect, useCallback } from 'react'
import { Page, NewPage } from '@/types/page'
import {
  getPages as getPagesApi,
  createPage as createPageApi,
  updatePage as updatePageApi,
  deletePage as deletePageApi,
  duplicatePage as duplicatePageApi
} from '@/lib/client-api'

interface UsePagesReturn {
  pages: Page[]
  loading: boolean
  error: string | null
  createPage: (pageData: Partial<NewPage> & { title: string }) => Promise<Page>
  updatePage: (id: string, updates: Partial<Page>) => Promise<Page>
  deletePage: (id: string) => Promise<void>
  duplicatePage: (id: string) => Promise<Page>
  searchPages: (query: string) => Promise<Page[]>
  refreshPages: () => Promise<void>
}

export function usePages(): UsePagesReturn {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getPagesApi()
      setPages(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pages')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCreatePage = async (pageData: Partial<NewPage> & { title: string }): Promise<Page> => {
    try {
      setError(null)
      const newPage = await createPageApi(pageData)
      setPages(prev => [newPage, ...prev])
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
      setPages(prev => prev.map(page => page.id === id ? updatedPage : page))
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
      setPages(prev => prev.filter(page => page.id !== id))
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
      setPages(prev => [duplicated, ...prev])
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
    error,
    createPage: handleCreatePage,
    updatePage: handleUpdatePage,
    deletePage: handleDeletePage,
    duplicatePage: handleDuplicatePage,
    searchPages: handleSearchPages,
    refreshPages: fetchPages,
  }
}