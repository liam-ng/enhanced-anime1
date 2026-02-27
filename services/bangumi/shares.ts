import type { BangumiDataJson, BgmSubject } from './BangumiService'
import { fetchBgmSubject } from './BangumiService'

// During the response serialization, the status code is not included, so we need to handle it manually
export const ErrorNo = {
  NoSession: 1,
}

export interface BangumiOAuthResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string | null
  refresh_token: string
  user_id: string
}

/**
  - `0`: 未收藏
  - `1`: 想看
  - `2`: 看过
  - `3`: 抛弃
 */
export enum EpisodeCollectionType {
  Uncollected = 0,
  Wish = 1,
  Done = 2,
  Dropped = 3,
}

export const WXT_WORKER_URL = import.meta.env.WXT_WORKER_URL
if (!WXT_WORKER_URL) {
  throw new Error('Bangumi OAuth2 worker URL is not configured')
}
export const WXT_BGM_APP_ID = import.meta.env.WXT_BGM_APP_ID
if (!WXT_BGM_APP_ID) {
  throw new Error('Bangumi app id is not configured')
}

export async function exchangeCode(code: string): Promise<BangumiOAuthResponse> {
  // Must ensure the worker URL is added to host_permissions, otherwise
  // the request will be blocked by CORS
  const response = await fetch(WXT_WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })
  if (!response.ok) {
    throw new Error(`Exchanger server error: ${await response.text()}`)
  }
  const data = await response.json()
  return data as BangumiOAuthResponse
}


/**
 * Resolve series title to BGM subject via worker GET /bangumi-data?subject=...
 * Returns subject or null if any step fails.
 */

export async function resolveBgmSubjectBySeriesTitle(seriesTitle: string): Promise<{
  subject: BgmSubject
  debug: Record<string, unknown>
} | null> {
  const debug: Record<string, unknown> = {
    step: 'start',
    seriesTitle,
  }

  try {
    const subjectParam = encodeURIComponent(seriesTitle.trim())
    const dataUrl = `${WXT_WORKER_URL.replace(/\/$/, '')}/bangumi-data?subject=${subjectParam}`
    debug.step = 'fetchBangumiData'
    const res = await fetch(dataUrl)
    if (!res.ok) {
      if (res.status === 404) {
        console.error('[enhanced-anime1] Bangumi card: no matching subject in bangumi-data', debug)
        return null
      }
      throw new Error(`bangumi-data request failed: ${res.status} ${res.statusText}`)
    }

    const data = (await res.json()) as BangumiDataJson
    const items = data.items ?? []
    if (items.length === 0) {
      console.error('[enhanced-anime1] Bangumi card: no matching subject in bangumi-data', debug)
      return null
    }

    const item = items[0]
    const subjectId = item.sites?.find(s => s.site === 'bangumi')?.id
    debug.subjectId = subjectId ?? null
    if (!subjectId) {
      console.error('[enhanced-anime1] Bangumi card: item has no bangumi site id', debug)
      return null
    }

    debug.step = 'fetchBgmSubject'
    const urlTemplate = data.siteMeta?.bangumi?.urlTemplate
    const subject = await fetchBgmSubject(subjectId, urlTemplate)
    debug.step = 'done'
    return { subject, debug }
  }
  catch (err) {
    debug.step = 'error'
    debug.error = err instanceof Error ? err.message : String(err)
    console.error('[enhanced-anime1] Bangumi card: resolve failed', debug, err)
    return null
  }
}
