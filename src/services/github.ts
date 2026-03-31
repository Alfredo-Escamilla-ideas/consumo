import type { AppData } from '../types'

const GITHUB_API = 'https://api.github.com'
const OWNER = 'Alfredo-Escamilla-ideas'
const REPO = 'consumo'
const DATA_PATH = 'data/consumo.json'

function b64encode(str: string): string {
  // Handle UTF-8 (for Spanish characters in addresses, etc.)
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function b64decode(str: string): string {
  const binary = atob(str.replace(/\n/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export async function githubLoadData(
  token: string
): Promise<{ data: AppData; sha: string } | { data: AppData; sha: null } | null> {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${DATA_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (res.status === 404) {
      return { data: { electricCharges: [], fuelRefuels: [] }, sha: null }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Error GitHub: ${res.status}`)
    }

    const file = await res.json()
    const data = JSON.parse(b64decode(file.content)) as AppData
    return { data, sha: file.sha as string }
  } catch (e) {
    console.error('GitHub load error:', e)
    return null
  }
}

export async function githubSaveData(
  token: string,
  data: AppData,
  sha: string | null
): Promise<{ success: boolean; sha: string | null }> {
  try {
    const content = b64encode(JSON.stringify(data, null, 2))
    const body: Record<string, unknown> = {
      message: `chore: update consumo data ${new Date().toISOString()}`,
      content,
    }
    if (sha) body.sha = sha

    const res = await fetch(
      `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${DATA_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Error GitHub: ${res.status}`)
    }

    const result = await res.json()
    return { success: true, sha: result.content.sha }
  } catch (e) {
    console.error('GitHub save error:', e)
    return { success: false, sha: sha }
  }
}

export async function githubValidateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })
    return res.ok
  } catch {
    return false
  }
}
