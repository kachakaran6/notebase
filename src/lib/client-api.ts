import { Page, NewPage, Visibility, Template } from '@/types/page'

export async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || `Request failed with status ${res.status}`)
  }
  return json.data !== undefined ? json.data : json
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
