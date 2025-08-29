import React, { ReactElement } from 'react';
import * as RTL from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface CustomRenderOptions {
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

function render(ui: ReactElement, options?: CustomRenderOptions) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  // @ts-expect-error - Testing library types issue with unknown render
  return RTL.render(ui, { wrapper: Wrapper, ...options });
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
// @ts-expect-error - Testing library types issue
export const { screen, fireEvent, waitFor, act } = RTL;
