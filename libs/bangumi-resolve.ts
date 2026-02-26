// Worker base URL for bangumi-data API (GET /bangumi-data?subject=...)
const BGM_DATA_BASE_URL = import.meta.env.WXT_WORKER_URL
if (!BGM_DATA_BASE_URL) {
  throw new Error('Bangumi data URL (WXT_WORKER_URL) is not configured')
}

export interface BangumiDataSite {
  site: string
  id: string
}

export interface BangumiDataItem {
  title: string
  titleTranslate?: Record<string, string[]>
  sites: BangumiDataSite[]
}

export interface BangumiDataJson {
  siteMeta?: {
    bangumi?: {
      title?: string
      urlTemplate?: string
      type?: string
    }
  }
  items: BangumiDataItem[]
}

export interface BgmSubject {
  id: number
  name: string
  name_cn: string
  summary: string
  images: { common: string }
  tags: Array<{ name: string; count?: number }>
  /** Subject page URL from siteMeta.bangumi.urlTemplate with {{id}} replaced by subject id. */
  bangumi_url?: string
}

const BGM_API_BASE = import.meta.env.WXT_BGM_API_BASE
if (!BGM_API_BASE) {
  throw new Error('Bangumi API base URL is not configured')
}

export async function fetchBgmSubject(subjectId: string, urlTemplate?: string): Promise<BgmSubject> {
  const url = `${BGM_API_BASE}/v0/subjects/${subjectId}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`BGM API error: ${res.status} ${res.statusText} for ${url}`)
  }
  const data = await res.json()
  const bangumi_url = urlTemplate ? urlTemplate.replace('{{id}}', String(data.id)) : undefined
  return {
    id: data.id,
    name: data.name ?? '',
    name_cn: data.name_cn ?? '',
    summary: data.summary ?? '',
    images: data.images ?? { common: '' },
    tags: Array.isArray(data.tags) ? data.tags : [],
    bangumi_url,
  }
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
    const dataUrl = `${BGM_DATA_BASE_URL.replace(/\/$/, '')}/bangumi-data?subject=${subjectParam}`
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
