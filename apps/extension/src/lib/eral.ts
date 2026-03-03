/**
 * Eral API client — safe for use in content scripts and background service worker.
 * Reads the Eral/WokSpec accessToken from chrome.storage.session (accepted by Eral Worker).
 */

export const ERAL_API = process.env.PLASMO_PUBLIC_ERAL_API_URL ?? "https://eral.wokspec.org/api"

export async function getAccessToken(): Promise<string | null> {
  const { accessToken } = await chrome.storage.session.get(["accessToken"])
  return accessToken ?? null
}

export interface EralChatResponse {
  message: string
  sessionId: string
}

export interface EralAnalyzeResponse {
  result: string
  type: string
}

export interface EralGenerateResponse {
  content: string
}

export async function eralChat(
  message: string,
  sessionId: string,
  context?: string
): Promise<EralChatResponse | null> {
  const token = await getAccessToken()
  if (!token) return null
  try {
    const res = await fetch(`${ERAL_API}/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Eral-Source": "eral-extension",
      },
      body: JSON.stringify({ message, sessionId, pageContext: context }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return { message: data.message ?? data.reply ?? data.data?.message ?? "", sessionId }
  } catch {
    return null
  }
}

export type AnalyzeType = "summarize" | "explain" | "improve" | "translate"

export async function eralAnalyze(
  type: AnalyzeType,
  content: string
): Promise<EralAnalyzeResponse | null> {
  const token = await getAccessToken()
  if (!token) return null
  try {
    const res = await fetch(`${ERAL_API}/v1/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Eral-Source": "eral-extension",
      },
      body: JSON.stringify({ type, content }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return { result: data.result ?? data.data?.result ?? "", type }
  } catch {
    return null
  }
}

export async function eralGenerate(
  type: "improve" | "rewrite" | "expand" | "shorten",
  content: string
): Promise<EralGenerateResponse | null> {
  const token = await getAccessToken()
  if (!token) return null
  try {
    const res = await fetch(`${ERAL_API}/v1/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Eral-Source": "eral-extension",
      },
      body: JSON.stringify({ type, content }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return { content: data.content ?? data.data?.content ?? "" }
  } catch {
    return null
  }
}
