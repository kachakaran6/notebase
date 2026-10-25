import { Page, NewPage, Visibility, Template } from '@/types/page'

export interface FetchApiOptions extends RequestInit {
  timeoutMs?: number
  retries?: number
}

export async function fetchApi<T>(url: string, options: FetchApiOptions = {}): Promise<T> {
  const { timeoutMs = 15000, retries = 1, ...fetchOptions } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      })

      clearTimeout(timeoutId)

      const text = await res.text()
      let json: any = null
      try {
        json = text ? JSON.parse(text) : null
      } catch {
        json = null
      }

      if (!res.ok) {
        const errorMsg =
          json?.error ||
          (text && text.length < 150 && !text.includes('<!DOCTYPE')
            ? text
            : `Request failed with status ${res.status}`)
        throw new Error(errorMsg)
      }

      return (json?.data !== undefined ? json.data : json) as T
    } catch (err: any) {
      clearTimeout(timeoutId)
      const isAbort = err?.name === 'AbortError'
      lastError = new Error(
        isAbort
          ? 'Network request timed out. Please check your internet connection.'
          : err?.message || 'Network request failed'
      )

      // Only retry for idempotent GET requests on transient network or timeout failures
      const isGet = !fetchOptions.method || fetchOptions.method.toUpperCase() === 'GET'
      if (attempt < retries && isGet) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }
      break
    }
  }

  throw lastError || new Error('Request failed')
}

// Pages API
export async function getPages(search?: string): Promise<Page[]> {
  const url = search ? `/api/pages?search=${encodeURIComponent(search)}` : '/api/pages'
  return await fetchApi<Page[]>(url)
}

export async function getPage(id: string): Promise<Page> {
  return await fetchApi<Page>(`/api/pages/${id}`)
}

export async function createPage(pageData: Partial<NewPage> & { title: string }): Promise<Page> {
  return await fetchApi<Page>('/api/pages', {
    method: 'POST',
    body: JSON.stringify(pageData),
  })
}

export async function updatePage(id: string, updates: Partial<Page>): Promise<Page> {
  return await fetchApi<Page>(`/api/pages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function deletePage(id: string): Promise<void> {
  await fetchApi(`/api/pages/${id}`, {
    method: 'DELETE',
  })
}

export async function duplicatePage(id: string): Promise<Page> {
  return await fetchApi<Page>(`/api/pages/${id}/duplicate`, {
    method: 'POST',
  })
}

// Share Links API
export async function createShareLink(pageId: string, expiresAt?: string): Promise<{ token: string; shareUrl: string }> {
  return await fetchApi<{ token: string; shareUrl: string }>('/api/share', {
    method: 'POST',
    body: JSON.stringify({ pageId, expiresAt }),
  })
}

export async function getShareLinks(pageId: string): Promise<any[]> {
  return await fetchApi<any[]>(`/api/share?pageId=${pageId}`)
}

export async function revokeShareLink(token: string): Promise<void> {
  await fetchApi(`/api/share?token=${token}`, {
    method: 'DELETE',
  })
}
