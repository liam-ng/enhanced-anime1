import type { FC, PropsWithChildren } from 'react'
import { createContext, use } from 'react'

const Context = createContext<{
  shadowRoot: ShadowRoot
  rootElement: HTMLElement
} | null>(null)

export const ShadowRootProvider: FC<PropsWithChildren<{ state: {
  shadowRoot: ShadowRoot
  rootElement: HTMLElement
} }>> = ({ children, state }) => {
  return (
    <Context value={state}>
      {children}
    </Context>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useShadowRoot() {
  const context = use(Context)
  if (!context) {
    throw new Error('useShadowRoot must be used within a ShadowRootProvider')
  }
  return context
}
