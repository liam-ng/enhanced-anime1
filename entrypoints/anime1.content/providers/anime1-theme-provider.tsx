import type { FC, PropsWithChildren } from 'react'
import { createContext, memo, use } from 'react'
import { useEffectOnce } from '../hooks/common/useEffectOnce'
import { useShadowRoot } from './shadow-root-provider'

const Context = createContext<'white' | 'dark' | null>(null)

const DARK_CSS_ID = 'darkmode-css'

/**
 * anime1.me applies dark mode by injecting a `#darkmode-css` stylesheet, then controls it in
 * three ways: absent/disabled means light, `media="all"` means forced dark, and
 * `media="(prefers-color-scheme: dark)"` means auto — follow the system.
 * Read that element rather than the toggle buttons: in auto mode the site never updates the
 * buttons when the system scheme changes.
 */
function getTheme(): 'white' | 'dark' {
  const darkCss = document.getElementById(DARK_CSS_ID) as HTMLLinkElement | null
  if (!darkCss || darkCss.disabled) {
    return 'white'
  }
  const media = darkCss.getAttribute('media')
  if (!media || media === 'all') {
    return 'dark'
  }
  return window.matchMedia(media).matches ? 'dark' : 'white'
}

function useAnime1ThemeObserver(callback: (theme: 'white' | 'dark') => void) {
  useEffectOnce(() => {
    const notify = () => callback(getTheme())

    // Catches the stylesheet being injected/removed and its `media` being rewritten, plus the
    // toggle buttons changing, which is what the site mutates when dark mode is set manually.
    const mutation = new MutationObserver(notify)
    mutation.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['media', 'disabled'],
    })
    const controls = document.querySelector('.darkmode-control')
    if (controls) {
      mutation.observe(controls, {
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      })
    }

    const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.addEventListener('change', notify)

    notify()

    return () => {
      mutation.disconnect()
      systemDark.removeEventListener('change', notify)
    }
  })
}

export const Anime1ThemeProvider: FC<PropsWithChildren> = memo(({ children }) => {
  const [theme, setTheme] = useState<'white' | 'dark'>(() => {
    return getTheme()
  })
  const shadowRoot = useShadowRoot()
  useAnime1ThemeObserver(theme => setTheme(theme))

  console.log('Anime1ThemeProvider', theme)

  useEffect(() => {
    const rootElement = shadowRoot.rootElement
    if (theme === 'dark') {
      rootElement.classList.add('dark')
    }
    else {
      rootElement.classList.remove('dark')
    }
  }, [shadowRoot.rootElement, theme])

  return (
    <Context value={theme}>
      {children}
    </Context>
  )
})

// eslint-disable-next-line react-refresh/only-export-components
export function useAnime1Theme() {
  const context = use(Context)
  if (!context) {
    throw new Error('useBangumiAuth must be used within a BangumiAuthProvider')
  }
  return context
}
