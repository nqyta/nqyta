// Verifies a wok_live_/wok_test_ token against WokAPI
// Returns token metadata or null

import type { ApiKeyScope } from '../types';

const WOK_API_VERIFY_URL = 'https://api.wokspec.org/v1/tokens/verify';

export interface WokTokenMeta {
  key_id: string;
  user_id: string;
  plan: 'free' | 'pro' | 'enterprise';
  scopes: string[];
  environment: 'live' | 'test';
}

export async function verifyWokToken(
  token: string,
  internalSecret?: string
): Promise<WokTokenMeta | null> {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'X-Wok-Service': 'nqita',
    };
    if (internalSecret) {
      headers['X-Wok-Internal-Secret'] = internalSecret;
    }
    const res = await fetch(WOK_API_VERIFY_URL, {
      method: 'POST',
      headers,
    });
    if (!res.ok) return null;
    const data = await res.json() as { valid: boolean } & WokTokenMeta;
    if (!data.valid) return null;
    return data;
  } catch {
    return null;
  }
}

// Map WokAPI scopes to NQITA eral scopes
export function mapWokScopes(wokScopes: string[]): ApiKeyScope[] {
  const map: Record<string, ApiKeyScope[]> = {
    read:   ['analyze'],
    write:  ['generate', 'studio'],
    ai:     ['chat', 'generate', 'analyze'],
    admin:  ['*'],
  };
  if (wokScopes.includes('admin')) return ['*'];
  const result = new Set<ApiKeyScope>();
  for (const s of wokScopes) {
    for (const mapped of (map[s] ?? [])) result.add(mapped);
  }
  return result.size > 0 ? [...result] : ['analyze'];
}
