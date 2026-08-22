import { createProxyService, registerService } from '@webext-core/proxy-service'

// NOTE: An error occurs in the background script will be serialized via `serialize-error`
// and passed to the content script, non-error objects will be dropped and return `NonError`.
class ProxyService {
  async fetch(url: string, options?: RequestInit) {
    const response = await fetch(url, options)
    return response.json()
  }
}

const PROXY_SERVICE_KEY = 'ProxyService'

export function registerProxyService() {
  return registerService(PROXY_SERVICE_KEY, new ProxyService(), { logger: console })
}

export function getProxyService() {
  return createProxyService<ProxyService>(PROXY_SERVICE_KEY, { logger: console })
}
