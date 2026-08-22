import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function launchWebAuthFlowAsync(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    browser.identity.launchWebAuthFlow(
      {
        url,
        interactive: true,
      },
      // Chrome will check if redirectUrl match https://<app-id>.chromiumapp.org/*
      (redirectUrl) => {
        if (!redirectUrl) {
          // User cancelled or server error
          reject(new Error('OAuth failed'))
          return
        }
        const url = new URL(redirectUrl)
        const code = url.searchParams.get('code')
        if (!code) {
          reject(new Error('Code not found in redirectUrl'))
          return
        }
        resolve(code)
      },
    )
  })
}

export function setIfChanged<T>(prev: T[], value: T[], setter: React.Dispatch<React.SetStateAction<T[]>>) {
  if (prev.length === value.length && prev.every((item, index) => item === value[index])) {
    return
  }
  setter(value)
}

export function injectCss(path: string) {
  const style = document.createElement('link')
  style.rel = 'stylesheet'
  style.href = path
  style.type = 'text/css'
  document.head.appendChild(style)
  return style
}

export function openAnime1CategoryPage(categoryId: string) {
  const url = `https://anime1.me/?cat=${categoryId}`
  // Open in a new tab
  window.open(url, '_self')
}

export function maxBy<T>(items: T[], iteratee: (item: T) => number): T | undefined {
  let best: T | undefined
  let bestValue = -Infinity
  for (const item of items) {
    const value = iteratee(item)
    if (value > bestValue) {
      best = item
      bestValue = value
    }
  }
  return best
}

export function keyBy<T, K extends keyof T>(items: T[], key: K): Record<string, T> {
  const result: Record<string, T> = {}
  for (const item of items) {
    result[String(item[key])] = item
  }
  return result
}

/** Trailing-edge throttle: fires once per `wait` window with the latest arguments. */
export function throttle<A extends unknown[]>(fn: (...args: A) => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pendingArgs: A | undefined
  return (...args: A) => {
    pendingArgs = args
    if (timer) {
      return
    }
    timer = setTimeout(() => {
      timer = undefined
      const nextArgs = pendingArgs
      pendingArgs = undefined
      if (nextArgs) {
        fn(...nextArgs)
      }
    }, wait)
  }
}
