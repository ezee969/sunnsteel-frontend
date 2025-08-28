import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

export const createQueryWrapper = (client?: QueryClient) => {
  const qc =
    client ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

export * from '@testing-library/react';
export { render };
