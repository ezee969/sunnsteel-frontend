import { ReactElement, PropsWithChildren } from 'react'
import { render as rtlRender } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const render = (ui: ReactElement) => {
  const Wrapper = ({ children }: PropsWithChildren) => <>{children}</>
  return rtlRender(ui, { wrapper: Wrapper })
}

export const createQueryWrapper = (client?: QueryClient) => {
  const queryClient =
    client ??
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  const QueryWrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  QueryWrapper.displayName = 'QueryWrapper'
  return QueryWrapper
}
